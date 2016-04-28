'use strict';

var os = require('os');
var nedb = require('nedb');
var db = [
    'services'
];

module.exports = {
    init: () => {
        return new Promise((resolve, reject) => {
            let path;
            switch (process.platform) {
                case 'darwin':
                    path = `${os.homedir()}/Library/Application Support/io.orleans.musicly/settings`;
                    break;
                case 'linux':
                    path = `${os.homedir()}/usr/local/share/io.orleans.musicly/settings`;
                    break;
                case 'win32':
                    path = `${os.homedir()}/AppData/Local/io.orleans.musicly/settings`;
                    break;
                default:
                    path = `${os.homedir()}/usr/local/share/io.orleans.musicly/settings`;
            }
            db.forEach((collection) => {
                db[collection] = new nedb({filename: `${path}/${collection}`});
            });

            resolve();
        });
    },
    start: () => {
        return new Promise((resolve, reject) => {
            db.services.loadDatabase((err) => {
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
        return new Promise((resolve, reject) => {
            resolve();
        });
    },

    getToken: (serviceName) => {
        return new Promise((resolve, reject) => {
            db.services.findOne({name: serviceName}, {token: 1}, (err, service) => {
                if (err || !service) {
                    console.log(err);
                    reject(err);
                } else {
                    resolve(service.token);
                }
            });
        });
    },
    setToken: (serviceName, token) => {
        return new Promise((resolve, reject) => {
            db.services.update({name: serviceName}, {$set: {token: token}}, {upsert: true}, (err) => {
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
