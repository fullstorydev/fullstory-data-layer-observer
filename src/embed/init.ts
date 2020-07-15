/* eslint-disable no-underscore-dangle, camelcase */
import { Logger } from '../utils/logger';
import { DataLayerObserver } from '../observer';

/*
This is where we initialize the DataLayerObserver from this info:

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
  const results: any[] = [];
  Object.getOwnPropertyNames(window).forEach((propName) => {
    if (propName.startsWith('_dlo_rules') === false) return;

    const prop = (window as { [key: string]: any })[propName];
    if (Array.isArray(prop) === false) {
      Logger.getInstance().warn(`window[${propName}] is not an array of Data Layer Observer rules so will be ignored`);
      return;
    }

    prop.forEach((rule: any) => {
      results.push(rule);
    });
  });
  return results;
}

function _dlo_initializeFromWindow() {
  const win = (window as { [key: string]: any });

  if (win._dlo_observer) {
    Logger.getInstance().error('The Data Layer Observer script is loaded twice! Canceling the second load.');
    return;
  }

  // Read rules
  const rules = _dlo_collectRules();
  if (rules.length === 0) {
    Logger.getInstance().warn('No rules for the Data Layer Observer');
  }

  win._dlo_observer = new DataLayerObserver({
    beforeDestination: win._dlo_beforeDestination || undefined,
    previewMode: win._dlo_previewMode === true,
    previewDestination: win._dlo_previewDestination || undefined,
    readOnLoad: win._dlo_readOnLoad === true,
    validateRules: win._dlo_validateRules === true,
    urlValidator: win._dlo_urlValidator || undefined,
    rules,
  });
}

_dlo_initializeFromWindow();
