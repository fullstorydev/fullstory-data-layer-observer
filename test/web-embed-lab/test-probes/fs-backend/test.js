/**
FullStory test probe sets up interceptors for FS network data.
This means the tests aren't dependent on the FS service.
Currently no tests are run against the captured data.
*/

/** The canned response for /rec/page requests */
const pageResponse = {
	Consented: false,
	CookieDomain: "localhost",
	Blocks: [],
	Watches: [],
	AjaxWatches: [],
	UserIntId: "999",
	SessionIntId: "123",
	PageIntId: "321",
	EmbedToken: "",
	GetCurrentSessionEnabled: true,
	ResourceUploadingEnabled: false,
	AjaxWatcherEnabled: true,
	ConsoleWatcherEnabled: true,
	PageStart: new Date().getTime()
};

/**
FullStoryEndpoint is a base class for mock endpoints for the FullStory backend
*/
class FullStoryEndpoint {
	/* Route the send request to an appropriate handler method */
	handleSend(xhr) {
		let methodName = "handleSend" + xhr._openedMethod;
		if (typeof this[methodName] !== "function") {
			console.error("Unhandled method", xhr._openedMethod, url, ...args);
			return;
		}
		convertXHRToMock(xhr)
		return this[methodName](xhr);
	}
}

/**
Overwrites several properties of XMLHttpRequest so that they are mutable.
This is a dead-simple form of mocking XHR but it works for fs.js.
*/
function convertXHRToMock(xhr){
	Object.defineProperty(xhr, "response", {
		set: function(val) { this._newResponseVal = val; },
		get: function() { return this._newResponseVal; }
	});
	Object.defineProperty(xhr, "responseText", {
		get: function() { return JSON.stringify(this._newResponseVal); }
	});
	Object.defineProperty(xhr, "status", {
		set: function(val) { this._newStatusVal = val; },
		get: function() { return this._newStatusVal; }
	});
	Object.defineProperty(xhr, "statusText", {
		get: function() { return 'OK'; }
	});
	Object.defineProperty(xhr, "readyState", {
		set: function(val) { this._newReadyStateVal = val; },
		get: function() { return this._newReadyStateVal; }
	});
}

// Handles /rec/page
class FullStoryPageEndpoint extends FullStoryEndpoint {
	handleSendPOST(xhr) {
		pageResponse.PageStart = new Date().getTime();
		xhr.response = JSON.parse(JSON.stringify(pageResponse)); // clones pageResponse
		xhr.status = 200;
		xhr.readyState = 4;
		xhr.onreadystatechange()
	}
}

// Handles /rec/bundle
class FullStoryBundleEndpoint extends FullStoryEndpoint {
	handleSendPOST(xhr) {
		xhr.response = {
			BundleTime: new Date().getTime()
		};
		xhr.status = 200;
		xhr.readyState = 4;
		xhr.onreadystatechange()
	}
}

// Handles /rec/newResources
class FullStoryNewResourcesEndpoint extends FullStoryEndpoint {
	handleSendPOST(xhr) {
		xhr.response = {};
		xhr.status = 200;
		xhr.readyState = 4;
		xhr.onreadystatechange()
	}
}

// Handles /rec/uploadResource
class FullStoryUploadResourceEndpoint extends FullStoryEndpoint {
	handleSendPOST(xhr) {
		xhr.response = {};
		xhr.status = 200;
		xhr.readyState = 4;
		xhr.onreadystatechange()
	}
}

// This is the URL for the FS recording backend after being rewritten by the prober
const fsURLPrefix = "/__wel_absolute/rs.fullstory.com/rec/";
// This is the original URL for the FS recording backend
const fsAbsoluteURLPrefix = "https://rs.fullstory.com/rec/"

/**
FullStoryBackendProbe is a test probe that installs a mock FullStory backend
The /rec/except endpoint is hit by setting the `src` attribute on an Image so is not an XHR request
*/
class FullStoryBackendProbe {
	constructor() {
		this.pageEndpoint = new FullStoryPageEndpoint();
		this.bundleEndpoint = new FullStoryBundleEndpoint();
		this.newResourcesEndpoint = new FullStoryNewResourcesEndpoint();
		this.uploadResourceEndpoint = new FullStoryUploadResourceEndpoint();

		const self = this;

		/**
		Monkey patch the XHR.open method so that we can rewrite the fs URLs
		*/
		const originalOpen = XMLHttpRequest.prototype.open;
		XMLHttpRequest.prototype.open = function() {
			if (arguments[1].startsWith(fsURLPrefix)) {
				arguments[1] =
					fsAbsoluteURLPrefix +
					arguments[1].substring(fsURLPrefix.length);
			}
			this._openedMethod = arguments[0]
			this._openedURL = arguments[1]
			return originalOpen.apply(this, arguments);
		}
		/**
		Monkey patch the XHR.send method so that we can intercept recording requests
		*/
		const originalSend = XMLHttpRequest.prototype.send;
		XMLHttpRequest.prototype.send = function() {
			if (this._openedURL.startsWith(fsAbsoluteURLPrefix)) {
				let path = this._openedURL.substring(fsAbsoluteURLPrefix.length);
				if (path.indexOf("?") > 0) {
					path = path.substring(0, path.indexOf("?"));
				}

				// Note: /rec/except is called by setting the `src` attribute of an Image, not by XHR

				switch (path) {
					case "page":
						self.pageEndpoint.handleSend(this);
						return;
					case "bundle":
						self.bundleEndpoint.handleSend(this);
						return;
					case "newResources":
						self.newResourcesEndpoint.handleSend(this);
						return;
					case "uploadResource":
						self.uploadResourceEndpoint.handleSend(this);
						return;
					default:
						console.log("Unknown fs path", path, this._openedURL);
				}
			}
			return originalSend.apply(this, arguments);
		};
	}

	/**
	@return {Object} data collected when the target embed script *is not* loaded
	@return {Object.success} true if the data collection was successful
	*/
	async gatherBaselineData(){
		console.log('Baseline FS backend')
		return { success: true }
	}

	/**
	@return {object} the results of the probe
	*/
	async probe(basis) {
		// Currently does nothing.
		// Eventually may do things like check that data has or hasn't been recorded.
		return { passed: true };
	}
}

window.__welProbes["fs-backend"] = new FullStoryBackendProbe();
