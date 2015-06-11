/*
 *  Created by Martin Giger
 *
 *  This Source Code Form is subject to the terms of the Mozilla Public License,
 *  v. 2.0. If a copy of the MPL was not distributed with this file, You can
 *  obtain one at http://mozilla.org/MPL/2.0/.
 *
 *  Test resolve module
 */
 
const { resolve, resolveURLIfNeeded } = require("../lib/resolve");
const { Promise: sdkPromise, all } = require("sdk/core/promise");

const EXAMPLES = {
    fixture: [
        "http://humanoids.be/",
        "http://hbsl.ch/",
        // shouldn't use production redirects from feedburner, since it'll probably forge analytics.
        "http://feedproxy.google.com/~r/AndroidPolice/~3/6KV6BiUCLko/story01.htm"
    ],
    result: [
        "http://humanoids.be/",
        "http://humanoids.be/",
        "http://www.androidpolice.com/2015/06/11/international-giveaway-win-one-of-100-airdroid-premium-membership-codes-from-airdroid-and-android-police/"
    ]
};

exports["test resolve signature"] = (assert) => {
    assert.equal(typeof resolve, "function");
    EXAMPLES.fixture.forEach((url) => assert.ok(resolve(url) instanceof sdkPromise));
};

exports["test resolveURLIfNeeded signature"] = (assert) => {
    assert.equal(typeof resolveURLIfNeeded, "function");
    EXAMPLES.fixture.forEach((url) => assert.ok(resolveURLIfNeeded(url) instanceof sdkPromise));
};

exports["test resolve"] = (assert, done) => {
    all(EXAMPLES.fixture.map((fixture, i) => {
        return resolve(fixture).then((url) => {
            return assert.equal(url, EXAMPLES.result[i]);
        });
    })).then(done);
};

require("sdk/test").run(exports);
