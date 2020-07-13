/* eslint-disable no-underscore-dangle, camelcase */
import { DataLayerObserver } from '../observer';

/*
This is where we initialize the DataLayerObserver from this info:

// If true, output from rules are sent only to `console`
// Default is false
window['_dlo_preview'] = false;

// If true, rules will run on page load in addition to when there are changes
// Default is true
window['_dlo_readOnLoad'] = false;

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
      /* eslint-disable no-console */
      console.warn(`window[${propName}] is not an array so will be ignored`);
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

  // Read flags
  let preview = false;
  if (win._dlo_preview === true) {
    preview = true;
  }
  let readOnLoad = false;
  if (win._dlo_readOnLoad === true) {
    readOnLoad = true;
  }

  // Read rules
  const rules = _dlo_collectRules();
  if (rules.length === 0) {
    /* eslint-disable no-console */
    console.warn('No rules for the Data Layer Observer');
  }

  win._dlo_observer = new DataLayerObserver({
    previewMode: preview,
    readOnLoad,
    rules,
  });
}

_dlo_initializeFromWindow();
