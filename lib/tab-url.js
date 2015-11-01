/**
 * Extract the best URL from a tab
 * @author Martin Giger
 * @license MPL-2.0
 * @module tab-url
 */
"use strict";

const { defer } = require("sdk/core/promise");
const qs = require("sdk/querystring");

/**
 * Try to extract the canonical URL from a tab's document
 * @argument {external:sdk/tabs.Tab} tab - Tab to check
 * @return {Promise.<string>} Resolves to a string holding an URL.
 */
let getCanonicalIfAvailable = (tab) => {
    let d = defer(),
        worker = tab.attach({
        contentScriptFile: "./canonical.js"
    });
    worker.port.on("done", function(url) {
        d.resolve(url);
        worker.destroy();
    });
    return d.promise;
};

/**
 * Extracts the url of the article, if the URL is an about:reader displaying an
 * article.
 * @argument {string} url
 * @return {string} The URL
 */
let extractURLFromReader = (url) => {
    if(url.startsWith("about:reader?")) {
        url = qs.parse(URL(url).search.slice(1)).url;
    }
    return url;
};


/**
 * Tries to extract the canonical, else uses the tab's URL and extracts it from
 * the reader if needed.
 * @alias module:tab-url.getURL
 * @argument {external:sdk/tabs.Tab} tab
 * @return {Promise.<string>} The final URL
 */
let getURL = (tab) => {
    return getCanonicalIfAvailable(tab).then((url) =>{
        if(url === null)
            url = tab.url;
        return extractURLFromReader(url)
    });
};
exports.getURL = getURL;
