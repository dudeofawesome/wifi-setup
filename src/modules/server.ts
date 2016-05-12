var fs = require('fs');
const Utils = require('./utils');

var SERVICE_NAME = 'DEFAULT';

module.exports = (callbacks) => {
    var server = {
        app: undefined,
        appServer: undefined,

        init: (express, app) => {
            return new Promise((resolve) => {
                console.log('Initializing server');
                server.app = app;

                var configPage = fs.readFileSync('./modules/pages/configure.html').toString();
                configPage = Utils.replaceAll(configPage, '{{SERVICE_NAME}}', SERVICE_NAME);

                var finishConfigPage = fs.readFileSync('./modules/pages/finish_configure.html').toString();
                finishConfigPage = Utils.replaceAll(finishConfigPage, '{{SERVICE_NAME}}', SERVICE_NAME);

                app.use(express.static('./modules/pages/static'));

                app.get('/', (req, res) => {
                    res.send(configPage);
                    if (callbacks && callbacks.onClientConfiguring) {
                        callbacks.onClientConfiguring();
                    }
                });

                app.get('/get-questions', function (req, res) {
                    res.send(configPage);
                    if (callbacks && callbacks.onClientConfiguring) {
                        callbacks.onClientConfiguring();
                    }
                });

                app.post('/save-settings', (req, res) => {
                    console.log(req.body);
                    res.send(finishConfigPage);
                    if (callbacks && callbacks.onSetupComplete) {
                        callbacks.onSetupComplete(req.body);
                    }
                });

                resolve();
            });
        },
        start: (port) => {
            return new Promise((resolve) => {
                console.log('Starting server');
                server.appServer = server.app.listen(port, () => {
                    console.log(`Listening on ${server.appServer.address().port}`);
                    resolve();
                });
            });
        },
        stop: () => {
            return new Promise((resolve) => {
                console.log('Stopping server');
                if (server.appServer) {
                    server.appServer.close();
                }

                resolve();
            });
        }
    };

    return server;
};
