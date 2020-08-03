/**
Selector count test probe queries each selector in the basis and fails only if the counts match
Example basis:
	{
		"body > h1": 3,
		"#bogus-id": 0,
		"#real-id": 1,
		"relative": {
			"h1": 0,
			"img": 0
		}
	}

Note: relative tests must be against selectors in SelectorCountProbe.BaselineSelectors
*/

class SelectorCountProbe {
	/**
	The return object contains the number of matches to each selector in SelectorCountProbe.BaselineSelectors
	{
		success: true,
		'h1': 1,
		'h2': 10,
		'div > img': 9,
		...
	}
	@return {Object} data collected when the target embed script *is not* loaded
	@return {Object.success} always true
	*/
	async gatherBaselineData(){
		console.log('Selector count baseline')
		const result = {
			success: true,
		}
		for(let selector of SelectorCountProbe.BaselineSelectors) {
			result[selector] = document.querySelectorAll(selector).length
		}
		return result
	}

	/**
	@return {object} the results of the probe
	*/
	async probe(basis, baseline){
		console.log("Probing selector count")
		const results = {
			passed: true,
			failed: [] // List of selectors with the wrong count
		}
		if(!basis) return results

		for(let selector of Object.keys(basis)){
			if(basis.hasOwnProperty(selector) === false) continue
			if(selector === 'relative') continue
			const probeValue = document.querySelectorAll(selector).length
			results[selector] = probeValue

			if(window.__welValueMatches(probeValue, basis[selector]) === false){
				results.passed = false
				results.failed.push(selector)
			}
		}

		if(typeof basis.relative === 'undefined'){
			return results
		}

		for(let selector of Object.keys(basis.relative)){
			if(basis.relative.hasOwnProperty(selector) === false) continue
			if(typeof baseline[selector] !== 'number'){
				results.passed = false
				console.error('Selector-count could not match relative basis selector with baseline: ' + selector)
				results.failed.push('relative: ' + selector)
				continue
			}
			const probeValue = document.querySelectorAll(selector).length
			results['relative: ' + selector] = probeValue - baseline[selector]
			if(window.__welValueMatches(probeValue, basis.relative[selector], baseline[selector]) === false) {
				results.passed = false
				results.failed.push('relative: ' + selector)
			}
		}
		return results
	}
}
SelectorCountProbe.BaselineSelectors = [
	'div > img',
	'h1', 'h2', 'h3', 'h4', 'h5',
	'form', 'input', 'textarea',
	'img', 'video', 'audio',
	'section', 'header', 'footer'
]

window.__welProbes['selector-count'] = new SelectorCountProbe()
