
class ExceptionsProbe {
	constructor(){
		window._exceptionCount = 0
		window._oldErrorPrototype = window.Error.prototype
		window.Error = function(...params){
			if(this instanceof window.Error === false){
				return new Error(...params)
			}
			window._exceptionCount = window._exceptionCount + 1
			return window._oldErrorPrototype.constructor.call(this, ...params)
		}
		window.Error.prototype = window._oldErrorPrototype
	}

	/**
	@return {Object} data collected when the target embed script *is not* loaded
	@return {Object.success} true if the data collection was successful
	@return {Object.count} total number of throws exceptions
	*/
	async gatherBaselineData(){
		console.log('Exceptions baseline')
		if(typeof window._exceptionCount !== 'number'){
			return {
				success: false,
				error: 'window._exceptionCount does not exist'
			}
		}
		return {
			success: true,
			count: window._exceptionCount
		}
	}

	/**
	@param {object} results - the object on which to set result attributes
	*/
	async probe(basis, baseline){
		const results = {
			passed: true,
			count: window._exceptionCount
		}
		if(!basis){
			return results
		}

		if(typeof basis.count !== 'undefined'){
			if(window.__welValueMatches(results.count, basis.count) === false){
				results.passed = false
			}
		}

		if(typeof basis.relative !== 'object'){
			return results
		}
		if(typeof basis.relative.count === 'undefined'){
			return results
		}

		if(window.__welValueMatches(results.count, basis.relative.count, baseline.count) === false){
			results.passed = false
		}

		return results
	}
}

window.__welProbes['exceptions'] = new ExceptionsProbe()
