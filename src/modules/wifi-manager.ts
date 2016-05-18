const exec = require('child_process').exec;
const fs = require('fs');
import {Utils} from './utils';
import {Network} from '../types/network.type';

import * as Promise from 'bluebird';
Promise.onPossiblyUnhandledRejection((error) => {
    throw error;
});

function camelize (str) {
    if (str.includes(' ')) {
        return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function(letter, index) {
            return index == 0 ? letter.toLowerCase() : letter.toUpperCase();
        }).replace(/\s+/g, '');
    } else {
        return str.toLowerCase();
    }
}

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

                        fs.readFile(`${__dirname}/hostapd.fill`, (err, file) => {
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
                            fs.readFile(`${__dirname}/hostapd.conf.fill`, (err, file) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve(file);
                                }
                            });
                        });
                        Promise.all([getHostapdFile, wifi.getDriver()]).then((results) => {
                            let file = results[0];
                            // let driver = results[1] || 'rtl871xdrv';
                            let driver = 'rtl871xdrv';

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

                        fs.readFile(`${__dirname}/interfaces.ap.fill`, (err, file) => {
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

                        fs.readFile(`${__dirname}/interfaces.client.fill`, (err, file) => {
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
        },
        scan: () => {
            return new Promise((resolve, reject) => {
                exec('iwlist wlan0 scan', (err, res) => {
                    if (err) {
                        reject(err);
                    } else {
                        res = res.split('wlan0     Scan completed :\n')[1];
                        // Splitting long network list into one network per index
                        let networks = res.split(/\s*Cell [0-9]{2,3} - /g);
                        for (let i in networks) {
                            // Splitting single network string into one key/value per line
                            let splitNetwork = networks[i].split(/\n[\s]*/g);
                            // console.log(splitNetwork);
                            networks[i] = {};
                            for (let j in splitNetwork) {
                                // Splitting key/value string on the first colon
                                let keyVal = splitNetwork[j].replace(':', '\n');
                                keyVal = keyVal.split('\n');
                                if (keyVal[0] && keyVal[0] !== '' && keyVal[0] !== ' ' && keyVal[1]) {
                                    // Camel case ify key
                                    keyVal[0] = camelize(keyVal[0]);
                                    // Strip paranthesis from key
                                    keyVal[0] = keyVal[0].replace('(', '');
                                    keyVal[0] = keyVal[0].replace(')', '');
                                    // Stripping whitespace and double quotes from start and end of values
                                    keyVal[1] = keyVal[1].replace(/^[\s"]/, '');
                                    keyVal[1] = keyVal[1].replace(/[\s"]$/, '');
                                    networks[i][keyVal[0]] = keyVal[1];
                                    networks[i] = new Network(networks[i]);
                                }
                            }
                        }
                        resolve(networks);
                    }
                });
            });
        }
    };

    return wifi;
};
