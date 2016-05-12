"use strict";
var exec = require('child_process').exec;
var fs = require('fs');
var utils_1 = require('./utils');
var noSudoMessage = "The wifi-setup module requires root permissions in order to modify system config files.\n\n    Please try running node as root";
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
                    console.log("SSID: " + SSID);
                    console.log("password: " + password);
                    if (wifi.client.status !== 'down') {
                        resolve();
                    }
                    else {
                        wifi.configFiles.all.setAP(SSID, password).then(function () {
                            exec('/etc/init.d/hostapd restart', function (err, stdout) {
                                if (err) {
                                    if (err.message.indexOf('Access denied') > -1) {
                                        console.log(noSudoMessage);
                                    }
                                    else {
                                        console.log(err);
                                    }
                                    reject(err);
                                }
                                else {
                                    console.log(stdout);
                                    if (stdout.indexOf('Restarting hostapd') > -1) {
                                        exec('ifdown wlan0 && ifup wlan0', function () {
                                            wifi.accessPoint.status = 'up';
                                            resolve({ SSID: SSID, password: password });
                                        });
                                    }
                                    else {
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
                            }
                            else {
                                console.log(err);
                            }
                            reject();
                        }
                        else {
                            exec('ifdown wlan0', function () {
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
            connect: function (SSID, password) {
                return new Promise(function (resolve, reject) {
                    console.log("Connecting to " + SSID);
                    if (wifi.accessPoint.status !== 'down') {
                        reject();
                    }
                    else {
                        wifi.configFiles.all.setClient(SSID, password).then(function () {
                            exec('ifup wlan0', function (err, stdout) {
                                if (err) {
                                    console.log(err);
                                    reject(err);
                                }
                                else {
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
                                utils_1.Utils.backupFile(wifi.configFiles.defaultHostapd.path);
                            }
                        }
                        catch (e) { }
                        fs.readFile('./modules/hostapd.fill', function (err, file) {
                            var defaultHostapdConf = file.toString();
                            defaultHostapdConf = utils_1.Utils.replaceAll(defaultHostapdConf, '{{path}}', wifi.configFiles.hostapdConf.path);
                            fs.writeFile(wifi.configFiles.defaultHostapd.path, defaultHostapdConf, function (err) {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    resolve();
                                }
                            });
                        });
                    });
                },
                setClient: function () {
                    return new Promise(function (resolve) {
                        utils_1.Utils.backupFile(wifi.configFiles.defaultHostapd.path + '.back', function (path) {
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
                                utils_1.Utils.backupFile(wifi.configFiles.hostapdConf.path);
                            }
                        }
                        catch (e) { }
                        var getHostapdFile = new Promise(function (resolve, reject) {
                            fs.readFile('./modules/hostapd.conf.fill', function (err, file) {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    resolve(file);
                                }
                            });
                        });
                        Promise.all([getHostapdFile, wifi.getDriver()]).then(function (results) {
                            var file = results[0];
                            var driver = results[1] || 'rtl871xdrv';
                            var hostapdConf = file.toString();
                            hostapdConf = utils_1.Utils.replaceAll(hostapdConf, '{{SSID}}', SSID);
                            hostapdConf = utils_1.Utils.replaceAll(hostapdConf, '{{password}}', password);
                            hostapdConf = utils_1.Utils.replaceAll(hostapdConf, '{{driver}}', driver);
                            fs.writeFile(wifi.configFiles.hostapdConf.path, hostapdConf, function (err) {
                                if (err) {
                                    reject(err);
                                }
                                else {
                                    resolve();
                                }
                            });
                        });
                    });
                },
                setClient: function () {
                    return new Promise(function (resolve) {
                        utils_1.Utils.backupFile(wifi.configFiles.hostapdConf.path + '.back', function (path) {
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
                                utils_1.Utils.backupFile(wifi.configFiles.interfaces.path);
                            }
                        }
                        catch (e) { }
                        fs.readFile('./modules/interfaces.ap.fill', function (err, file) {
                            var interfaces = file.toString();
                            interfaces = utils_1.Utils.replaceAll(interfaces, '{{IP}}', '192.168.42.1');
                            interfaces = utils_1.Utils.replaceAll(interfaces, '{{hostapd}}', wifi.configFiles.hostapdConf.path);
                            fs.writeFile(wifi.configFiles.interfaces.path, interfaces, function (err) {
                                if (err) {
                                    reject(err);
                                }
                                else {
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
                                utils_1.Utils.backupFile(wifi.configFiles.interfaces.path);
                            }
                        }
                        catch (e) { }
                        fs.readFile('./modules/interfaces.client.fill', function (err, file) {
                            var interfaces = file.toString();
                            interfaces = utils_1.Utils.replaceAll(interfaces, '{{SSID}}', SSID);
                            interfaces = utils_1.Utils.replaceAll(interfaces, '{{password}}', password);
                            fs.writeFile(wifi.configFiles.interfaces.path, interfaces, function (err) {
                                if (err) {
                                    reject(err);
                                }
                                else {
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
                            console.log(JSON.stringify(errs));
                            if (errs.code === 'EACCES') {
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
                            if (errs.code === 'EACCES') {
                                console.log(noSudoMessage);
                            }
                            reject(errs);
                        });
                    });
                }
            }
        },
        getDriver: function () {
            return new Promise(function (resolve, reject) {
                exec('basename $( readlink /sys/class/net/wlan0/device/driver )', function (err, stdout) {
                    if (err) {
                        reject(err);
                    }
                    else {
                        resolve(stdout);
                    }
                });
            });
        }
    };
    return wifi;
};

//# sourceMappingURL=data:application/json;base64,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QUFJLENBQUMsQ0FBQzt3QkFDakIsQ0FBQyxDQUFDLENBQUM7b0JBQ1AsQ0FBQyxDQUFDLENBQUM7Z0JBQ1AsQ0FBQzthQUNKO1NBQ0o7UUFDRCxTQUFTLEVBQUU7WUFDUCxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtnQkFDL0IsSUFBSSxDQUFDLDJEQUEyRCxFQUFFLFVBQUMsR0FBRyxFQUFFLE1BQU07b0JBQzFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7d0JBQ04sTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO29CQUNoQixDQUFDO29CQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNKLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQztvQkFDcEIsQ0FBQztnQkFDTCxDQUFDLENBQUMsQ0FBQztZQUNQLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztLQUNKLENBQUM7SUFFRixNQUFNLENBQUMsSUFBSSxDQUFDO0FBQ2hCLENBQUMsQ0FBQyIsImZpbGUiOiJtb2R1bGVzL3dpZmktbWFuYWdlci5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleGVjID0gcmVxdWlyZSgnY2hpbGRfcHJvY2VzcycpLmV4ZWM7XG52YXIgZnMgPSByZXF1aXJlKCdmcycpO1xuaW1wb3J0IHtVdGlsc30gZnJvbSAnLi91dGlscyc7XG5cbnZhciBub1N1ZG9NZXNzYWdlID0gYFRoZSB3aWZpLXNldHVwIG1vZHVsZSByZXF1aXJlcyByb290IHBlcm1pc3Npb25zIGluIG9yZGVyIHRvIG1vZGlmeSBzeXN0ZW0gY29uZmlnIGZpbGVzLlxcblxuICAgIFBsZWFzZSB0cnkgcnVubmluZyBub2RlIGFzIHJvb3RgO1xuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgICB2YXIgd2lmaSA9IHtcbiAgICAgICAgaW5pdDogKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3A6ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHdpZmkuYWNjZXNzUG9pbnQuZG93bigpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFjY2Vzc1BvaW50OiB7XG4gICAgICAgICAgICBzdGF0dXM6ICdkb3duJyxcbiAgICAgICAgICAgIHVwOiAoU1NJRCwgcGFzc3dvcmQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVHVybmluZyBBUCBvbicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgU1NJRDogJHtTU0lEfWApO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgcGFzc3dvcmQ6ICR7cGFzc3dvcmR9YCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh3aWZpLmNsaWVudC5zdGF0dXMgIT09ICdkb3duJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lmaS5jb25maWdGaWxlcy5hbGwuc2V0QVAoU1NJRCwgcGFzc3dvcmQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWMoJy9ldGMvaW5pdC5kL2hvc3RhcGQgcmVzdGFydCcsIChlcnIsIHN0ZG91dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZignQWNjZXNzIGRlbmllZCcpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhub1N1ZG9NZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coc3Rkb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGRvdXQuaW5kZXhPZignUmVzdGFydGluZyBob3N0YXBkJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWMoJ2lmZG93biB3bGFuMCAmJiBpZnVwIHdsYW4wJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWZpLmFjY2Vzc1BvaW50LnN0YXR1cyA9ICd1cCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1NTSUQ6IFNTSUQsIHBhc3N3b3JkOiBwYXNzd29yZH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWZpLmFjY2Vzc1BvaW50LnN0YXR1cyA9ICdkb3duJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkb3duOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1R1cm5pbmcgQVAgb2ZmJyk7XG4gICAgICAgICAgICAgICAgICAgIGV4ZWMoJy9ldGMvaW5pdC5kL2hvc3RhcGQgc3RvcCcsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZignQWNjZXNzIGRlbmllZCcpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cobm9TdWRvTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWMoJ2lmZG93biB3bGFuMCcsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1dpRmkgQVAgc3RvcHBlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWZpLmFjY2Vzc1BvaW50LnN0YXR1cyA9ICdkb3duJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2xpZW50OiB7XG4gICAgICAgICAgICBzdGF0dXM6ICdkb3duJyxcbiAgICAgICAgICAgIGNvbm5lY3Q6IChTU0lELCBwYXNzd29yZCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDb25uZWN0aW5nIHRvICR7U1NJRH1gKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpZmkuYWNjZXNzUG9pbnQuc3RhdHVzICE9PSAnZG93bicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lmaS5jb25maWdGaWxlcy5hbGwuc2V0Q2xpZW50KFNTSUQsIHBhc3N3b3JkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjKCdpZnVwIHdsYW4wJywgKGVyciwgc3Rkb3V0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHN0ZG91dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWZpLmNsaWVudC5zdGF0dXMgPSAnY29ubmVjdGVkJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc3Rkb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkaXNjb25uZWN0OiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdEaXNjb25uZWN0aW5nIFdpRmknKTtcbiAgICAgICAgICAgICAgICAgICAgZXhlYygnaWZkb3duIHdsYW4wJywgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB3aWZpLmNsaWVudC5zdGF0dXMgPSAnZG93bic7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnRmlsZXM6IHtcbiAgICAgICAgICAgIGRlZmF1bHRIb3N0YXBkOiB7XG4gICAgICAgICAgICAgICAgcGF0aDogJy9ldGMvZGVmYXVsdC9ob3N0YXBkJyxcbiAgICAgICAgICAgICAgICBzZXRBUDogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZnMucmVhZEZpbGVTeW5jKHdpZmkuY29uZmlnRmlsZXMuZGVmYXVsdEhvc3RhcGQucGF0aCkudG9TdHJpbmcoKS5pbmRleE9mKCcjIHdpZmktc2V0dXAgY29uZmlnJykgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFV0aWxzLmJhY2t1cEZpbGUod2lmaS5jb25maWdGaWxlcy5kZWZhdWx0SG9zdGFwZC5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZSgnLi9tb2R1bGVzL2hvc3RhcGQuZmlsbCcsIChlcnIsIGZpbGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZGVmYXVsdEhvc3RhcGRDb25mID0gZmlsZS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRIb3N0YXBkQ29uZiA9IFV0aWxzLnJlcGxhY2VBbGwoZGVmYXVsdEhvc3RhcGRDb25mLCAne3twYXRofX0nLCB3aWZpLmNvbmZpZ0ZpbGVzLmhvc3RhcGRDb25mLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZSh3aWZpLmNvbmZpZ0ZpbGVzLmRlZmF1bHRIb3N0YXBkLnBhdGgsIGRlZmF1bHRIb3N0YXBkQ29uZiwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2V0Q2xpZW50OiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgVXRpbHMuYmFja3VwRmlsZSh3aWZpLmNvbmZpZ0ZpbGVzLmRlZmF1bHRIb3N0YXBkLnBhdGggKyAnLmJhY2snLCAocGF0aCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRoLnNwbGl0KCcuYmFjaycpWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBob3N0YXBkQ29uZjoge1xuICAgICAgICAgICAgICAgIHBhdGg6ICcvZXRjL2hvc3RhcGQvaG9zdGFwZC5jb25mJyxcbiAgICAgICAgICAgICAgICBzZXRBUDogKFNTSUQsIHBhc3N3b3JkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmcy5yZWFkRmlsZVN5bmMod2lmaS5jb25maWdGaWxlcy5ob3N0YXBkQ29uZi5wYXRoKS50b1N0cmluZygpLmluZGV4T2YoJyMgd2lmaS1zZXR1cCBjb25maWcnKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVXRpbHMuYmFja3VwRmlsZSh3aWZpLmNvbmZpZ0ZpbGVzLmhvc3RhcGRDb25mLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBnZXRIb3N0YXBkRmlsZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZSgnLi9tb2R1bGVzL2hvc3RhcGQuY29uZi5maWxsJywgKGVyciwgZmlsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZmlsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwoW2dldEhvc3RhcGRGaWxlLCB3aWZpLmdldERyaXZlcigpXSkudGhlbigocmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWxlID0gcmVzdWx0c1swXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZHJpdmVyID0gcmVzdWx0c1sxXSB8fCAncnRsODcxeGRydic7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaG9zdGFwZENvbmYgPSBmaWxlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9zdGFwZENvbmYgPSBVdGlscy5yZXBsYWNlQWxsKGhvc3RhcGRDb25mLCAne3tTU0lEfX0nLCBTU0lEKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3N0YXBkQ29uZiA9IFV0aWxzLnJlcGxhY2VBbGwoaG9zdGFwZENvbmYsICd7e3Bhc3N3b3JkfX0nLCBwYXNzd29yZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9zdGFwZENvbmYgPSBVdGlscy5yZXBsYWNlQWxsKGhvc3RhcGRDb25mLCAne3tkcml2ZXJ9fScsIGRyaXZlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlKHdpZmkuY29uZmlnRmlsZXMuaG9zdGFwZENvbmYucGF0aCwgaG9zdGFwZENvbmYsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldENsaWVudDogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFV0aWxzLmJhY2t1cEZpbGUod2lmaS5jb25maWdGaWxlcy5ob3N0YXBkQ29uZi5wYXRoICsgJy5iYWNrJywgKHBhdGgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aC5zcGxpdCgnLmJhY2snKVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW50ZXJmYWNlczoge1xuICAgICAgICAgICAgICAgIHBhdGg6ICcvZXRjL25ldHdvcmsvaW50ZXJmYWNlcycsXG4gICAgICAgICAgICAgICAgc2V0QVA6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZzLnJlYWRGaWxlU3luYyh3aWZpLmNvbmZpZ0ZpbGVzLmludGVyZmFjZXMucGF0aCkudG9TdHJpbmcoKS5pbmRleE9mKCcjIHdpZmktc2V0dXAgY29uZmlnJykgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFV0aWxzLmJhY2t1cEZpbGUod2lmaS5jb25maWdGaWxlcy5pbnRlcmZhY2VzLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlKCcuL21vZHVsZXMvaW50ZXJmYWNlcy5hcC5maWxsJywgKGVyciwgZmlsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbnRlcmZhY2VzID0gZmlsZS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVyZmFjZXMgPSBVdGlscy5yZXBsYWNlQWxsKGludGVyZmFjZXMsICd7e0lQfX0nLCAnMTkyLjE2OC40Mi4xJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJmYWNlcyA9IFV0aWxzLnJlcGxhY2VBbGwoaW50ZXJmYWNlcywgJ3t7aG9zdGFwZH19Jywgd2lmaS5jb25maWdGaWxlcy5ob3N0YXBkQ29uZi5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcy53cml0ZUZpbGUod2lmaS5jb25maWdGaWxlcy5pbnRlcmZhY2VzLnBhdGgsIGludGVyZmFjZXMsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldENsaWVudDogKFNTSUQsIHBhc3N3b3JkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmcy5yZWFkRmlsZVN5bmMod2lmaS5jb25maWdGaWxlcy5pbnRlcmZhY2VzLnBhdGgpLnRvU3RyaW5nKCkuaW5kZXhPZignIyB3aWZpLXNldHVwIGNvbmZpZycpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBVdGlscy5iYWNrdXBGaWxlKHdpZmkuY29uZmlnRmlsZXMuaW50ZXJmYWNlcy5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZSgnLi9tb2R1bGVzL2ludGVyZmFjZXMuY2xpZW50LmZpbGwnLCAoZXJyLCBmaWxlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGludGVyZmFjZXMgPSBmaWxlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJmYWNlcyA9IFV0aWxzLnJlcGxhY2VBbGwoaW50ZXJmYWNlcywgJ3t7U1NJRH19JywgU1NJRCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJmYWNlcyA9IFV0aWxzLnJlcGxhY2VBbGwoaW50ZXJmYWNlcywgJ3t7cGFzc3dvcmR9fScsIHBhc3N3b3JkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcy53cml0ZUZpbGUod2lmaS5jb25maWdGaWxlcy5pbnRlcmZhY2VzLnBhdGgsIGludGVyZmFjZXMsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWxsOiB7XG4gICAgICAgICAgICAgICAgc2V0QVA6IChTU0lELCBwYXNzd29yZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZmkuY29uZmlnRmlsZXMuZGVmYXVsdEhvc3RhcGQuc2V0QVAoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWZpLmNvbmZpZ0ZpbGVzLmhvc3RhcGRDb25mLnNldEFQKFNTSUQsIHBhc3N3b3JkKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWZpLmNvbmZpZ0ZpbGVzLmludGVyZmFjZXMuc2V0QVAoKVxuICAgICAgICAgICAgICAgICAgICAgICAgXSkudGhlbigocmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJycykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGVycnMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJycy5jb2RlID09PSAnRUFDQ0VTJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhub1N1ZG9NZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2V0Q2xpZW50OiAoU1NJRCwgcGFzc3dvcmQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWZpLmNvbmZpZ0ZpbGVzLmRlZmF1bHRIb3N0YXBkLnNldENsaWVudCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZmkuY29uZmlnRmlsZXMuaG9zdGFwZENvbmYuc2V0Q2xpZW50KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lmaS5jb25maWdGaWxlcy5pbnRlcmZhY2VzLnNldENsaWVudChTU0lELCBwYXNzd29yZClcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pLnRoZW4oKHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycnMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJycy5jb2RlID09PSAnRUFDQ0VTJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhub1N1ZG9NZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZ2V0RHJpdmVyOiAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGV4ZWMoJ2Jhc2VuYW1lICQoIHJlYWRsaW5rIC9zeXMvY2xhc3MvbmV0L3dsYW4wL2RldmljZS9kcml2ZXIgKScsIChlcnIsIHN0ZG91dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc3Rkb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIHdpZmk7XG59O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
