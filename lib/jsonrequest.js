
var { XMLHttpRequest } = require("sdk/net/xhr");

exports.JSONRequest = function(options) {
    if(options.contentType != "application/json")
        throw new Error("This module can only send JSON data");
    var xhr = new XMLHttpRequest();
    return {
        post: function() {
            xhr.open("POST", options.url);
            xhr.setRequestHeader("Content-Type", "application/json");
            Object.keys(options.headers).forEach(function(header) {
                xhr.setRequestHeader(header, options.headers[header]);
            });
            xhr.onreadystatechange = function onreadystatechange() {
                if (xhr.readyState === 4) {
                  options.onComplete({status: xhr.status});
                }
            };
            xhr.send(JSON.stringify(options.content));
        }
    }
};

