var url = require('url');
var webserver = require('webserver');
var scrawl = require('./scrawl');
var server = webserver.create();

server.listen('127.0.0.1:3001', function(request, response) {
    var urlObject = url.parse(request.url, true);

    if (urlObject.pathname == "/test") {
        response.statusCode = 200;
        response.write('<html><body>Success!</body></html>');
        response.close();
    } else if (urlObject.pathname == "/scrawl") {
        var startTime = new Date();

        var onerror = function(reason) {
            response.statusCode = 400;
            response.write('{"reason":"' + reason + '"}');
            response.close();
        };

        try {
            var link = urlObject.query.url.replace(/^\s+|\s+$/g, "");

            if (!link.length) {
                return onerror("地址不能为空");
            }

            var u = url.parse(link);

            // miss protocol
            if (!u.protocol) {
                u = url.parse('http://' + link);

                if (!u.host) {
                    return onerror("无法识别该地址");
                } else {
                    link = u.href;
                }
            }

            scrawl(link,
                function(data) {
                    response.statusCode = 200;

                    console.log(JSON.stringify(data))
                    response.write(JSON.stringify(data));
                    response.close();

                    console.log('total:' + (new Date() - startTime));
                },
                function(e) {
                    console.log(e);
                    return onerror("无法识别该地址");
                }
            );
        } catch (e) {
            onError(e.message, e.trace);

            return onerror(e.toString());
        }

    } else {
        response.statusCode = 404;
        response.write('<html><body>Nothing to see here</body></html>');
        response.close();
    }
});

function onError(msg, trace) {
    var msgStack = ['PHANTOM ERROR: ' + msg];
    if (trace && trace.length) {
        msgStack.push('TRACE:');
        trace.forEach(function(t) {
            msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
        });
    }
    //console.error(msgStack.join('\n'));
    console.log(msgStack.join('\n'));
    phantom.exit(1);
};


