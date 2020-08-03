/**
DOM shape test probe
*/
class DOMShapeProbe {
	/**
	@return {Object} data collected when the target embed script *is not* loaded
	@property {bool} success - true if the data collection was successful
	@property {int} width - DOM width
	@property {int} depth - DOM depth
	*/
	async gatherBaselineData(){
		console.log('Baseline DOM shape')
		const [width, depth] = this._findWidthAndDepth()
		return {
			success: true,
			width: width,
			depth: depth
		}
	}

	/**
	@return {Object} the results of the probe
	@property {bool} passed
	@property {int} width - DOM width
	@property {int} depth - DOM depth
	*/
	async probe(basis, baseline){
		console.log('Probing DOM shape', baseline)

		const [width, depth] = this._findWidthAndDepth()
		const results = {
			passed: true,
			depth: depth,
			width: width
		}
		if(!basis) return results

		for(const prop of ["depth", "width"]){
			if(typeof basis[prop] === 'undefined'){
				continue
			}
			if(window.__welValueMatches(results[prop], basis[prop]) === false){
				results.passed = false
			}
		}

		if(typeof basis["relative"] !== 'object'){
			return results
		}

		const relativeBasis = basis["relative"]
		for(const prop of ["depth", "width"]){
			if(typeof relativeBasis[prop] === 'undefined'){
				continue
			}
			if(window.__welValueMatches(results[prop], relativeBasis[prop], baseline[prop]) === false){
				results.passed = false
			}
		}
		return results
	}

	// returns [width, depth]
	_findWidthAndDepth(){
		const shape = this._findShape(document.body)
		let width = 0;
		for(let i=0; i < shape.rows.length; i++){
			width = Math.max(width, shape.rows[i].length)
		}
		return [width, shape.rows.length]
	}

	_findShape(element, depth=0, results={ rows: [] }){
		if(!results.rows[depth]) results.rows[depth] = []
		results.rows[depth].push(element.children.length)
		for(let i=0; i < element.children.length; i++){
			this._findShape(element.children[i], depth + 1, results)
		}
		return results
	}
}

window.__welProbes['dom-shape'] = new DOMShapeProbe()
