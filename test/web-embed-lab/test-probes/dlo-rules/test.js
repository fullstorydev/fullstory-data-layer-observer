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
      results: window._testRuleResults || null, // List of rule results
      failures: []
    }

    if (typeof basis.count === 'number') {
      console.log('Testing DLO rule result count: ' + basis.count + ': ' + window._testRuleResults.length);
      if (basis.count !== window._testRuleResults.length) {
        results.passed = false;
        results.failures.push('Count does not match results length');
      }
    }

    return results
  }
}

window.__welProbes['dlo-rules'] = new DLORulesProbe()
