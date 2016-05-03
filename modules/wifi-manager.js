var exec = require('child_process').exec;
var fs = require('fs');
var utils = require('./utils');

var noSudoMessage = 'The wifi-setup module requires root permissions in order to modify system config files.\n' +
    '    Please try running node as root';

module.exports = function () {
    var wifi = {
        init: function () {
            return new Promise(function (resolve) {
                resolve();
            });
        },
        stop: function () {
            return new Promise(function (resolve) {
                wifi.accessPoint.down();
                resolve();
            });
        },

        accessPoint: {
            status: 'down',
            up: function (SSID, password) {
                return new Promise(function (resolve, reject) {
                    console.log('Turning AP on');
                    console.log('SSID: ' + SSID);
                    console.log('password: ' + password);
                    if (wifi.client.status !== 'down') {
                        resolve();
                    } else {
                        wifi.configFiles.all.setAP(SSID, password).then(function () {
                            exec('/etc/init.d/hostapd restart', function (err, stdout) {
                                if (err) {
                                    if (err.message.indexOf('Access denied') > -1) {
                                        console.log(noSudoMessage);
                                    } else {
                                        console.log(err);
                                    }
                                    reject(err);
                                } else {
                                    console.log(stdout);
                                    if (stdout.indexOf('Restarting hostapd') > -1) {
                                        wifi.accessPoint.status = 'up';
                                        resolve({SSID: SSID, password: password});
                                    } else {
                                        wifi.accessPoint.status = 'down';
                                        reject();
                                    }
                                }
                            });
                        });
                    }
                });
            },
            down: function () {
                return new Promise(function (resolve, reject) {
                    console.log('Turning AP off');
                    exec('/etc/init.d/hostapd stop', function (err) {
                        if (err) {
                            if (err.message.indexOf('Access denied') > -1) {
                                console.log(noSudoMessage);
                            } else {
                                console.log(err);
                            }
                            reject();
                        } else {
                            console.log('WiFi AP stopped');
                            wifi.accessPoint.status = 'down';
                            resolve();
                        }
                    });
                });
            }
        },
        client: {
            status: 'down',
            connect: function (SSID, password) {
                return new Promise(function (resolve, reject) {
                    console.log('Connecting to ' + SSID);
                    if (wifi.accessPoint.status !== 'down') {
                        reject();
                    } else {
                        wifi.configFiles.all.setClient(SSID, password).then(function () {
                            exec('ifup wlan0', function (err, stdout) {
                                if (err) {
                                    console.log(err);
                                    reject(err);
                                } else {
                                    console.log(stdout);
                                    wifi.client.status = 'connected';
                                    resolve(stdout);
                                }
                            });
                        });
                    }
                });
            },
            disconnect: function () {
                return new Promise(function (resolve) {
                    console.log('Disconnecting WiFi');
                    exec('ifdown wlan0', function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                    wifi.client.status = 'down';
                    resolve();
                });
            }
        },
        configFiles: {
            defaultHostapd: {
                path: '/etc/default/hostapd',
                setAP: function () {
                    return new Promise(function (resolve, reject) {
                        try {
                            if (fs.readFileSync(wifi.configFiles.defaultHostapd.path).toString().indexOf('# wifi-setup config') === -1) {
                                utils.backupFile(wifi.configFiles.defaultHostapd.path);
                            }
                        } catch (e) {}

                        fs.readFile('./modules/hostapd.fill', function (err, file) {
                            var defaultHostapdConf = file.toString();
                            defaultHostapdConf = defaultHostapdConf.replaceAll('{{path}}', wifi.configFiles.hostapdConf.path);
                            fs.writeFile(wifi.configFiles.defaultHostapd.path, defaultHostapdConf, function (err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    });
                },
                setClient: function () {
                    return new Promise(function (resolve) {
                        utils.backupFile(wifi.configFiles.defaultHostapd.path + '.back', function (path) {
                            return path.split('.back')[0];
                        });
                        resolve();
                    });
                }
            },
            hostapdConf: {
                path: '/etc/hostapd/hostapd.conf',
                setAP: function (SSID, password) {
                    return new Promise(function (resolve, reject) {
                        try {
                            if (fs.readFileSync(wifi.configFiles.hostapdConf.path).toString().indexOf('# wifi-setup config') === -1) {
                                utils.backupFile(wifi.configFiles.hostapdConf.path);
                            }
                        } catch (e) {}

                        fs.readFile('./modules/hostapd.conf.fill', function (err, file) {
                            var hostapdConf = file.toString();
                            hostapdConf = hostapdConf.replaceAll('{{SSID}}', SSID);
                            hostapdConf = hostapdConf.replaceAll('{{password}}', password);
                            hostapdConf = hostapdConf.replaceAll('{{driver}}', 'rtl871xdrv');
                            fs.writeFile(wifi.configFiles.hostapdConf.path, hostapdConf, function (err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    });
                },
                setClient: function () {
                    return new Promise(function (resolve) {
                        utils.backupFile(wifi.configFiles.hostapdConf.path + '.back', function (path) {
                            return path.split('.back')[0];
                        });
                        resolve();
                    });
                }
            },
            interfaces: {
                path: '/etc/network/interfaces',
                setAP: function () {
                    return new Promise(function (resolve, reject) {
                        try {
                            if (fs.readFileSync(wifi.configFiles.interfaces.path).toString().indexOf('# wifi-setup config') === -1) {
                                utils.backupFile(wifi.configFiles.interfaces.path);
                            }
                        } catch (e) {}

                        fs.readFile('./modules/interfaces.ap.fill', function (err, file) {
                            var interfaces = file.toString();
                            interfaces = interfaces.replaceAll('{{IP}}', '192.168.42.1');
                            interfaces = interfaces.replaceAll('{{hostapd}}', wifi.configFiles.hostapdConf.path);
                            fs.writeFile(wifi.configFiles.interfaces.path, interfaces, function (err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    });
                },
                setClient: function (SSID, password) {
                    return new Promise(function (resolve, reject) {
                        try {
                            if (fs.readFileSync(wifi.configFiles.interfaces.path).toString().indexOf('# wifi-setup config') === -1) {
                                utils.backupFile(wifi.configFiles.interfaces.path);
                            }
                        } catch (e) {}

                        fs.readFile('./modules/interfaces.client.fill', function (err, file) {
                            var interfaces = file.toString();
                            interfaces = interfaces.replaceAll('{{SSID}}', SSID);
                            interfaces = interfaces.replaceAll('{{password}}', password);
                            fs.writeFile(wifi.configFiles.interfaces.path, interfaces, function (err) {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    });
                }
            },
            all: {
                setAP: function (SSID, password) {
                    return new Promise(function (resolve, reject) {
                        Promise.all([
                            wifi.configFiles.defaultHostapd.setAP(),
                            wifi.configFiles.hostapdConf.setAP(SSID, password),
                            wifi.configFiles.interfaces.setAP()
                        ]).then(function (results) {
                            resolve(results);
                        }).catch(function (errs) {
                            if (errs[0].code === 'EACCES') {
                                console.log(noSudoMessage);
                            }
                            reject(errs);
                        });
                    });
                },
                setClient: function (SSID, password) {
                    return new Promise(function (resolve, reject) {
                        Promise.all([
                            wifi.configFiles.defaultHostapd.setClient(),
                            wifi.configFiles.hostapdConf.setClient(),
                            wifi.configFiles.interfaces.setClient(SSID, password)
                        ]).then(function (results) {
                            resolve(results);
                        }).catch(function (errs) {
                            if (errs[0].code === 'EACCES') {
                                console.log(noSudoMessage);
                            }
                            reject(errs);
                        });
                    });
                }
            }
        }
    };

    return wifi;
};
