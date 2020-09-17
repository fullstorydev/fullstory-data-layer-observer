/**
DLORulesProbe tests that a well known array contains expected rule results
*/
class DLORulesProbe {
  /**
  @return {Object} data collected when the target embed script *is not* loaded
  @return {Object.success} always true
  */
  async gatherBaselineData(){
    console.log('DLO rules baseline')
    if (Array.isArray(window._testRuleResults) === false) {
      console.error('No window._testRuleResults in the page');
      return { success: false };
    }

    return { success: window._testRuleResults.length === 0 };
  }

  /**
  @return {object} the results of the probe
  */
  async probe(basis, baseline){
    console.log('Probing DLO rules ' + (basis ? 'with' : 'without') + ' basis');
    if(!basis) return { passed: true }
    const results = {
      passed: true,
      results: window._testRuleResults, // List of rule results
      failures: []
    }

    if (typeof basis.count === 'number') {
      console.log('Testing DLO rule result count: ' + basis.count + ': ' + window._testRuleResults.length);
      if (basis.count !== window._testRuleResults.length) {
        results.passed = false;
        results.failures.push('Count does not match results length');
      }
    }

    if (Array.isArray(basis.parameters)) {
      for (let i=0; i < basis.parameters.length; i += 1) {
        const paramInfo = basis.parameters[i];
        if (Array.isArray(paramInfo) && typeof paramInfo[0] === 'number' && typeof paramInfo[1] === 'number') {
          if (results.results[paramInfo[0]][paramInfo[1]] != paramInfo[2]) {
            results.passed = false;
            results.failures.push('Parameter mismatch:', paramInfo);
          }
        } else {
          console.error('The parameters array must contain arrays like [result index, parameter index, value]');
          results.passed = false;
          results.failures.push('The parameters array must contain arrays like [index, value]')
        }
      }
    }

    return results
  }
}

window.__welProbes['dlo-rules'] = new DLORulesProbe()
