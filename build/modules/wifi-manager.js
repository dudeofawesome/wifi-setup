var exec = require('child_process').exec;
var fs = require('fs');
var Utils = require('./utils');
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
                                Utils.backupFile(wifi.configFiles.defaultHostapd.path);
                            }
                        }
                        catch (e) { }
                        fs.readFile('./modules/hostapd.fill', function (err, file) {
                            var defaultHostapdConf = file.toString();
                            defaultHostapdConf = Utils.replaceAll(defaultHostapdConf, '{{path}}', wifi.configFiles.hostapdConf.path);
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
                        Utils.backupFile(wifi.configFiles.defaultHostapd.path + '.back', function (path) {
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
                                Utils.backupFile(wifi.configFiles.hostapdConf.path);
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
                            hostapdConf = Utils.replaceAll(hostapdConf, '{{SSID}}', SSID);
                            hostapdConf = Utils.replaceAll(hostapdConf, '{{password}}', password);
                            hostapdConf = Utils.replaceAll(hostapdConf, '{{driver}}', driver);
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
                        Utils.backupFile(wifi.configFiles.hostapdConf.path + '.back', function (path) {
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
                                Utils.backupFile(wifi.configFiles.interfaces.path);
                            }
                        }
                        catch (e) { }
                        fs.readFile('./modules/interfaces.ap.fill', function (err, file) {
                            var interfaces = file.toString();
                            interfaces = Utils.replaceAll(interfaces, '{{IP}}', '192.168.42.1');
                            interfaces = Utils.replaceAll(interfaces, '{{hostapd}}', wifi.configFiles.hostapdConf.path);
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
                                Utils.backupFile(wifi.configFiles.interfaces.path);
                            }
                        }
                        catch (e) { }
                        fs.readFile('./modules/interfaces.client.fill', function (err, file) {
                            var interfaces = file.toString();
                            interfaces = Utils.replaceAll(interfaces, '{{SSID}}', SSID);
                            interfaces = Utils.replaceAll(interfaces, '{{password}}', password);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vZHVsZXMvd2lmaS1tYW5hZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLElBQUksSUFBSSxHQUFHLE9BQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDekMsSUFBSSxFQUFFLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ3ZCLElBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUUvQixJQUFJLGFBQWEsR0FBRyxnSUFDZ0IsQ0FBQztBQUVyQyxNQUFNLENBQUMsT0FBTyxHQUFHO0lBQ2IsSUFBSSxJQUFJLEdBQUc7UUFDUCxJQUFJLEVBQUU7WUFDRixNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPO2dCQUN2QixPQUFPLEVBQUUsQ0FBQztZQUNkLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztRQUNELElBQUksRUFBRTtZQUNGLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU87Z0JBQ3ZCLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ3hCLE9BQU8sRUFBRSxDQUFDO1lBQ2QsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBRUQsV0FBVyxFQUFFO1lBQ1QsTUFBTSxFQUFFLE1BQU07WUFDZCxFQUFFLEVBQUUsVUFBQyxJQUFJLEVBQUUsUUFBUTtnQkFDZixNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPLEVBQUUsTUFBTTtvQkFDL0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxlQUFlLENBQUMsQ0FBQztvQkFDN0IsT0FBTyxDQUFDLEdBQUcsQ0FBQyxXQUFTLElBQU0sQ0FBQyxDQUFDO29CQUM3QixPQUFPLENBQUMsR0FBRyxDQUFDLGVBQWEsUUFBVSxDQUFDLENBQUM7b0JBQ3JDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLE1BQU0sQ0FBQyxDQUFDLENBQUM7d0JBQ2hDLE9BQU8sRUFB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NEJBQ0QsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO3dCQUNqQixDQUFDLENBQUMsQ0FBQztvQkFDUCxDQUFDLENBQUMsQ0FBQztnQkFDUCxDQUFDO2FBQ0o7U0FDSjtRQUNELFNBQVMsRUFBRTtZQUNQLE1BQU0sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNO2dCQUMvQixJQUFJLENBQUMsMkRBQTJELEVBQUUsVUFBQyxHQUFHLEVBQUUsTUFBTTtvQkFDMUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzt3QkFDTixNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7b0JBQ2hCLENBQUM7b0JBQUMsSUFBSSxDQUFDLENBQUM7d0JBQ0osT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDO29CQUNwQixDQUFDO2dCQUNMLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO0tBQ0osQ0FBQztJQUVGLE1BQU0sQ0FBQyxJQUFJLENBQUM7QUFDaEIsQ0FBQyxDQUFDIiwiZmlsZSI6Im1vZHVsZXMvd2lmaS1tYW5hZ2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGV4ZWMgPSByZXF1aXJlKCdjaGlsZF9wcm9jZXNzJykuZXhlYztcbnZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG52YXIgVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XG5cbnZhciBub1N1ZG9NZXNzYWdlID0gYFRoZSB3aWZpLXNldHVwIG1vZHVsZSByZXF1aXJlcyByb290IHBlcm1pc3Npb25zIGluIG9yZGVyIHRvIG1vZGlmeSBzeXN0ZW0gY29uZmlnIGZpbGVzLlxcblxuICAgIFBsZWFzZSB0cnkgcnVubmluZyBub2RlIGFzIHJvb3RgO1xuXG5tb2R1bGUuZXhwb3J0cyA9ICgpID0+IHtcbiAgICB2YXIgd2lmaSA9IHtcbiAgICAgICAgaW5pdDogKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3A6ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgIHdpZmkuYWNjZXNzUG9pbnQuZG93bigpO1xuICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFjY2Vzc1BvaW50OiB7XG4gICAgICAgICAgICBzdGF0dXM6ICdkb3duJyxcbiAgICAgICAgICAgIHVwOiAoU1NJRCwgcGFzc3dvcmQpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnVHVybmluZyBBUCBvbicpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgU1NJRDogJHtTU0lEfWApO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhgcGFzc3dvcmQ6ICR7cGFzc3dvcmR9YCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh3aWZpLmNsaWVudC5zdGF0dXMgIT09ICdkb3duJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lmaS5jb25maWdGaWxlcy5hbGwuc2V0QVAoU1NJRCwgcGFzc3dvcmQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWMoJy9ldGMvaW5pdC5kL2hvc3RhcGQgcmVzdGFydCcsIChlcnIsIHN0ZG91dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZignQWNjZXNzIGRlbmllZCcpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhub1N1ZG9NZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdChlcnIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coc3Rkb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzdGRvdXQuaW5kZXhPZignUmVzdGFydGluZyBob3N0YXBkJykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWMoJ2lmZG93biB3bGFuMCAmJiBpZnVwIHdsYW4wJywgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWZpLmFjY2Vzc1BvaW50LnN0YXR1cyA9ICd1cCc7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoe1NTSUQ6IFNTSUQsIHBhc3N3b3JkOiBwYXNzd29yZH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWZpLmFjY2Vzc1BvaW50LnN0YXR1cyA9ICdkb3duJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkb3duOiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1R1cm5pbmcgQVAgb2ZmJyk7XG4gICAgICAgICAgICAgICAgICAgIGV4ZWMoJy9ldGMvaW5pdC5kL2hvc3RhcGQgc3RvcCcsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyLm1lc3NhZ2UuaW5kZXhPZignQWNjZXNzIGRlbmllZCcpID4gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cobm9TdWRvTWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGV4ZWMoJ2lmZG93biB3bGFuMCcsICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1dpRmkgQVAgc3RvcHBlZCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWZpLmFjY2Vzc1BvaW50LnN0YXR1cyA9ICdkb3duJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY2xpZW50OiB7XG4gICAgICAgICAgICBzdGF0dXM6ICdkb3duJyxcbiAgICAgICAgICAgIGNvbm5lY3Q6IChTU0lELCBwYXNzd29yZCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGBDb25uZWN0aW5nIHRvICR7U1NJRH1gKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpZmkuYWNjZXNzUG9pbnQuc3RhdHVzICE9PSAnZG93bicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgd2lmaS5jb25maWdGaWxlcy5hbGwuc2V0Q2xpZW50KFNTSUQsIHBhc3N3b3JkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBleGVjKCdpZnVwIHdsYW4wJywgKGVyciwgc3Rkb3V0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHN0ZG91dCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWZpLmNsaWVudC5zdGF0dXMgPSAnY29ubmVjdGVkJztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc3Rkb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkaXNjb25uZWN0OiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdEaXNjb25uZWN0aW5nIFdpRmknKTtcbiAgICAgICAgICAgICAgICAgICAgZXhlYygnaWZkb3duIHdsYW4wJywgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB3aWZpLmNsaWVudC5zdGF0dXMgPSAnZG93bic7XG4gICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgY29uZmlnRmlsZXM6IHtcbiAgICAgICAgICAgIGRlZmF1bHRIb3N0YXBkOiB7XG4gICAgICAgICAgICAgICAgcGF0aDogJy9ldGMvZGVmYXVsdC9ob3N0YXBkJyxcbiAgICAgICAgICAgICAgICBzZXRBUDogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZnMucmVhZEZpbGVTeW5jKHdpZmkuY29uZmlnRmlsZXMuZGVmYXVsdEhvc3RhcGQucGF0aCkudG9TdHJpbmcoKS5pbmRleE9mKCcjIHdpZmktc2V0dXAgY29uZmlnJykgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFV0aWxzLmJhY2t1cEZpbGUod2lmaS5jb25maWdGaWxlcy5kZWZhdWx0SG9zdGFwZC5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZSgnLi9tb2R1bGVzL2hvc3RhcGQuZmlsbCcsIChlcnIsIGZpbGUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZGVmYXVsdEhvc3RhcGRDb25mID0gZmlsZS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZmF1bHRIb3N0YXBkQ29uZiA9IFV0aWxzLnJlcGxhY2VBbGwoZGVmYXVsdEhvc3RhcGRDb25mLCAne3twYXRofX0nLCB3aWZpLmNvbmZpZ0ZpbGVzLmhvc3RhcGRDb25mLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZzLndyaXRlRmlsZSh3aWZpLmNvbmZpZ0ZpbGVzLmRlZmF1bHRIb3N0YXBkLnBhdGgsIGRlZmF1bHRIb3N0YXBkQ29uZiwgKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2V0Q2xpZW50OiAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgVXRpbHMuYmFja3VwRmlsZSh3aWZpLmNvbmZpZ0ZpbGVzLmRlZmF1bHRIb3N0YXBkLnBhdGggKyAnLmJhY2snLCAocGF0aCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBwYXRoLnNwbGl0KCcuYmFjaycpWzBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBob3N0YXBkQ29uZjoge1xuICAgICAgICAgICAgICAgIHBhdGg6ICcvZXRjL2hvc3RhcGQvaG9zdGFwZC5jb25mJyxcbiAgICAgICAgICAgICAgICBzZXRBUDogKFNTSUQsIHBhc3N3b3JkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmcy5yZWFkRmlsZVN5bmMod2lmaS5jb25maWdGaWxlcy5ob3N0YXBkQ29uZi5wYXRoKS50b1N0cmluZygpLmluZGV4T2YoJyMgd2lmaS1zZXR1cCBjb25maWcnKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgVXRpbHMuYmFja3VwRmlsZSh3aWZpLmNvbmZpZ0ZpbGVzLmhvc3RhcGRDb25mLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxldCBnZXRIb3N0YXBkRmlsZSA9IG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZSgnLi9tb2R1bGVzL2hvc3RhcGQuY29uZi5maWxsJywgKGVyciwgZmlsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoZmlsZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwoW2dldEhvc3RhcGRGaWxlLCB3aWZpLmdldERyaXZlcigpXSkudGhlbigocmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxldCBmaWxlID0gcmVzdWx0c1swXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgZHJpdmVyID0gcmVzdWx0c1sxXSB8fCAncnRsODcxeGRydic7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgaG9zdGFwZENvbmYgPSBmaWxlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9zdGFwZENvbmYgPSBVdGlscy5yZXBsYWNlQWxsKGhvc3RhcGRDb25mLCAne3tTU0lEfX0nLCBTU0lEKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBob3N0YXBkQ29uZiA9IFV0aWxzLnJlcGxhY2VBbGwoaG9zdGFwZENvbmYsICd7e3Bhc3N3b3JkfX0nLCBwYXNzd29yZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaG9zdGFwZENvbmYgPSBVdGlscy5yZXBsYWNlQWxsKGhvc3RhcGRDb25mLCAne3tkcml2ZXJ9fScsIGRyaXZlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZnMud3JpdGVGaWxlKHdpZmkuY29uZmlnRmlsZXMuaG9zdGFwZENvbmYucGF0aCwgaG9zdGFwZENvbmYsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldENsaWVudDogKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFV0aWxzLmJhY2t1cEZpbGUod2lmaS5jb25maWdGaWxlcy5ob3N0YXBkQ29uZi5wYXRoICsgJy5iYWNrJywgKHBhdGgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0aC5zcGxpdCgnLmJhY2snKVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaW50ZXJmYWNlczoge1xuICAgICAgICAgICAgICAgIHBhdGg6ICcvZXRjL25ldHdvcmsvaW50ZXJmYWNlcycsXG4gICAgICAgICAgICAgICAgc2V0QVA6ICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGZzLnJlYWRGaWxlU3luYyh3aWZpLmNvbmZpZ0ZpbGVzLmludGVyZmFjZXMucGF0aCkudG9TdHJpbmcoKS5pbmRleE9mKCcjIHdpZmktc2V0dXAgY29uZmlnJykgPT09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFV0aWxzLmJhY2t1cEZpbGUod2lmaS5jb25maWdGaWxlcy5pbnRlcmZhY2VzLnBhdGgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGZzLnJlYWRGaWxlKCcuL21vZHVsZXMvaW50ZXJmYWNlcy5hcC5maWxsJywgKGVyciwgZmlsZSkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbnRlcmZhY2VzID0gZmlsZS50b1N0cmluZygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGludGVyZmFjZXMgPSBVdGlscy5yZXBsYWNlQWxsKGludGVyZmFjZXMsICd7e0lQfX0nLCAnMTkyLjE2OC40Mi4xJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJmYWNlcyA9IFV0aWxzLnJlcGxhY2VBbGwoaW50ZXJmYWNlcywgJ3t7aG9zdGFwZH19Jywgd2lmaS5jb25maWdGaWxlcy5ob3N0YXBkQ29uZi5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcy53cml0ZUZpbGUod2lmaS5jb25maWdGaWxlcy5pbnRlcmZhY2VzLnBhdGgsIGludGVyZmFjZXMsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldENsaWVudDogKFNTSUQsIHBhc3N3b3JkKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChmcy5yZWFkRmlsZVN5bmMod2lmaS5jb25maWdGaWxlcy5pbnRlcmZhY2VzLnBhdGgpLnRvU3RyaW5nKCkuaW5kZXhPZignIyB3aWZpLXNldHVwIGNvbmZpZycpID09PSAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBVdGlscy5iYWNrdXBGaWxlKHdpZmkuY29uZmlnRmlsZXMuaW50ZXJmYWNlcy5wYXRoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuXG4gICAgICAgICAgICAgICAgICAgICAgICBmcy5yZWFkRmlsZSgnLi9tb2R1bGVzL2ludGVyZmFjZXMuY2xpZW50LmZpbGwnLCAoZXJyLCBmaWxlKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGludGVyZmFjZXMgPSBmaWxlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJmYWNlcyA9IFV0aWxzLnJlcGxhY2VBbGwoaW50ZXJmYWNlcywgJ3t7U1NJRH19JywgU1NJRCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW50ZXJmYWNlcyA9IFV0aWxzLnJlcGxhY2VBbGwoaW50ZXJmYWNlcywgJ3t7cGFzc3dvcmR9fScsIHBhc3N3b3JkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmcy53cml0ZUZpbGUod2lmaS5jb25maWdGaWxlcy5pbnRlcmZhY2VzLnBhdGgsIGludGVyZmFjZXMsIChlcnIpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgYWxsOiB7XG4gICAgICAgICAgICAgICAgc2V0QVA6IChTU0lELCBwYXNzd29yZCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwoW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZmkuY29uZmlnRmlsZXMuZGVmYXVsdEhvc3RhcGQuc2V0QVAoKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWZpLmNvbmZpZ0ZpbGVzLmhvc3RhcGRDb25mLnNldEFQKFNTSUQsIHBhc3N3b3JkKSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWZpLmNvbmZpZ0ZpbGVzLmludGVyZmFjZXMuc2V0QVAoKVxuICAgICAgICAgICAgICAgICAgICAgICAgXSkudGhlbigocmVzdWx0cykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUocmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KS5jYXRjaCgoZXJycykgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKEpTT04uc3RyaW5naWZ5KGVycnMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJycy5jb2RlID09PSAnRUFDQ0VTJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhub1N1ZG9NZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgc2V0Q2xpZW50OiAoU1NJRCwgcGFzc3dvcmQpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIFByb21pc2UuYWxsKFtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aWZpLmNvbmZpZ0ZpbGVzLmRlZmF1bHRIb3N0YXBkLnNldENsaWVudCgpLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHdpZmkuY29uZmlnRmlsZXMuaG9zdGFwZENvbmYuc2V0Q2xpZW50KCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2lmaS5jb25maWdGaWxlcy5pbnRlcmZhY2VzLnNldENsaWVudChTU0lELCBwYXNzd29yZClcbiAgICAgICAgICAgICAgICAgICAgICAgIF0pLnRoZW4oKHJlc3VsdHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXNvbHZlKHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycnMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZXJycy5jb2RlID09PSAnRUFDQ0VTJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhub1N1ZG9NZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVqZWN0KGVycnMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgZ2V0RHJpdmVyOiAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgICAgICAgIGV4ZWMoJ2Jhc2VuYW1lICQoIHJlYWRsaW5rIC9zeXMvY2xhc3MvbmV0L3dsYW4wL2RldmljZS9kcml2ZXIgKScsIChlcnIsIHN0ZG91dCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZWplY3QoZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoc3Rkb3V0KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgcmV0dXJuIHdpZmk7XG59O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
