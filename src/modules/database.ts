'use strict';

var os = require('os');
if (!os.homedir) {
    os.homedir = () => {
        return process.env.HOME;
    };
}
var nedb = require('nedb');
var db = {
    credentials: undefined
};
// var Promise = require('bluebird');
import * as Promise from 'bluebird';
Promise.onPossiblyUnhandledRejection((error) => {
    throw error;
});

module.exports = (SERVICE_NAME) => {
    var database = {
        init: () => {
            return new Promise((resolve) => {
                var path;
                switch (process.platform) {
                    case 'darwin':
                        path = os.homedir() + `/Library/Application Support/${SERVICE_NAME}/wifi-setup`;
                        break;
                    case 'linux':
                        path = os.homedir() + `/usr/local/share/${SERVICE_NAME}/wifi-setup`;
                        break;
                    case 'win32':
                        path = os.homedir() + `/AppData/Local/${SERVICE_NAME}/wifi-setup`;
                        break;
                    default:
                        path = os.homedir() + `/usr/local/share/${SERVICE_NAME}/wifi-setup`;
                }
                for (let i in db) {
                    db[i] = new nedb({filename: `${path}/${i}`});
                }

                resolve();
            });
        },
        start: () => {
            return new Promise((resolve, reject) => {
                db.credentials.loadDatabase((err) => {
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
        stop: () => {
            return new Promise((resolve) => {
                resolve();
            });
        },

        getWifiCreds: () => {
            return new Promise((resolve, reject) => {
                db.credentials.findOne({}, (err, creds) => {
                    if (err || !creds) {
                        console.log(err);
                        reject(err);
                    } else {
                        resolve(creds);
                    }
                });
            });
        },
        setWifiCreds: (SSID, password) => {
            return new Promise((resolve, reject) => {
                db.credentials.remove({}, {multi: true}, () => {
                    db.credentials.insert({SSID: SSID, password: password}, (err) => {
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
