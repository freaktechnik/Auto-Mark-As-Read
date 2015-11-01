/**
 * Test tab-url module
 * @author Martin Giger
 * @license MPL-2.0
 */
"use strict";

const { getURL } = require("../lib/tab-url");
const tabs = require("sdk/tabs");
const { when } = require("sdk/event/utils");

exports["test getURL"] = function*(assert) {
    const testURL = "https://example.com/";
    tabs.open({url: testURL});
    yield when(tabs, "activate");
    yield when(tabs.activeTab, "ready");

    let url = yield getURL(tabs.activeTab);
    assert.equal(url, testURL, "URL extracted matches");

    tabs.activeTab.close();
};

require("sdk/test").run(exports);
