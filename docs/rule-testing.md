# Rule Testing

It is often easier to test out DLO rules on your site without having to actually add them to the website code first.   This can be done by using a Developer Console and entering in Javascript snippets that represent rules.  

If you are testing on a page that already has DLO loaded, you'll want to make sure to set DLO into preview mode, and then you can register individual rules.  This can be done as such:

```   
    window['_dlo_observer'].config.previewMode = true;
    window['_dlo_observer'].registerRule( { <someRule> } );
```

If you are testing on a page that does not have DLO loaded, you can load DLO manually.  In this case, you can either setup rules into a window expando that starts with `_dlo_rules`, for example `window[_dlo_rules_testing] = [ <somerules> ]` or you can load DLO manually and then manually register rules as above.   To manually load DLO you can do the following:

```
 window['_dlo_appender'] = 'console';
 window['_dlo_beforeDestination'] = [{ name: 'convert', enumerate: true, index: -1 }, { name: 'suffix' }, { name: 'insert', value: 'dlo', position: -1 }];
 window['_dlo_previewMode'] = true;
 window['_dlo_readOnLoad'] = true;
 window['_dlo_validateRules'] = true;
 window['_dlo_logLevel'] = 1;
  (function (d, script) {
   script = d.createElement('script');
   script.type = 'text/javascript';
   script.async = true;
   script.src = 'https://edge.fullstory.com/datalayer/v1/latest.js';
   d.getElementsByTagName('head')[0].appendChild(script);
 }(document));
```

Here is an example snippet that combines both approaches to detect whether DLO is already loaded on the page and take the appropriate action.  

```
// add your rules here
window['_dlo_rules_testing'] = [{
  "id": "fs-gtg-event",
  "source": "dataLayer",
  "operators": [
    { "name": "query", "select": "$[(0,1,2)]" },
    { "name": "query", "select": "$[?(0=event)]" },
    { "name": "flatten" },
    { "name": "rename", "properties": { "0": "gtgCommand", "1": "gtgAction" } },
    { "name": "query", "select": "$[?(gtgCommand!^gtm)]" },
    { "name": "query", "select": "$[?(gtgCommand!=optimize.domChange)]" },
    { "name": "query", "select": "$[?(ecommerce=undefined)]" },
    { "name": "insert", "select": "gtgAction" }
  ],
  "destination": "FS.event"
}];

// Look for DLO on page and take approprate action to load the rules 
if (window['_dlo_observer']) {
 window['_dlo_observer'].config.previewMode = true;
 window['_dlo_rules_testing'].forEach(function (rule) {
   window['_dlo_observer'].registerRule(rule);
 });
} else {
 window['_dlo_appender'] = 'console';
 window['_dlo_beforeDestination'] = [{ name: 'convert', enumerate: true, index: -1 }, { name: 'suffix' }, { name: 'insert', value: 'dlo', position: -1 }];
 window['_dlo_previewMode'] = true;
 window['_dlo_readOnLoad'] = true;
 window['_dlo_validateRules'] = true;
 window['_dlo_logLevel'] = 1;
  (function (d, script) {
   script = d.createElement('script');
   script.type = 'text/javascript';
   script.async = true;
   script.src = 'https://edge.fullstory.com/datalayer/v1/latest.js';
   d.getElementsByTagName('head')[0].appendChild(script);
 }(document));
}

```