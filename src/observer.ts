import { OperatorOptions, Operator } from "./operator";
import { DataHandler } from "./handler";
import { FunctionOperator } from "./operators";
import { Logger } from "./utils/logger";

export interface DataLayerConfig {
  previewDestination?: string;
  previewMode?: boolean;
  readOnLoad?: boolean;
  rules: DataLayerRule[];
  finalize?: OperatorOptions;
  validateRules?: boolean;
  urlValidator?: (url: string | undefined) => boolean;
};

export interface DataLayerRule {
  source: string | any;
  operators?: OperatorOptions[];
  destination: string | Function;
  readOnLoad?: boolean;
  url?: string;
}

export class DataLayerObserver {

  private operators: { [key: string]: any } = { // TODO (van) type the class value in the map
    function: FunctionOperator,
  };

  handlers: DataHandler[] = [];

  constructor(private config: DataLayerConfig = {
    rules: [],
    previewMode: false,
    readOnLoad: false,
    validateRules: true,
  }) {
    const { rules } = config;
    if (rules) {
      rules.forEach((rule: DataLayerRule) => this.processRule(rule));
    }
  }

  addHandler(path: string): DataHandler {
    const handler = new DataHandler(path);
    this.handlers.push(handler);

    return handler;
  }

  addOperator<O extends OperatorOptions>(handler: DataHandler, options: O) {
    const { name } = options;

    if (this.operators[name]) {
      const operator = new this.operators[name](options);

      if (this.config.validateRules) {
        operator.validate();
      }

      handler.push(operator);
    } else {
      // NOTE to be save, remove the handler so incomplete data processing does not occur
      this.removeHandler(handler);
      throw new Error(`Data handler removed because operator ${name} not found`);
    }
  }

  private isUrlValid(url: string | undefined) {
    const { urlValidator } = this.config;
    return urlValidator ? urlValidator(url) : url ? RegExp(url).test(window.location.href) : true;
  }

  processRule(rule: DataLayerRule) {
    const { finalize, previewMode, readOnLoad: globalReadOnLoad } = this.config;

    const {
      source,
      operators = [],
      destination,
      readOnLoad: ruleReadOnLoad,
      url,
    } = rule;

    // rule properties override global ones
    const readOnLoad = ruleReadOnLoad ? ruleReadOnLoad : globalReadOnLoad;

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

      try {
        // sequentially add the operators to the handler
        for (const options of operators) {
          this.addOperator(handler, options);
        }

        // optionally finalize all rules, which is useful if all data needs conversion before
        // being sent to a destination
        if (finalize) {
          this.addOperator(handler, finalize);
        }

        // end with destination
        const { previewDestination } = this.config;
        const func = previewMode ? previewDestination : destination;
        this.addOperator(handler, { name: 'function', func });

      } catch (err) {
        Logger.getInstance().error(`Failed to create operators`, source);
        console.error(err.message);

        this.removeHandler(handler);
      }

      // FIXME (van) this will be delegated to PropertyListeners when available
      // if the rule creator wants to fire the initial value for a property, do it
      if (readOnLoad) {
        try {
          // this could error if a function is supplied to readOnLoad
          handler.fireEvent();
        } catch (err) {
          Logger.getInstance().error(`Failed to read on load`, source);
        }
      }
    } catch (err) {
      Logger.getInstance().error(`Failed to create data handler`, source);
    }
  }

  registerOperator(name: string, operator: typeof Operator) {
    if (this.operators[name]) {
      throw new Error(`Operator ${name} already exists`);
    } else {
      this.operators[name] = operator;
    }
  }

  removeHandler(handler: DataHandler) {
    const i = this.handlers.indexOf(handler);
    if (i > -1) {
      this.handlers.splice(i, 1);
    }
  }
}