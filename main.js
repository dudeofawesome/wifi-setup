require('es6-promise').polyfill();

String.prototype.replaceAll = function (find, replace) {
    return this.replace(new RegExp(find, 'g'), replace);
};




var bodyParser = require('body-parser');

var database;
var wifiManager = require('./modules/wifi-manager')();
var server = require('./modules/server')({
    onClientConfiguring: function () {
        console.log('onClientConfiguring');
    },
    onSetupComplete: function (settings) {
        console.log('onSetupComplete');
        console.log(settings);
        wifiManager.client.connect(settings.wifiSSID, settings.wifiPassword).then(function () {
            database.setWifiCreds(settings.wifiSSID, settings.wifiPassword);
            server.stop();
        }).catch(function () {
            console.log('Failed to connect using new creds');
        });
    }
});

module.exports = function (SERVICE_NAME, express, app, _database) {
    if (!express) {
        express = require('express');
    }
    if (!app) {
        app = express();
    }
    database = _database;
    if (!database) {
        database = require('./modules/database');
        database.init().then(function () {
            database.start();
        });
    }

    var wifiSetup = {
        init: function (callbacks) {
            return new Promise(function (resolve) {
                if (module.exports.callbacks) {
                    module.exports.callbacks = callbacks;
                }

                app.use(bodyParser.json());
                app.use(bodyParser.urlencoded({
                    extended: true
                }));

                Promise.all([wifiManager.init(), server.init(express, app)]).then(function () {
                    resolve();
                }).catch(function (errs) {
                    console.log('Something failed to initialize');
                    console.log(errs);
                });
            });
        },
        start: function () {
            return new Promise(function (resolve) {
                database.getWifiCreds().then(function (creds) {
                    wifiManager.client.connect(creds.SSID, creds.password).then(function () {
                        if (module.exports.callbacks && module.exports.callbacks.onConnectToWIFI) {
                            module.exports.callbacks.onConnectToWIFI(creds.SSID, '10.0.0.1');
                        }
                        resolve();
                    }).catch(function (err) {
                        console.log(err);
                        wifiSetup.startConfigServer();
                        resolve();
                    });
                }).catch(function () {
                    wifiSetup.startConfigServer();
                    resolve();
                });
            });
        },
        stop: function () {
            return new Promise(function (resolve) {
                Promise.all([wifiManager.stop()]).then(function () {
                    resolve();
                }).catch(function (errs) {
                    console.log('Something failed to stop');
                    console.log(errs);
                });
            });
        },

        startConfigServer: function () {
            Promise.all([wifiManager.accessPoint.up(SERVICE_NAME, 'testtest'), server.start(8081)]).then(function (SSID, password) {
                if (module.exports.callbacks && module.exports.callbacks.onAPstart) {
                    module.exports.callbacks.onAPstart(SSID, password);
                }
            }).catch(function (errs) {
                console.log(errs);
            });
        }
    };

    return wifiSetup;
};
