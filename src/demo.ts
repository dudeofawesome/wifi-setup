var WIFIsetup = require('./main')('DEFAULT');

WIFIsetup.init({
    onAPstart: function (SSID, password) {
        console.log(`SSID: ${SSID}`);
    },
    onClientConnected: function () {
        console.log('Client Connected');
    },
    onClientConfiguring: function () {
        console.log('Client Configing');
    },
    onSetupComplete: function (settings) {
        console.log(settings);
        console.log('Finished  Config');
    },
    onConnectToWIFI: function (SSID, internalIP) {
        console.log(`Cnctd: ${SSID}`);
    }
}).then(function () {
    WIFIsetup.start().catch(function (err) {
        console.log(err);
    });
}).catch(function (err) {
    console.log(err);
});
