/**
 * Test resolve module
 * @author Martin Giger
 * @license MPL-2.0
 */

const { resolve, resolveURLIfNeeded } = require("../lib/resolve");
const { Promise: sdkPromise } = require("sdk/core/promise");

const EXAMPLES = {
    fixture: [
        "http://humanoids.be/",
        "http://hbsl.ch/",
        // shouldn't use production redirects from feedburner, since it'll probably forge analytics.
        "http://feedproxy.google.com/~r/AndroidPolice/~3/6KV6BiUCLko/story01.htm",
        "http://is.gd/w"
    ],
    result: [
        "http://humanoids.be/",
        "http://humanoids.be/",
        "http://www.androidpolice.com/2015/06/11/international-giveaway-win-one-of-100-airdroid-premium-membership-codes-from-airdroid-and-android-police/",
        "http://www.google.com/"
    ]
};

exports["test resolveURLIfNeeded signature"] = (assert) => {
    assert.equal(typeof resolveURLIfNeeded, "function");
    EXAMPLES.fixture.forEach((url) => assert.ok(resolveURLIfNeeded(url) instanceof sdkPromise, "Returns a promise for "+url));
};

exports["test resolveURLIfNeeded"] = function*(assert) {
    for(var i in EXAMPLES.fixture) {
        let url = yield resolveURLIfNeeded(EXAMPLES.fixture[i]);
        assert.equal(url, EXAMPLES.result[i], "URL as expected for "+EXAMPLES.fixture[i]);
    }
};

require("sdk/test").run(exports);
