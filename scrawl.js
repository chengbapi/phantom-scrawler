// Read the Phantom webpage '.version' element text using jQuery and "includeJs"

"use strict";

var url = require('url');
var fs = require('fs');
var webpage = require('webpage');

var Rules = {};
var rulesPath = './rules/';
var list = fs.list(rulesPath);
for(var x = 0; x < list.length; x++){
    if (list[x].slice(-3) == '.js') {
        var raw = fs.read(rulesPath + list[x]);
        try {
            Rules[list[x].slice(0, -3)] = new Function("pathname", /\{([\s\S]*)\}/.exec(raw)[1]);
        } catch (e) {
            throw new Error('parse rule:' + rulesPath + list[x]);
        }
    }
}

function getParseRule(finalLink) {

    var location = url.parse(finalLink);
    var host = location.host;
    var pathname = location.pathname;

    var rule = null;

    if (Rules[host]) {
        rule = Rules[host](pathname) || Rules.default();
    } else {
        rule = Rules.default();
    }

    rule.data =
        'function(){' +
            'try {' +
                'return { state: 0, data: (' + rule.data.toString() + ')()}' +
            '} catch (e) {' +
                'return { state: 1, data: e.toString() };' +
            '}' +
        '}';

    return rule;
}

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 16; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

function downloadImg(page, url, success, error) {

    var startTime = new Date();

    page.viewportSize = {
        width: 1920,
        height: 1080
    };

    // reset onResourceRequested
    page.onResourceRequested = function (request) { };

    page.open(url, function(status) {
        if (status === "success") {
            console.log('download img:' + (new Date() - startTime));

            screenshot(page, 'img', success, error);
        } else {
            error(new Error('download thumbnail'));
        }
    });
}

function screenshot(page, selector, success, error) {
    var startTime = new Date();

    page.evaluateJavaScript("function() { window._selector='"+selector+"'; }");

    page.clipRect = page.evaluate(function () {
        var targetSize = { width: 300, height: 185 };

        var dom = document.querySelector(window._selector);
        var rect = dom.getBoundingClientRect();

        document.body.style.background = '#fff';

        var w = rect.width;
        var h = rect.height;

        // cover
        if (w <= targetSize.width && h <= targetSize.height) {
            return {
                top:    rect.top,
                left:   rect.left,
                width:  w,
                height: h
            };
        }
        else if (w < targetSize.width) {

            dom.style.marginLeft = (targetSize.width - w) / 2;
            dom.style.marginTop = (targetSize.height - h) / 2;

            return {
                top:    rect.top,
                left:   rect.left,
                width:  targetSize.width,
                height: targetSize.height
            };
        }
        else if (h < targetSize.height) {

            dom.style.marginLeft = (targetSize.width - w) / 2;
            dom.style.marginTop = (targetSize.height - h) / 2;

            return {
                top:    rect.top,
                left:   rect.left,
                width:  targetSize.width,
                height: targetSize.height
            };

        }
        else {
            if (w / h > targetSize.width / targetSize.height) {
                var r = targetSize.height / h;

                dom.width = w * r;
                dom.height = targetSize.height;

            } else {
                var r = targetSize.width / w;

                dom.width = targetSize.width;
                dom.height = h * r;
            }

            dom.style.marginLeft = (targetSize.width - dom.width) / 2;
            dom.style.marginTop = (targetSize.height - dom.height) / 2;

            return {
                top:    rect.top,
                left:   rect.left,
                width:  targetSize.width,
                height: targetSize.height
            };
        }

    });

    var filename = './.cache/' + makeid();

    page.render(filename, { format: 'jpeg' });

    console.log('render:' + (new Date() - startTime));
    success(filename);

}

function htmlHandler(page, success, error) {
    var parseRule = getParseRule(page.url);

    page.onResourceRequested = function (request, networkRequest) {
        // 只允许加载js
        if (parseRule.async) {
            if (/\.(css|jpg|jpeg|png|gif)/.test(request.url)) {
                networkRequest.abort();
            } else {
                console.log('download resource:' + request.url);
            }
        } else {
            networkRequest.abort();
        }
    };

    page.onLoadFinished = function(status) {
        page.onLoadFinished = null;
        if (status === "success") {

            console.log('text/html:' + (new Date() - page.startTime));

            // 给可能会运行的慢脚本500ms
            setTimeout(function() {
                console.log(page.content.length)

                if (page.injectJs("jquery.js")) {

                    // console.log(parseRule.data)
                    var ret = page.evaluateJavaScript(parseRule.data);

                    if (ret.state == 0) {

                        console.log('thumbnail:' + ret.data.thumbnail)

                        var onSuccess = function(url) {
                            ret.type = 'html';
                            ret.data.url = page.rawLink;
                            ret.data.thumbnail = [url];
                            success(ret.data);
                        };
                        var onError = function() {
                            ret.type = 'raw';
                            ret.data.url = page.rawLink;
                            ret.data.thumbnail = null;
                            success(ret.data);
                        };

                        //success(ret.data);
                        downloadImg(page, ret.data.thumbnail, onSuccess, onError);
                    } else {
                        error(ret.data)
                    }
                }
            }, 500);

        } else {
            error(new Error('visit:' + page.rawLink))
        }
    };
}

function gifHandler(page, success) {
    page.onLoadFinished = function(status) {
        page.onLoadFinished = null;

        if (status === "success") {

            console.log('image/gif:' + (new Date() - page.startTime));

            screenshot(page, 'img', function(url) {
                success({
                    url: page.rawLink,
                    title: '',
                    description: '',
                    thumbnail: [url]
                });
            }, function() {
                success({
                    url: page.rawLink,
                    title: '',
                    description: '',
                    thumbnail: null
                });
            });
        } else {
            screenshot(page, 'img', function(url) {
                success({
                    url: page.rawLink,
                    title: '',
                    description: '',
                    thumbnail: [url]
                });
            }, function() {
                success({
                    url: page.rawLink,
                    title: '',
                    description: '',
                    thumbnail: null
                });
            });
        }
    };
}

function normalImageHandler(page, success) {
    screenshot(page, 'img', function(url) {
        success({
            type: 'img',
            url: page.rawLink,
            title: '',
            description: '',
            thumbnail: [url],
        });
    }, function() {
        success({
            type: 'raw',
            url: page.rawLink,
            title: '',
            description: '',
            thumbnail: null,
        });
    });
}

module.exports = function(rawLink, success, error) {
    var page = webpage.create();

    page.startTime = new Date();
    page.rawLink = rawLink;

    page.settings.resourceTimeout = 3000;

    page.onConsoleMessage = function(msg) {
        console.log('BROWSER CONSOLE: ' + msg);
    };

    // page.onResourceRequested = function (request) {
    //     console.log('Request ' + JSON.stringify(request, undefined, 4));
    // };

    page.onError = function(msg, trace) {
        var msgStack = ['BROWSER_ERROR: ' + msg];

        if (trace && trace.length) {
            msgStack.push('TRACE:');
            trace.forEach(function(t) {
                msgStack.push(' -> ' + t.file + ': ' + t.line + (t.function ? ' (in function "' + t.function +'")' : ''));
            });
        }
        console.error(msgStack.join('\n'));
    };

    page.open(rawLink);

    page.onInitialized = function() {
        page.onInitialized = null;

        // 经过跳转
        page.rawLink = page.url;

        var isResourceRequest = page.evaluate(function() {
            var child = document.body && document.body.childNodes;
            return child && child.length == 1 && child[0].tagName == 'IMG';
        });

        if (isResourceRequest) {
            normalImageHandler(page, success, error);
        } else {
            htmlHandler(page, success, error);
        }
    }

};

