'use strict';

var os = require('os');
var nedb = require('nedb');
var db = [
    'services'
];

module.exports = {
    init: function () {
        return new Promise(function (resolve, reject) {
            let path;
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
            db.forEach((collection) => {
                db[collection] = new nedb({filename: path + '/' + collection});
            });

            resolve();
        });
    },
    start: function () {
        return new Promise(function (resolve, reject) {
            db.services.loadDatabase(function (err) {
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
        return new Promise(function (resolve, reject) {
            resolve();
        });
    },

    getToken: function (serviceName) {
        return new Promise(function (resolve, reject) {
            db.services.findOne({name: serviceName}, {token: 1}, function (err, service) {
                if (err || !service) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(service.token);
                }
            });
        });
    },
    setToken: function (serviceName, token) {
        return new Promise(function (resolve, reject) {
            db.services.update({name: serviceName}, {$set: {token: token}}, {upsert: true}, function (err) {
                if (err) {
                    reject(err);
                } else {
                    db.services.persistence.compactDatafile();
                    resolve();
                }
            });
        });
    }
};
