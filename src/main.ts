var bodyParser = require('body-parser');

import * as Promise from 'bluebird';
Promise.onPossiblyUnhandledRejection((error) => {
    throw error;
});

var database;
var wifiManager = require('./modules/wifi-manager')();
var server = require('./modules/server')({
    onClientConfiguring: () => {
        console.log('onClientConfiguring');
    },
    onSetupComplete: (settings) => {
        console.log('onSetupComplete');
        console.log(settings);
        wifiManager.accessPoint.down().then(() => {
            wifiManager.client.connect(settings.wifiSSID, settings.wifiPassword).then(() => {
                database.setWifiCreds(settings.wifiSSID, settings.wifiPassword);
                if (module.exports.callbacks && module.exports.callbacks.onConnectToWIFI) {
                    module.exports.callbacks.onConnectToWIFI(settings.wifiSSID, '10.0.0.1');
                }
                server.stop();
            }).catch(() => {
                console.log('Failed to connect using new creds');
            });
        });
    }
});

module.exports = (SERVICE_NAME, password, express, app, _database) => {
    if (!express) {
        express = require('express');
    }
    if (!app) {
        app = express();
    }
    database = _database;
    if (!database) {
        database = require('./modules/database')(SERVICE_NAME);
        database.init().then(() => {
            database.start();
        });
    }

    var wifiSetup = {
        init: (callbacks) => {
            return new Promise((resolve) => {
                if (module.exports.callbacks) {
                    module.exports.callbacks = callbacks;
                }

                app.use(bodyParser.json());
                app.use(bodyParser.urlencoded({
                    extended: true
                }));

                Promise.all([wifiManager.init(), server.init(express, app)]).then(() => {
                    resolve();
                }).catch((errs) => {
                    console.log('Something failed to initialize');
                    console.log(errs);
                });
            });
        },
        start: () => {
            return new Promise((resolve) => {
                database.getWifiCreds().then((creds) => {
                    console.log('creds');
                    console.log(creds);
                    wifiManager.client.connect(creds.SSID, creds.password).then(() => {
                        if (module.exports.callbacks && module.exports.callbacks.onConnectToWIFI) {
                            module.exports.callbacks.onConnectToWIFI(creds.SSID, '10.0.0.1');
                        }
                        resolve();
                    }).catch((err) => {
                        console.log(err);
                        wifiSetup.startConfigServer();
                        resolve();
                    });
                }).catch(() => {
                    wifiSetup.startConfigServer();
                    resolve();
                });
            });
        },
        stop: () => {
            return new Promise((resolve) => {
                Promise.all([wifiManager.stop()]).then(() => {
                    resolve();
                }).catch((errs) => {
                    console.log('Something failed to stop');
                    console.log(errs);
                });
            });
        },

        startConfigServer: () => {
            Promise.all([wifiManager.accessPoint.up(SERVICE_NAME, password), server.start(8081)]).then((responses) => {
                if (module.exports.callbacks && module.exports.callbacks.onAPstart) {
                    module.exports.callbacks.onAPstart(responses[0].SSID, responses[0].password);
                }
            }).catch((errs) => {
                console.log(errs);
            });
        }
    };

    return wifiSetup;
};
