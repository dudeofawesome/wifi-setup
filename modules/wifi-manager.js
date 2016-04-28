var exec = require('child_process').exec;
var sys = require('sys');
var fs = require('fs');

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
                return new Promise(function (resolve) {
                    if (wifi.client.status !== 'down') {
                        resolve();
                    } else {
                        if (fs.readFileSync('/etc/hostapd/hostapd.conf').toString().indexOf('# WiFi setup configuration') == -1) {
                            fs.renameSync('/etc/hostapd/hostapd.conf', '/etc/hostapd/hostapd.conf.back');
                        }

                        // var hostapdConf = '# WiFi setup configuration\ninterface=wlan0\nssid={{SSID}}\nwpa_passphrase={{password}}\nhw_mode=g\nwpa=2\nwpa_key_mgmt=WPA-PSK WPA-EAP WPA-PSK-SHA256 WPA-EAP-SHA256';
                        var hostapdConf = fs.readFileSync('./hostapd.fill.conf').toString();
                        hostapdConf = hostapdConf.replaceAll('{{SSID}}', SSID);
                        hostapdConf = hostapdConf.replaceAll('{{password}}', password);
                        fs.writeFileSync('/etc/hostapd/hostapd.conf', hostapdConf);

                        // exec('ifconfig wlan0 up', function (error, stdout, stderr) {
                        //     exec('iwconfig wlan0 mode ad-hoc', function (error, stdout, stderr) {
                        //         exec('iwconfig wlan0 essid ' + SSID, function (error, stdout, stderr) {
                        //             exec('ifconfig wlan0 192.168.1.1 netmask 255.255.255.0', function (error, stdout, stderr) {
                        //                 console.log(error + '\n' + stdout + '\n' + stderr);
                        //                 // fs.writeFileSync('./start_ap', 'ifconfig wlan0 up 192.168.5.1 netmask 255.255.255.0\nsleep 5\nif [ \'$(ps | grep udhcpd)\' == \'\' ]; then\nudhcpd wlan0 &\nfi\nsleep 2\nhostapd /etc/hostapd/hostapd.conf 1>/dev/null\nkillall udhcpd');
                        //                 // fs.chmodSync('./start_ap', 0777);
                        //                 // exec('./start_ap', function (error, stdout, stderr) {
                        //                 //   console.log(error + '\n' + stdout + '\n' + stderr);
                        //                     if (callbacks.onAPstart) {
                        //                         callbacks.onAPstart(SSID, password);
                        //                     }
                        //                 // });
                        //             }
                        //         }
                        //     }
                        // }

                        exec('systemctl start hostapd', function () {
                            wifi.accessPoint.status = 'up';
                            resolve({SSID: SSID, password: password});
                        });
                    }
                });
            },
            down: function () {
                return new Promise(function (resolve) {
                    if (wifi.accessPoint.status === 'up') {
                        exec('systemctl stop hostapd', function () {
                            console.log('WiFi AP stopped');
                            wifi.accessPoint.status = 'down';
                            resolve();
                        });
                    } else {
                        resolve();
                    }
                });
            }
        },
        client: {
            status: 'down',
            connect: function (SSID, password) {
                return new Promise(function (resolve, reject) {
                    if (wifi.accessPoint.status !== 'down') {
                        reject();
                    } else {
                        exec('iwconfig wlan0 essid ' + SSID + ' key s:' + password, function (error, stdout) {
                            exec('dhclient wlan0', function () {
                                console.log(stdout);
                                wifi.client.status = 'connected';
                                resolve(stdout);
                            });
                            sys.puts(stdout);
                        });
                    }
                });
            },
            disconnect: function () {
                return new Promise(function (resolve) {
                    wifi.client.status = 'down';
                    resolve();
                });
            }
        }
    };

    return wifi;
};
