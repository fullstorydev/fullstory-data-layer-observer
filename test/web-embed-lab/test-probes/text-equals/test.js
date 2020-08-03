/**
Text equals test probe queries each selector in the basis
It fails if there is at least one match and the first match's text values isn't equal to the basis
Example basis:
	{
		"body > h1": "Vanilla",
		"#should-be-empty": "",
		"relative": [
			"h1", "li"
		]
	}

	NOTE: selectors in relative array must also be in TextEqualsProbe.BaselineSelectors
*/
class TextEqualsProbe {
	/**
	@return {Object} data collected when the target embed script *is not* loaded
	@return {Object.success} always true
	*/
	async gatherBaselineData(){
		console.log('Text equals baseline')
		const result = {
			success: true,
		}
		for(const selector of TextEqualsProbe.BaselineSelectors) {
			const matchedElements = document.querySelectorAll(selector)
			result[selector] = Array.from(matchedElements).map(el => {
				return el.innerText || el.innerHTML
			})
		}
		return result
	}

	/**
	@return {object} the results of the probe
	*/
	async probe(basis, baseline){
		console.log("Probing text equals")
		if(!basis) return { passed: true }
		const results = {
			passed: true,
			failed: [] // List of selectors that don't match
		}
		for(let selector of Object.keys(basis)){
			if(basis.hasOwnProperty(selector) === false) continue
			if(selector === 'relative') continue

			results[selector] = this._getText(selector)
			if(results[selector] !== basis[selector]){
				results.passed = false
				results.failed.push(selector)
			}
		}

		if(typeof basis.relative === 'undefined'){
			return results
		}

		// basis.relative is an array (not an object like other probes) of selectors
		for(let selector of basis.relative) {
			if(Array.isArray(baseline[selector]) === false){
				console.error('Unknown baseline value for relative selector: ' + selector)
				results.passed = false
				results.failed.push('relative: ' + selector)
				continue
			}
			let baselineValue = baseline[selector].length > 0 ? baseline[selector][0] : null

			const probeResult = this._getText(selector)
			results['relative: ' + selector] = probeResult

			if(probeResult !== baselineValue){
				console.error('Mismatched probe result (' + probeResult + ') and baseline value: ' + baselineValue + ' for selector ' + selector)
				results.passed = false
				results.failed.push('relative: ' + selector)
				continue
			}
		}

		return results
	}

	/**
	@return (innerText || innerHTML) or null if no selector match
	*/
	_getText(selector){
		const matchedElement = document.querySelector(selector)
		if(matchedElement === null || typeof matchedElement === 'undefined') return null
		return matchedElement.innerText || matchedElement.innerHTML
	}
}
TextEqualsProbe.BaselineSelectors = [
	'h1', 'h2', 'h3', 'h4', 'h5',
	'p', 'li', 'input', 'textarea'
]

window.__welProbes['text-equals'] = new TextEqualsProbe()
