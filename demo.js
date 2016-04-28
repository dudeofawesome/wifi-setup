// var lcd = require('lcd-controller');
var lcd = {
    setColor: function () {},
    setText: function (text) {console.log(text);}
}
lcd.setColor(0, 100, 255);

var WIFIsetup = require('./main')('DEFAULT');

WIFIsetup.init({
    onAPstart: function (SSID, password) {
        lcd.setText('SSID:' + SSID);
        lcd.setText('Pass:' + password, {x:0, y:1}, false);
    },
    onClientConnected: function () {
        lcd.setColor(255, 100, 100);
        lcd.setText('Client Connected');
        lcd.setText('================', {x:0, y:1}, false);
    },
    onClientConfiguring: function () {
        lcd.setColor(252, 181, 14);
        lcd.setText('Client Configing');
        lcd.setText('================', {x:0, y:1}, false);
    },
    onSetupComplete: function (settings) {
        console.log(settings);
        lcd.setColor(100, 255, 100);
        lcd.setText('Finished  Config');
        lcd.setText('================', {x:0, y:1}, false);
    },
    onConnectToWIFI: function (SSID, internalIP) {
        lcd.setColor(0, 255, 0);
        lcd.setText('Cnctd:' + SSID);
        lcd.setText('IP:' + internalIP, {x:0, y:1}, false);
    }
}).then(function () {
    WIFIsetup.start().catch(function (err) {
        console.log(err);
    });
}).catch(function (err) {
    console.log(err);
});
