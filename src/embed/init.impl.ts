/* eslint-disable no-underscore-dangle, camelcase */
import { Logger, LogMessageType } from '../utils/logger';
import { startsWith } from '../utils/object';
import { DataLayerObserver } from '../observer';
import {
  defaultDloAttributes, errorType, Telemetry, telemetryType,
} from '../utils/telemetry';

/*
This is where we initialize the DataLayerObserver from this info:

// A custom log appender; a console appender is used if one is not specified
// Default is null
window['_dlo_appender'] = null;

// Log message level, NONE = -1, ERROR = 0, WARN = 1, INFO = 2, DEBUG = 3
// Default is null
window['_dlo_logLevel'] = 1;

// A custom telemetry provider; a default provider is used if not specified
// Default is null
window['_dlo_telemetryProvider'] = null;

// A custom telemetry exporter to be used with the default telemetry provider.
// If a custom telemetry provider is specified, this exporter is not used. A null
// exporter will be used if neither a custom telemetry provider nor a custom telemetry
// exporter are specified
// Default is null
window['_dlo_telemetryExporter'] = null;

// OperatorOptions that is always used just before before the destination
// Default is null
window['_dlo_beforeDestination'] = null;

// Redirects output from a destination to previewDestination when testing rules
// Default is false
window['_dlo_previewMode'] = true;

// The output destination using rule selection syntax for use with previewMode
// Default is null
window['_dlo_previewDestination'] = 'console.log';

// When true reads data layer target(s) and emits the initial value(s)
// Default is false
window['_dlo_readOnLoad'] = true;

// When true validates rules to prevent processing invalid options
// Default is false
window['_dlo_validateRules'] = false;

// A function used to validate the page URL before executing the rules
// Default is null
window['_dlo_urlValidator'] = null;

// Anything on `window` that starts with `_dlo_rules` is read as a rules array
window['_dlo_rules'] = [
// rules can go here
];

window['_dlo_rulesFromAdTeam'] = [
// rules can also go here
];

window['_dlo_rulesFromOpsTeam'] = [
// rules can also go here
];

*/

function _dlo_collectRules(): any[] {
  try {
    const ruleCollectionSpan = Telemetry.startSpan(telemetryType.ruleCollectionSpan);
    const results: any[] = [];
    Object.getOwnPropertyNames(window).forEach((propName) => {
      if (startsWith(propName, '_dlo_rules') === false) return;

      const prop = (window as { [key: string]: any })[propName];
      if (Array.isArray(prop) === false) {
        Logger.getInstance().warn(LogMessageType.RuleInvalid,
          { property: prop, reason: 'Rules list must be an array' });
        return;
      }

      prop.forEach((rule: any) => {
        results.push(rule);
      });
    });
    ruleCollectionSpan.end();
    return results;
  } catch (err) {
    Logger.getInstance().error(LogMessageType.RuleRegistrationError, { reason: `Error: ${err}` });
    Telemetry.error(errorType.ruleRegistrationError);
    return [];
  }
}

export default function _dlo_initializeFromWindow() {
  try {
    const win = (window as { [key: string]: any });

    /*
    This is called so that custom appenders (e.g. 'fullstory') are initialized early enough
    to correctly log initialization errors and recorded stats
    */
    Logger.getInstance(win._dlo_appender);

    // Logging must be initialized before telemetry since telemetry errors may be logged
    if (win._dlo_telemetryProvider) {
      Telemetry.setProvider(win._dlo_telemetryProvider);
    } else {
      Telemetry.setProvider(
        Telemetry
          // An undefined or null telemetry exporter does not send telemetry to any destination
          .withExporter(win._dlo_telemetryExporter)
          .withDefaultAttributes(defaultDloAttributes),
      );
    }

    const initializationSpan = Telemetry.startSpan(telemetryType.initializationSpan);

    if (win._dlo_observer) {
      Logger.getInstance().warn(LogMessageType.ObserverMultipleLoad);
      return;
    }

    // Read rules
    const rules = _dlo_collectRules();
    if (rules.length === 0) {
      Logger.getInstance().warn(LogMessageType.ObserverRulesNone);
    }

    win._dlo_observer = new DataLayerObserver({
      appender: win._dlo_appender || undefined,
      beforeDestination: win._dlo_beforeDestination || undefined,
      logLevel: win._dlo_logLevel,
      previewMode: win._dlo_previewMode === true,
      previewDestination: win._dlo_previewDestination || undefined,
      readOnLoad: win._dlo_readOnLoad === true,
      validateRules: win._dlo_validateRules === true,
      urlValidator: win._dlo_urlValidator || undefined,
      rules,
    });
    initializationSpan.end();
  } catch (err) {
    Logger.getInstance().error(LogMessageType.ObserverInitializationError, { reason: `Error: ${err}` });
    Telemetry.error(errorType.observerInitializationError);
  }
}
