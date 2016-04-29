'use strict';

var os = require('os');
var nedb = require('nedb');
var db = [
    'credentials'
];

module.exports = {
    init: function () {
        return new Promise(function (resolve) {
            var path;
            switch (process.platform) {
                case 'darwin':
                    path = os.homedir() + '/Library/Application Support/io.orleans.musicly/settings';
                    break;
                case 'linux':
                    path = os.homedir() + '/usr/local/share/io.orleans.musicly/settings';
                    break;
                case 'win32':
                    path = os.homedir() + '/AppData/Local/io.orleans.musicly/settings';
                    break;
                default:
                    path = os.homedir() + '/usr/local/share/io.orleans.musicly/settings';
            }
            db.forEach(function (collection) {
                db[collection] = new nedb({filename: path + '/' + collection});
            });

            resolve();
        });
    },
    start: function () {
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
    stop: function () {
        return new Promise(function (resolve) {
            resolve();
        });
    },

    getWifiCreds: function () {
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
    setWifiCreds: function (SSID, password) {
        return new Promise(function (resolve, reject) {
            db.remove({}, { multi: true }, function () {
                db.credentials.insert({SSID: SSID, password: password}, function (err) {
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
