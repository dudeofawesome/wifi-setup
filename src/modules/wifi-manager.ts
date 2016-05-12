var exec = require('child_process').exec;
var fs = require('fs');
import {Utils} from './utils';

var noSudoMessage = `The wifi-setup module requires root permissions in order to modify system config files.\n
    Please try running node as root`;

module.exports = () => {
    var wifi = {
        init: () => {
            return new Promise((resolve) => {
                resolve();
            });
        },
        stop: () => {
            return new Promise((resolve) => {
                wifi.accessPoint.down();
                resolve();
            });
        },

        accessPoint: {
            status: 'down',
            up: (SSID, password) => {
                return new Promise((resolve, reject) => {
                    console.log('Turning AP on');
                    console.log(`SSID: ${SSID}`);
                    console.log(`password: ${password}`);
                    if (wifi.client.status !== 'down') {
                        resolve();
                    } else {
                        wifi.configFiles.all.setAP(SSID, password).then(() => {
                            exec('/etc/init.d/hostapd restart', (err, stdout) => {
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
                                        exec('ifdown wlan0 && ifup wlan0', () => {
                                            wifi.accessPoint.status = 'up';
                                            resolve({SSID: SSID, password: password});
                                        });
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
            down: () => {
                return new Promise((resolve, reject) => {
                    console.log('Turning AP off');
                    exec('/etc/init.d/hostapd stop', (err) => {
                        if (err) {
                            if (err.message.indexOf('Access denied') > -1) {
                                console.log(noSudoMessage);
                            } else {
                                console.log(err);
                            }
                            reject();
                        } else {
                            exec('ifdown wlan0', () => {
                                console.log('WiFi AP stopped');
                                wifi.accessPoint.status = 'down';
                                resolve();
                            });
                        }
                    });
                });
            }
        },
        client: {
            status: 'down',
            connect: (SSID, password) => {
                return new Promise((resolve, reject) => {
                    console.log(`Connecting to ${SSID}`);
                    if (wifi.accessPoint.status !== 'down') {
                        reject();
                    } else {
                        wifi.configFiles.all.setClient(SSID, password).then(() => {
                            exec('ifup wlan0', (err, stdout) => {
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
            disconnect: () => {
                return new Promise((resolve) => {
                    console.log('Disconnecting WiFi');
                    exec('ifdown wlan0', (err) => {
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
                setAP: () => {
                    return new Promise((resolve, reject) => {
                        try {
                            if (fs.readFileSync(wifi.configFiles.defaultHostapd.path).toString().indexOf('# wifi-setup config') === -1) {
                                Utils.backupFile(wifi.configFiles.defaultHostapd.path);
                            }
                        } catch (e) {}

                        fs.readFile('./modules/hostapd.fill', (err, file) => {
                            let defaultHostapdConf = file.toString();
                            defaultHostapdConf = Utils.replaceAll(defaultHostapdConf, '{{path}}', wifi.configFiles.hostapdConf.path);
                            fs.writeFile(wifi.configFiles.defaultHostapd.path, defaultHostapdConf, (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    });
                },
                setClient: () => {
                    return new Promise((resolve) => {
                        Utils.backupFile(wifi.configFiles.defaultHostapd.path + '.back', (path) => {
                            return path.split('.back')[0];
                        });
                        resolve();
                    });
                }
            },
            hostapdConf: {
                path: '/etc/hostapd/hostapd.conf',
                setAP: (SSID, password) => {
                    return new Promise((resolve, reject) => {
                        try {
                            if (fs.readFileSync(wifi.configFiles.hostapdConf.path).toString().indexOf('# wifi-setup config') === -1) {
                                Utils.backupFile(wifi.configFiles.hostapdConf.path);
                            }
                        } catch (e) {}

                        let getHostapdFile = new Promise((resolve, reject) => {
                            fs.readFile('./modules/hostapd.conf.fill', (err, file) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(file);
                                }
                            });
                        });
                        Promise.all([getHostapdFile, wifi.getDriver()]).then((results) => {
                            let file = results[0];
                            let driver = results[1] || 'rtl871xdrv';

                            var hostapdConf = file.toString();
                            hostapdConf = Utils.replaceAll(hostapdConf, '{{SSID}}', SSID);
                            hostapdConf = Utils.replaceAll(hostapdConf, '{{password}}', password);
                            hostapdConf = Utils.replaceAll(hostapdConf, '{{driver}}', driver);
                            fs.writeFile(wifi.configFiles.hostapdConf.path, hostapdConf, (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    });
                },
                setClient: () => {
                    return new Promise((resolve) => {
                        Utils.backupFile(wifi.configFiles.hostapdConf.path + '.back', (path) => {
                            return path.split('.back')[0];
                        });
                        resolve();
                    });
                }
            },
            interfaces: {
                path: '/etc/network/interfaces',
                setAP: () => {
                    return new Promise((resolve, reject) => {
                        try {
                            if (fs.readFileSync(wifi.configFiles.interfaces.path).toString().indexOf('# wifi-setup config') === -1) {
                                Utils.backupFile(wifi.configFiles.interfaces.path);
                            }
                        } catch (e) {}

                        fs.readFile('./modules/interfaces.ap.fill', (err, file) => {
                            var interfaces = file.toString();
                            interfaces = Utils.replaceAll(interfaces, '{{IP}}', '192.168.42.1');
                            interfaces = Utils.replaceAll(interfaces, '{{hostapd}}', wifi.configFiles.hostapdConf.path);
                            fs.writeFile(wifi.configFiles.interfaces.path, interfaces, (err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                        });
                    });
                },
                setClient: (SSID, password) => {
                    return new Promise((resolve, reject) => {
                        try {
                            if (fs.readFileSync(wifi.configFiles.interfaces.path).toString().indexOf('# wifi-setup config') === -1) {
                                Utils.backupFile(wifi.configFiles.interfaces.path);
                            }
                        } catch (e) {}

                        fs.readFile('./modules/interfaces.client.fill', (err, file) => {
                            var interfaces = file.toString();
                            interfaces = Utils.replaceAll(interfaces, '{{SSID}}', SSID);
                            interfaces = Utils.replaceAll(interfaces, '{{password}}', password);
                            fs.writeFile(wifi.configFiles.interfaces.path, interfaces, (err) => {
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
                setAP: (SSID, password) => {
                    return new Promise((resolve, reject) => {
                        Promise.all([
                            wifi.configFiles.defaultHostapd.setAP(),
                            wifi.configFiles.hostapdConf.setAP(SSID, password),
                            wifi.configFiles.interfaces.setAP()
                        ]).then((results) => {
                            resolve(results);
                        }).catch((errs) => {
                            console.log(JSON.stringify(errs));
                            if (errs.code === 'EACCES') {
                                console.log(noSudoMessage);
                            }
                            reject(errs);
                        });
                    });
                },
                setClient: (SSID, password) => {
                    return new Promise((resolve, reject) => {
                        Promise.all([
                            wifi.configFiles.defaultHostapd.setClient(),
                            wifi.configFiles.hostapdConf.setClient(),
                            wifi.configFiles.interfaces.setClient(SSID, password)
                        ]).then((results) => {
                            resolve(results);
                        }).catch((errs) => {
                            if (errs.code === 'EACCES') {
                                console.log(noSudoMessage);
                            }
                            reject(errs);
                        });
                    });
                }
            }
        },
        getDriver: () => {
            return new Promise((resolve, reject) => {
                exec('basename $( readlink /sys/class/net/wlan0/device/driver )', (err, stdout) => {
                    if (err) {
                        reject(err);
                    } else {
                        resolve(stdout);
                    }
                });
            });
        }
    };

    return wifi;
};
