var fs = require('fs');

var SERVICE_NAME = 'DEFAULT';

module.exports = function (callbacks) {
    var appServer;

    var server = {
        init: function (express, app) {
            return new Promise(function (resolve) {
                var configPage = fs.readFileSync('./modules/pages/configure.html').toString();
                configPage = configPage.replaceAll('{{SERVICE_NAME}}', SERVICE_NAME);

                var finishConfigPage = fs.readFileSync('./modules/pages/finish_configure.html').toString();
                finishConfigPage = finishConfigPage.replaceAll('{{SERVICE_NAME}}', SERVICE_NAME);

                app.use(express.static('./pages/static'));

                app.get('/', function (req, res) {
                    res.send(configPage);
                    if (callbacks && callbacks.onClientConfiguring) {
                        callbacks.onClientConfiguring();
                    }
                });

                app.post('/finishConfig/', function (req, res) {
                    console.log(req.body);
                    serviceData = req.body;
                    configured = true;
                    res.send(finishConfigPage);
                    if (callbacks && callbacks.onSetupComplete) {
                        callbacks.onSetupComplete(req.body);
                    }
                    module.exports.start();
                });

                resolve();
            });
        },
        start: function (port) {
            return new Promise(function (resolve) {
                appServer = app.listen(port, function () {
                    console.log('Listening on ' + appServer.address().port);
                    resolve();
                });
            });
        },
        stop: function () {
            return new Promise(function (resolve) {
                if (appServer) {
                    appServer.close();
                }

                resolve();
            });
        }
    };

    return server;
};
