import { OperatorOptions, Operator } from './operator';
import { BuiltinOptions, OperatorFactory } from './factory';
import DataHandler from './handler';
import { Logger } from './utils/logger';
import { FunctionOperator } from './operators';

/**
 * DataLayerConfig provides global settings for a DataLayerObserver.
 *
 * Required
 *  rules: a list of pre-configured DataLayerRules
 * Optional
 *  beforeDestination: OperatorOptions that is always used just before before the destination
 *  previewMode: redirects output from a destination to previewDestination when testing rules
 *  previewDestination: output destination using selection syntax for with previewMode
 *  readOnLoad: when true reads data layer target(s) and emit the initial value(s)
 *  validateRules: when true validates rules to prevent processing invalid options
 *  urlValidator: a function used to validate a DataLayerRule's `url`
 */
export interface DataLayerConfig {
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
 *  destination: destination function using selector syntax
 * Optional
 *  debug: true if the rule should print debug for each Operator transformation
 *  operators: list of OperatorOptions to transform data before a destination
 *  readOnLoad: rule-specific readOnLoad (see DataLayerConfig readOnLoad)
 *  url: regular expression used to enable the rule when the page URL matches
 */
export interface DataLayerRule {
  debug?: boolean;
  source: string;
  operators?: OperatorOptions[];
  destination: string;
  readOnLoad?: boolean;
  url?: string;
}

/**
 * DataLayerObserver creates listeners and handlers to process data layer events.
 * A DataLayerObserver can be pre-configured using a DataLayerConfig with pre-built rules or
 * programmatically built on a page.
 */
export class DataLayerObserver {
  private customOperators: { [key: string]: Operator } = {};

  handlers: DataHandler[] = [];

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
    const { rules } = config;
    if (rules) {
      rules.forEach((rule: DataLayerRule) => this.processRule(rule));
    }
  }

  /**
   * Creates and adds a DataHandler.
   * @param selector data layer target selector syntax
   */
  addHandler(selector: string): DataHandler {
    const handler = new DataHandler(selector);
    this.handlers.push(handler);

    return handler;
  }

  /**
   * Appends an Operator to the existing list for a given DataHandler. Data will be transformed
   * sequentially by iterating through the list of Operators. If an error occurs when creating or
   * adding the operator, the DataHandler will be removed to prevent unexpected data processing.
   * @param handler the DataHandler to add the operator to
   * @param options the OperatorOptions used to configure the Operator
   * @throws an error if ruleValidation is enabled an the OperatorOptions are invalid
   */
  addOperator(handler: DataHandler, operator: Operator) {
    if (this.config.validateRules) {
      try {
        operator.validate();
      } catch (err) {
        this.removeHandler(handler);
        throw new Error(`Data handler removed because ${err.message}`);
      }
    }

    handler.push(operator);
  }

  /**
   * Gets an Operator if it has already been registered. If not, create the Operator from the factory.
   * @param options the OperatorOptions used to locate or create the Operator
   */
  private getOperator(options: OperatorOptions) {
    const { name } = options;
    return this.customOperators[name] ? this.customOperators[name]
      : OperatorFactory.create(name, options as BuiltinOptions);
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
   * Processes a DataLayerRule. Assuming the rule's `url` is valid, this will result in the rule
   * being parsed, adding a DataHandler with any Operators, and registering a source and
   * destination. If an error occurs when processing, the DataHandler will be removed
   * to prevent unexpected data processing.
   * @param rule the DataLayerRule to parse and process
   * @throws errors if the rule has missing data or an error occurs during processing
   */
  processRule(rule: DataLayerRule) {
    const { beforeDestination, previewMode, readOnLoad: globalReadOnLoad } = this.config;

    const {
      debug,
      source,
      operators = [],
      destination,
      readOnLoad: ruleReadOnLoad,
      url,
    } = rule;

    // rule properties override global ones
    const readOnLoad = ruleReadOnLoad || globalReadOnLoad;

    if (!source || !destination) {
      Logger.getInstance().error(`Rule is missing ${source ? 'destination' : 'source'}`, source);
      return;
    }

    // check the rule is valid for the url
    if (!this.isUrlValid(url)) {
      return;
    }

    try {
      const handler = this.addHandler(source);
      handler.debug = !!debug;

      try {
        // sequentially add the operators to the handler
        operators.forEach((options) => {
          const operator = this.getOperator(options);
          this.addOperator(handler, operator);
        });

        // optionally perform a final transformation
        // useful if every rule needs the same operator run before the destination
        if (beforeDestination) {
          const operator = this.getOperator(beforeDestination);
          this.addOperator(handler, operator);
        }

        // end with destination
        const { previewDestination = 'console.log' } = this.config;
        const func = previewMode ? previewDestination : destination;
        this.addOperator(handler, new FunctionOperator({ name: 'function', func }));
      } catch (err) {
        Logger.getInstance().error('Failed to create operators', source);
        this.removeHandler(handler);
      }

      // TODO (van) this will be delegated to PropertyListeners when available
      // if the rule creator wants to fire the initial value for a property, do it
      if (readOnLoad) {
        try {
          // this could error if a function is supplied to readOnLoad
          handler.fireEvent();
        } catch (err) {
          Logger.getInstance().error('Failed to read on load', source);
        }
      }
    } catch (err) {
      Logger.getInstance().error('Failed to create data handler', source);
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
   * Removes a previously added DataHandler.
   * @param handler the DataHandler to be removed
   */
  removeHandler(handler: DataHandler) {
    const i = this.handlers.indexOf(handler);
    if (i > -1) {
      this.handlers.splice(i, 1);
    }
  }
}