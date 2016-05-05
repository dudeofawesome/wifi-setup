'use strict';

// var lcd = require('lcd-controller');
var lcd = {
    setColor: function setColor() {},
    setText: function setText(text) {
        console.log(text);
    }
};
lcd.setColor(0, 100, 255);

var WIFIsetup = require('./main')('DEFAULT');

WIFIsetup.init({
    onAPstart: function onAPstart(SSID, password) {
        lcd.setText('SSID: ' + SSID);
        lcd.setText('Pass: ' + password, { x: 0, y: 1 }, false);
    },
    onClientConnected: function onClientConnected() {
        lcd.setColor(255, 100, 100);
        lcd.setText('Client Connected');
        lcd.setText('================', { x: 0, y: 1 }, false);
    },
    onClientConfiguring: function onClientConfiguring() {
        lcd.setColor(252, 181, 14);
        lcd.setText('Client Configing');
        lcd.setText('================', { x: 0, y: 1 }, false);
    },
    onSetupComplete: function onSetupComplete(settings) {
        console.log(settings);
        lcd.setColor(100, 255, 100);
        lcd.setText('Finished  Config');
        lcd.setText('================', { x: 0, y: 1 }, false);
    },
    onConnectToWIFI: function onConnectToWIFI(SSID, internalIP) {
        lcd.setColor(0, 255, 0);
        lcd.setText('Cnctd: ' + SSID);
        lcd.setText('IP: ' + internalIP, { x: 0, y: 1 }, false);
    }
}).then(function () {
    WIFIsetup.start().catch(function (err) {
        console.log(err);
    });
}).catch(function (err) {
    console.log(err);
});