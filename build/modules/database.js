'use strict';

var os = require('os');
if (!os.homedir) {
    os.homedir = function () {
        return process.env.HOME;
    };
}
var nedb = require('nedb');
var db = ['credentials'];
var Promise = require('bluebird');
Promise.onPossiblyUnhandledRejection(function (error) {
    throw error;
});

module.exports = function (SERVICE_NAME) {
    var database = {
        init: function init() {
            return new Promise(function (resolve) {
                var path;
                switch (process.platform) {
                    case 'darwin':
                        path = os.homedir() + ('/Library/Application Support/' + SERVICE_NAME + '/wifi-setup');
                        break;
                    case 'linux':
                        path = os.homedir() + ('/usr/local/share/' + SERVICE_NAME + '/wifi-setup');
                        break;
                    case 'win32':
                        path = os.homedir() + ('/AppData/Local/' + SERVICE_NAME + '/wifi-setup');
                        break;
                    default:
                        path = os.homedir() + ('/usr/local/share/' + SERVICE_NAME + '/wifi-setup');
                }
                db.forEach(function (collection) {
                    db[collection] = new nedb({ filename: path + '/' + collection });
                });

                resolve();
            });
        },
        start: function start() {
            return new Promise(function (resolve, reject) {
                db.credentials.loadDatabase(function (err) {
                    if (err) {
                        console.log(err);
                        reject(err);
                    } else {
                        console.log('Database loaded successfully');
                        resolve();
                    }
                });
            });
        },
        stop: function stop() {
            return new Promise(function (resolve) {
                resolve();
            });
        },

        getWifiCreds: function getWifiCreds() {
            return new Promise(function (resolve, reject) {
                db.credentials.findOne({}, function (err, creds) {
                    if (err || !creds) {
                        console.log(err);
                        reject(err);
                    } else {
                        resolve(creds);
                    }
                });
            });
        },
        setWifiCreds: function setWifiCreds(SSID, password) {
            return new Promise(function (resolve, reject) {
                db.credentials.remove({}, { multi: true }, function () {
                    db.credentials.insert({ SSID: SSID, password: password }, function (err) {
                        if (err) {
                            reject(err);
                        } else {
                            db.credentials.persistence.compactDatafile();
                            resolve();
                        }
                    });
                });
            });
        }
    };

    return database;
};