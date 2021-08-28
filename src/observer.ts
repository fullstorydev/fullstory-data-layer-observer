/* eslint-disable class-methods-use-this */
import { OperatorOptions, Operator } from './operator';
import { BuiltinOptions, OperatorFactory } from './factory';
import DataHandler from './handler';
import {
  Logger, LogAppender, LogMessageType, LogMessage, LogLevel,
} from './utils/logger';
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
 *  logLevel: LogLevel for debugging; levels at this value and below will be logged
 *  previewMode: redirects output from a destination to previewDestination when testing rules
 *  previewDestination: output destination using selection syntax for with previewMode
 *  readOnLoad: when true reads data layer target(s) and emit the initial value(s)
 *  validateRules: when true validates rules to prevent processing invalid options
 *  urlValidator: a function used to validate a DataLayerRule's `url`
 */
export interface DataLayerConfig {
  appender?: string | LogAppender;
  beforeDestination?: OperatorOptions | OperatorOptions[];
  logLevel?: LogLevel;
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
 *  debounce: number of milliseconds to debounce property assignments before handling the event
 *  description: optional description of the rule
 *  debug: true if the rule should print debug for each Operator transformation
 *  monitor: true if property changes or function calls should rerun the operators
 *  operators: list of OperatorOptions to transform data before a destination
 *  readOnLoad: rule-specific readOnLoad (see DataLayerConfig readOnLoad)
 *  url: regular expression used to enable the rule when the page URL matches
 *  waitUntil: waits a desired number of milliseconds or predicate function's truthy return type before registering
 *  maxRetry: maximum number of attempts to search for an `undefined` data layer or test the `waitUntil` predicate
 */
export interface DataLayerRule {
  debounce?: number;
  debug?: boolean;
  source: string;
  operators?: OperatorOptions[];
  destination: string | Function;
  readOnLoad?: boolean;
  url?: string;
  id?: string;
  description?: string;
  monitor?: boolean;
  waitUntil?: number | Function;
  maxRetry?: number;
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

  static DefaultWaitUntil = (target: DataLayerTarget) => {
    const { value } = target;

    // perform supported data layers check
    if (value === undefined && (typeof value !== 'object' || typeof value !== 'function')) {
      return false;
    }
    if (typeof value === 'object') {
      // for object-based data layers, query the data layer to run either the selector or get the value
      // in either case, a data layer with no properties means there's no properties to monitor and we should wait
      const result = target.query();
      return result !== undefined && Object.getOwnPropertyNames(result).length > 0;
    }
    // it's a function, that's enough
    return true;
  };

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
    const startTime = Date.now();
    const { appender, logLevel, rules } = config;
    if (appender) {
      if (typeof appender === 'string') {
        Logger.getInstance(appender);
      } else {
        Logger.getInstance().appender = appender;
      }
    }

    // set the level after the appender is assigned since the first call to getInstance()
    // inits the Logger; else the Logger will use the default appender (e.g. console)
    if (logLevel) {
      Logger.getInstance().level = logLevel;
    }

    if (rules) {
      rules.forEach((rule: DataLayerRule) => this.registerRule(rule));
      Logger.getInstance().record('DLO rule count', { numericValue: rules.length });
    }
    Logger.getInstance().record('DLO constructor time', { numericValue: startTime - Date.now() });
  }

  /**
   * Creates and adds a DataHandler.
   * @param target to the data layer
   * @param debug when true enables debugging of operator transformations
   * @param debounce number of milliseconds to debounce property assignments before handling the event
   */
  private addHandler(target: DataLayerTarget, debug = false,
    debounce = DataHandler.DefaultDebounceTime): DataHandler {
    const handler = new DataHandler(target, debug, debounce);
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
      // when a selector gets used, we know the full path through the data layer and can monitor
      if (selector) {
        MonitorFactory.getInstance().create(subject, property, subjectPath); // monitor the subject for re-assignments
      }

      // NOTE only the properties that would be returned from a query
      // else we'll create events for changed properties that are never included in the data
      const subjectRef = target.value;
      const subjectProps = Object.getOwnPropertyNames(target.query());
      subjectProps.forEach((childProperty: string) => {
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
        const beforeOptions = Array.isArray(beforeDestination) ? beforeDestination : [beforeDestination];
        beforeOptions.forEach((operator) => handler.push(this.getOperator(operator)));
      }

      // end with destination
      const func = previewMode ? previewDestination : destination;
      handler.push(new FunctionOperator({ name: 'function', func }));
    } catch (err) {
      this.removeHandler(handler);
      Logger.getInstance().error(LogMessageType.OperatorError, { operator: JSON.stringify(options) });
      throw err;
    }
  }

  /**
   * Gets an Operator if it has already been registered. If not, create the Operator from the factory.
   * @param options the OperatorOptions used to locate or create the Operator
   * @throws an Error if the `validateRules` setting is true and the `options` are invalid
   */
  private getOperator(options: OperatorOptions) {
    try {
      const { name } = options;
      const operator = this.customOperators[name] ? this.customOperators[name]
        : OperatorFactory.create(name, options as BuiltinOptions);

      if (this.config.validateRules) {
        operator.validate();
      }

      return operator;
    } catch (err) {
      Logger.getInstance().error(LogMessageType.OperatorError, { operator: JSON.stringify(options) });
      throw err;
    }
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
   * @param debounce number of milliseconds to debounce property assignments before handling the event
   * @throws error if an error occurs during handler creation
   */
  registerTarget(
    target: DataLayerTarget,
    options: OperatorOptions[],
    destination: string | Function,
    read = false,
    monitor = true,
    debug = false,
    debounce = DataHandler.DefaultDebounceTime,
  ): DataHandler {
    let workingTarget = target;
    const targetValue = workingTarget.value;

    /**
     * When the target is an Array, we create separate targets for the `push` and `unshift` methods.
     * Some older browsers may not have these methods, so check before trying to shim.
     */
    if (monitor && Array.isArray(targetValue)) {
      if (targetValue.push && targetValue.unshift) {
        this.registerTarget(DataLayerTarget.find(`${target.path}.unshift`), options, destination, false, true,
          debug, debounce);
        workingTarget = DataLayerTarget.find(`${target.path}.push`);
      } else {
        Logger.getInstance().warn(LogMessageType.MonitorCreateError, {
          path: workingTarget.path,
          property: workingTarget.property,
          selector: workingTarget.selector,
          reason: 'Browser does not support push and unshift',
        });
      }
    }

    const handler = this.addHandler(workingTarget, !!debug, debounce);
    this.addOperators(handler, options, destination);

    if (read) {
      // For read-on-load for targeted arrays we do a sort of manual fan-out of the items
      if (Array.isArray(targetValue)) {
        for (let i = 0; i < targetValue.length; i += 1) {
          try {
            handler.fireEvent(targetValue[i]);
          } catch (err) {
            Logger.getInstance().error(LogMessageType.ObserverReadError,
              {
                path: workingTarget.path,
                property: workingTarget.property,
                selector: workingTarget.selector,
                reason: err.message,
              });
          }
        }
      } else if (workingTarget.type === 'object') {
        try {
          handler.fireEvent();
        } catch (err) {
          Logger.getInstance().error(LogMessageType.ObserverReadError,
            {
              path: workingTarget.path,
              property: workingTarget.property,
              selector: workingTarget.selector,
              reason: err.message,
            });
        }
      }
    }

    // NOTE functions are always monitored
    if (monitor || workingTarget.type === 'function') {
      try {
        this.addMonitor(workingTarget);
      } catch (err) {
        Logger.getInstance().warn(LogMessageType.MonitorCreateError,
          {
            path: workingTarget.path,
            property: workingTarget.property,
            selector: workingTarget.selector,
            reason: err.message,
          });
      }
    }

    return handler;
  }

  /**
   *
   * @param snooze Function to test whether to wait again
   * @param awake Function to execute once the wait is over
   * @param timeout Function that gets called in the event of a timeout
   * @param attempt The current attempt to test the snooze function
   * @param wait Time in milliseconds before invoking the awake function or snoozing again
   */
  private sleep(
    snooze: () => boolean,
    awake: () => void,
    timeout: () => void,
    maxRetry = 5,
    attempt = 1,
    wait = 250,
  ) {
    if (attempt > maxRetry) {
      timeout();
      return;
    }

    // exponentially back-off with a slight offset to prevent tight grouping of re-registration
    // NOTE, use `attempt - 1` because the first attempt should be equal to `Math.pow(2, 0)`
    const delay = (2 ** (attempt - 1) * wait) + Math.random();
    if (snooze()) {
      setTimeout(() => {
        this.sleep(snooze, awake, timeout, maxRetry, attempt + 1);
      }, delay);
    } else {
      awake();
    }
  }

  /**
   * Registers a data layer rule. Assuming the rule's `url` is valid, this results in the rule
   * being parsed, adding a DataHandler with any Operators, registering a source and
   * destination, and monitoring for changes or function calls.
   * @param rule to parse and process
   * @throws error if the rule has missing data or an error occurs during processing
   */
  registerRule(rule: DataLayerRule) {
    const { readOnLoad: globalReadOnLoad } = this.config;

    const {
      id = '',
      debounce,
      debug,
      source,
      operators = [],
      destination,
      readOnLoad: ruleReadOnLoad,
      url,
      monitor = true,
      waitUntil = DataLayerObserver.DefaultWaitUntil,
    } = rule;

    // rule properties override global ones
    const readOnLoad = ruleReadOnLoad === undefined ? globalReadOnLoad : ruleReadOnLoad;

    if (!source || !destination) {
      Logger.getInstance().error(LogMessageType.RuleInvalid,
        { rule: id, source, reason: `Missing ${source ? 'destination' : 'source'}` });
      return;
    }

    // check the rule is valid for the url
    if (!this.isUrlValid(url)) {
      return;
    }

    try {
      const register = () => {
        const target = DataLayerTarget.find(source);
        this.registerTarget(target, operators, destination, readOnLoad, monitor, debug, debounce);
      };
      const timeout = () => Logger.getInstance().warn(LogMessageType.RuleRegistrationError, {
        rule: id, source, reason: 'Max Retries Attempted',
      });
      const { maxRetry = 5 } = rule;

      switch (typeof waitUntil) {
        case 'number':
          // NOTE this delay is scheduled *after* the data layer is found to be defined on the page (not after page load)
          setTimeout(() => {
            register();
          }, waitUntil > -1 ? waitUntil : 0); // negative values will schedule immediately
          break;
        case 'function':
          this.sleep(() => !waitUntil(DataLayerTarget.find(source)), register, timeout, maxRetry);
          break;
        default:
          Logger.getInstance().warn(Logger.format(LogMessage.UnsupportedType, typeof waitUntil));
      }
    } catch (err) {
      Logger.getInstance().warn(LogMessageType.RuleRegistrationError, { rule: id, source, reason: err.message });
    }
  }

  /**
   * Registers a custom Operator.
   * @param operator the Operator's class
   * @throws an error if an existing name is used
   */
  registerOperator(name: string, operator: Operator) {
    if (OperatorFactory.hasOperator(name) || this.customOperators[name]) {
      throw new Error(Logger.format(LogMessage.DuplicateValue, name));
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
