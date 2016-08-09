/**
 * Resolve redirects from FeedBurner and thelike
 * @author Martin Giger
 * @license MPL-2.0
 * @module resolve
 */

const { defer } = require("sdk/core/promise");
const { memoize } = require("sdk/lang/functional");
const { Request } = require("sdk/request");
const self = require("sdk/self");
const qs = require("sdk/querystring");

const REDIRECT_URLS = ["feedproxy.google.com", "rss.feedportal.com", "feeds.feedburner.com", "hbsl.ch"];

const LONGURL_USERAGENT = self.name+"/"+self.version;
const headers = {
    "User-Agent": LONGURL_USERAGENT
};
const LONGURL_API_BASE = "http://api.longurl.org/v2/";

const getServices = memoize(() => {
    let { promise, resolve, reject } = defer();

    Request({
        url: LONGURL_API_BASE + "services?format=json",
        headers,
        onComplete: (data) => {
            if(data.status < 300 && data.status !== 0) {
                let services = [];
                resolve(Object.keys(data.json));
            }
            else {
                reject(data);
            }
        }
    }).head();

    return promise;
});

const resolveLongURL = memoize((url) => {
    let { promise, resolve, reject } = defer();

    Request({
        url: LONGURL_API_BASE + "expand?" + qs.stringify({
            format: "json",
            "rel-canonical": 1,
            url
        }),
        headers,
        onComplete: (data) => {
            if(data.status < 300 && data.status !== 0) {
                if("rel-canonical" in data.json) {
                    resolve(data.json["rel-canonical"]);
                }
                else {
                    resolve(data.json["long-url"]);
                }
            }
            else {
                reject(data);
            }
        }
    }).get();

    return promise;
});

const resolveGenericURL = memoize((url) => {
    let { promise, resolve } = defer();

    Request({
        url,
        onComplete: (resp) => {
            resolve(resp.url);
        }
    }).get();

    return promise;
});

exports.resolveURLIfNeeded = (url) => {
    return getServices().then((services) => {
        if(services.some((u) => url.includes(u))) {
            return resolveLongURL(url);
        }
        else if(REDIRECT_URLS.some((u) => url.includes(u))) {
            return resolveGenericURL(url);
        }
        else {
            return url;
        }
    });
};

