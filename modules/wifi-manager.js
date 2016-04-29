var exec = require('child_process').exec;
var fs = require('fs');
var utils = require('./utils');

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
                        wifi.configFiles.all.setAP(SSID, password);

                        exec('/etc/init.d/hostapd restart', function (err, stdout) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(stdout);
                                if (stdout.indexOf('Starting advanced IEEE 802.11 management: hostapd.') > -1) {
                                    wifi.accessPoint.status = 'up';
                                    resolve({SSID: SSID, password: password});
                                } else {
                                    wifi.accessPoint.status = 'down';
                                    reject();
                                }
                            }
                        });
                    }
                });
            },
            down: function () {
                return new Promise(function (resolve) {
                    console.log('Turning AP off');
                    exec('/etc/init.d/hostapd stop', function () {
                        console.log('WiFi AP stopped');
                        wifi.configFiles.all.setClient();
                        wifi.accessPoint.status = 'down';
                        resolve();
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
                        exec('ifconfig wlan0 up && iwconfig wlan0 essid ' + SSID + ' key s:' + password, function (err, stdout) {
                            if (err) {
                                console.log(err);
                            } else {
                                exec('dhclient wlan0', function () {
                                    console.log(stdout);
                                    wifi.client.status = 'connected';
                                    resolve(stdout);
                                });
                                console.log(stdout);
                            }
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
                    try {
                        if (fs.readFileSync(wifi.configFiles.defaultHostapd.path).toString().indexOf('# wifi-setup config') === -1) {
                            utils.backupFile(wifi.configFiles.defaultHostapd.path);
                        }
                    } catch (e) {}

                    var defaultHostapdConf = fs.readFileSync('./modules/hostapd.fill').toString();
                    defaultHostapdConf = defaultHostapdConf.replaceAll('{{path}}', wifi.configFiles.hostapdConf.path);
                    fs.writeFileSync(wifi.configFiles.defaultHostapd.path, defaultHostapdConf);
                },
                setClient: function () {
                    try {
                        utils.backupFile(wifi.configFiles.defaultHostapd.path + '.back', function (path) {
                            return path.split('.back')[0];
                        });
                    } catch (e) {}
                }
            },
            hostapdConf: {
                path: '/etc/hostapd/hostapd.conf',
                setAP: function (SSID, password) {
                    try {
                        if (fs.readFileSync(wifi.configFiles.hostapdConf.path).toString().indexOf('# wifi-setup config') === -1) {
                            utils.backupFile(wifi.configFiles.hostapdConf.path);
                        }
                    } catch (e) {}

                    var hostapdConf = fs.readFileSync('./modules/hostapd.conf.fill').toString();
                    hostapdConf = hostapdConf.replaceAll('{{SSID}}', SSID);
                    hostapdConf = hostapdConf.replaceAll('{{password}}', password);
                    fs.writeFileSync(wifi.configFiles.hostapdConf.path, hostapdConf);
                },
                setClient: function () {
                    try {
                        utils.backupFile(wifi.configFiles.hostapdConf.path + '.back', function (path) {
                            return path.split('.back')[0];
                        });
                    } catch (e) {}
                }
            },
            interfaces: {
                path: '/etc/network/interfaces',
                setAP: function () {
                    try {
                        if (fs.readFileSync(wifi.configFiles.interfaces.path).toString().indexOf('# wifi-setup config') === -1) {
                            utils.backupFile(wifi.configFiles.interfaces.path);
                        }
                    } catch (e) {}

                    var interfaces = fs.readFileSync('./modules/interfaces.fill').toString();
                    interfaces = interfaces.replaceAll('{{IP}}', '192.168.42.1');
                    interfaces = interfaces.replaceAll('{{hostapd}}', wifi.configFiles.hostapdConf.path);
                    fs.writeFileSync(wifi.configFiles.interfaces.path, interfaces);
                },
                setClient: function () {
                    try {
                        utils.backupFile(wifi.configFiles.interfaces.path + '.back', function (path) {
                            return path.split('.back')[0];
                        });
                    } catch (e) {}
                }
            },
            all: {
                setAP: function (SSID, password) {
                    wifi.configFiles.defaultHostapd.setAP();
                    wifi.configFiles.hostapdConf.setAP(SSID, password);
                    wifi.configFiles.interfaces.setAP();
                },
                setClient: function () {
                    wifi.configFiles.defaultHostapd.setClient();
                    wifi.configFiles.hostapdConf.setClient();
                    wifi.configFiles.interfaces.setClient();
                }
            }
        }
    };

    return wifi;
};
