/* eslint-disable class-methods-use-this */
import { OperatorOptions, Operator } from './operator';
import { BuiltinOptions, OperatorFactory } from './factory';
import DataHandler from './handler';
import { Logger, LogAppender } from './utils/logger';
import { FunctionOperator } from './operators';
import DataLayerTarget from './target';
import MonitorFactory from './monitor-factory';

/**
 * DataLayerConfig provides global settings for a DataLayerObserver.
 *
 * Required
 *  rules: a list of pre-configured DataLayerRules
 * Optional
 *  appender: a custom log appender or string alias (e.g. fullstory or console)
 *  beforeDestination: OperatorOptions that is always used just before before the destination
 *  previewMode: redirects output from a destination to previewDestination when testing rules
 *  previewDestination: output destination using selection syntax for with previewMode
 *  readOnLoad: when true reads data layer target(s) and emit the initial value(s)
 *  validateRules: when true validates rules to prevent processing invalid options
 *  urlValidator: a function used to validate a DataLayerRule's `url`
 */
export interface DataLayerConfig {
  appender?: string | LogAppender;
  beforeDestination?: OperatorOptions;
  previewDestination?: string;
  previewMode?: boolean;
  readOnLoad?: boolean;
  rules: DataLayerRule[];
  validateRules?: boolean;
  urlValidator?: (url: string | undefined) => boolean;
}

/**
 * DataLayerRule configures the behavior for a specific data layer target.
 *
 * Required
 *  source: data layer target using selector syntax
 *  destination: destination function using selector syntax or native function
 * Optional
 *  id: optional identifier for the rule
 *  description: optional description of the rule
 *  debug: true if the rule should print debug for each Operator transformation
 *  monitor: true if property changes or function calls should rerun the operators
 *  operators: list of OperatorOptions to transform data before a destination
 *  readOnLoad: rule-specific readOnLoad (see DataLayerConfig readOnLoad)
 *  url: regular expression used to enable the rule when the page URL matches
 */
export interface DataLayerRule {
  debug?: boolean;
  source: string;
  operators?: OperatorOptions[];
  destination: string | Function;
  readOnLoad?: boolean;
  url?: string;
  id?: string;
  description?: string;
  monitor?: boolean;
}

/**
 * DataLayerObserver creates listeners and handlers to process data layer events.
 * A DataLayerObserver can be pre-configured using a DataLayerConfig with pre-built rules or
 * programmatically built on a page.
 */
export class DataLayerObserver {
  private customOperators: { [key: string]: Operator } = {};

  handlers: DataHandler[] = [];

  listeners: { [path: string]: EventListener[] } = {};

  /**
   * Creates a DataLayerObserver. If no DataLayerConfig is provided, the following settings will be
   * used:
   *  previewMode: false
   *  previewDestination: console.log
   *  readOnLoad: false
   *  validateRules: true
   * @param config an optional DataLayerConfig
   */
  constructor(private config: DataLayerConfig = {
    rules: [],
    previewMode: false,
    previewDestination: 'console.log',
    readOnLoad: false,
    validateRules: true,
  }) {
    const { appender, rules } = config;
    if (appender) {
      if (typeof appender === 'string') {
        Logger.getInstance(appender);
      } else {
        Logger.getInstance().appender = appender;
      }
    }

    if (rules) {
      rules.forEach((rule: DataLayerRule) => this.registerRule(rule));
    }
  }

  /**
   * Creates and adds a DataHandler.
   * @param target to the data layer
   * @param debug when true enables debugging of operator transformations
   */
  private addHandler(target: DataLayerTarget, debug = false): DataHandler {
    const handler = new DataHandler(target, debug);
    this.handlers.push(handler);

    return handler;
  }

  /**
   * Adds monitor to a target in the data layer. If a monitor already exists, calling this
   * function will result in a no-op.
   * @param target to add monitors into
   */
  private addMonitor(target: DataLayerTarget) {
    const {
      subject, property, subjectPath, path: targetPath, selector, type,
    } = target;

    if (type === 'function') {
      MonitorFactory.getInstance().create(subject, property, targetPath);
    } else {
      // when a selector gets used, we know the full path through the data layer and can monitor note
      if (selector) {
        MonitorFactory.getInstance().create(subject, property, subjectPath); // monitor the subject for re-assignments
      }

      // monitor all child properties
      // NOTE this results in all properties firing changes but the query result ensures that only desired events
      // are sent to the destination
      const subjectRef = target.value;
      Object.getOwnPropertyNames(subjectRef).forEach((childProperty: string) => {
        MonitorFactory.getInstance().create(subjectRef, childProperty, targetPath);
      });
    }
  }

  /**
   * Appends an Operator to the existing list for a given DataHandler. Data will be transformed
   * sequentially by iterating through the list of Operators. If an error occurs when creating or
   * adding the operator, the DataHandler will be removed to prevent unexpected data processing.
   * @param handler to add operators to
   * @param options for operators used to configure each Operator
   */
  private addOperators(handler: DataHandler, options: OperatorOptions[], destination: string | Function) {
    const { beforeDestination, previewDestination = 'console.log', previewMode } = this.config;

    try {
      // sequentially add the operators to the handler
      options.forEach((optionSet) => {
        handler.push(this.getOperator(optionSet));
      });

      // optionally perform a final transformation
      // useful if every rule needs the same operator run before the destination
      if (beforeDestination) {
        handler.push(this.getOperator(beforeDestination));
      }

      // end with destination
      const func = previewMode ? previewDestination : destination;
      handler.push(new FunctionOperator({ name: 'function', func }));
    } catch (err) {
      this.removeHandler(handler);
      throw err;
    }
  }

  /**
   * Gets an Operator if it has already been registered. If not, create the Operator from the factory.
   * @param options the OperatorOptions used to locate or create the Operator
   * @throws an Error if the `validateRules` setting is true and the `options` are invalid
   */
  private getOperator(options: OperatorOptions) {
    const { name } = options;
    const operator = this.customOperators[name] ? this.customOperators[name]
      : OperatorFactory.create(name, options as BuiltinOptions);

    if (this.config.validateRules) {
      operator.validate();
    }

    return operator;
  }

  /**
   * Checks if a URL (from a rule) is valid. By default, window.location.href is checked, but
   * this can be overridden by updating `urlValidator` in DataLayerConfig.
   * @param url the test string (preferably a regular expression)
   */
  private isUrlValid(url: string | undefined) {
    const { urlValidator } = this.config;

    if (urlValidator) {
      return urlValidator(url);
    }

    return url ? RegExp(url).test(window.location.href) : true;
  }

  /**
   * Registers a data layer target by creating the handler and monitor. This results in the target
   * being inspected, adding a DataHandler with any Operators, registering a source and
   * destination, and monitoring for changes or function calls.
   * @param target from the data layer
   * @param options list of OperatorOptions to transform data before a destination
   * @param destination function using selector syntax or native function
   * @param read when true reads data layer target and emit the initial value
   * @param monitor when true property changes or function calls re-run the operators
   * @param debug when true the rule prints debug for each Operator transformation
   * @throws error if an error occurs during handler creation
   */
  registerTarget(
    target: DataLayerTarget,
    options: OperatorOptions[],
    destination: string | Function,
    read = false,
    monitor = true,
    debug = false,
  ): DataHandler {
    let workingTarget = target;
    const targetValue = workingTarget.value;

    /*
    * We do a bit of magic when monitoring an Array target.
    * We create separate targets for the `push` and `unshift` methods.
    */
    if (monitor && Array.isArray(targetValue)) {
      this.registerTarget(DataLayerTarget.find(`${target.path}.unshift`), options, destination, false, true, debug);
      workingTarget = DataLayerTarget.find(`${target.path}.push`);
    }

    const handler = this.addHandler(workingTarget, !!debug);
    this.addOperators(handler, options, destination);

    if (read) {
      // For read-on-load for targeted arrays we do a sort of manual fan-out of the items
      if (Array.isArray(targetValue)) {
        for (let i = 0; i < targetValue.length; i += 1) {
          try {
            handler.fireEvent(targetValue[i]);
          } catch (err) {
            Logger.getInstance().error('Failed to read-on-load data layer array');
          }
        }
      } else if (workingTarget.type === 'object') {
        try {
          handler.fireEvent();
        } catch (err) {
          Logger.getInstance().error('Failed to read data layer');
        }
      }
    }

    // NOTE functions are always monitored
    if (monitor || workingTarget.type === 'function') {
      try {
        this.addMonitor(workingTarget);
      } catch (err) {
        Logger.getInstance().warn('Monitor creation failed');
      }
    }

    return handler;
  }

  /**
   * Registers a data layer rule. Assuming the rule's `url` is valid, this results in the rule
   * being parsed, adding a DataHandler with any Operators, registering a source and
   * destination, and monitoring for changes or function calls.
   * @param rule to parse and process
   * @throws error if the rule has missing data or an error occurs during processing
   */
  registerRule(rule: DataLayerRule, attempt = 0, wait = 300) {
    const { readOnLoad: globalReadOnLoad } = this.config;

    const {
      id = '',
      debug,
      source,
      operators = [],
      destination,
      readOnLoad: ruleReadOnLoad,
      url,
      monitor = true,
    } = rule;

    // rule properties override global ones
    const readOnLoad = ruleReadOnLoad || globalReadOnLoad;

    if (!source || !destination) {
      Logger.getInstance().error(`Rule ${id} is missing ${source ? 'destination' : 'source'}`, source);
      return;
    }

    // check the rule is valid for the url
    if (!this.isUrlValid(url)) {
      return;
    }

    try {
      const target = DataLayerTarget.find(source);
      this.registerTarget(target, operators, destination, readOnLoad, monitor, debug);
    } catch (_) {
      // schedule subsequent attempts at (attempt * wait) later
      setTimeout(() => {
        try {
          const target = DataLayerTarget.find(source);
          this.registerTarget(target, operators, destination, readOnLoad, monitor, debug);
        } catch (err) {
          if (attempt > 3) {
            Logger.getInstance().error('Rule failed to register', { rule: id, source, reason: err.message });
          } else {
            this.registerRule(rule, attempt + 1);
          }
        }
      }, attempt * wait);
    }
  }

  /**
   * Registers a custom Operator.
   * @param operator the Operator's class
   * @throws an error if an existing name is used
   */
  registerOperator(name: string, operator: Operator) {
    if (OperatorFactory.hasOperator(name) || this.customOperators[name]) {
      throw new Error(`Operator ${name} already exists`);
    }

    this.customOperators[name] = operator;
  }

  /**
   * Removes a previously added DataHandler. This will also remove any corresponding event listener.
   * @param handler to be removed
   */
  removeHandler(handler: DataHandler) {
    handler.stop();

    const i = this.handlers.indexOf(handler);
    if (i > -1) {
      this.handlers.splice(i, 1);
    }
  }
}
