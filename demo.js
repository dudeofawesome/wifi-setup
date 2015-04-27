var lcd = require("./LCD_controller");
lcd.setColor(0, 100, 255);
// var dots = "";
// var startingText = setInterval(function () {
// 	lcd.setText("Starting" + dots);
// 	dots += ".";
// 	if (dots.length > 3)
// 		dots = "";
// }, 500);

var WIFIsetup = require("./WIFI_setup");
var utils = require("./lib/utils");

WIFIsetup.start({
	onAPstart: function (SSID, password) {		
		lcd.setText("SSID:" + SSID);
		lcd.setText("Pass:" + password, {x:0, y:1}, false);
	},
	onClientConnected: function (MAC) {
		lcd.setColor(255, 100, 100);
		lcd.setText("Client Connected");
		lcd.setText("================", {x:0, y:1}, false);
	},
	onClientConfiguring: function (MAC) {
		lcd.setColor(252, 181, 14);
		lcd.setText("Client Configing");
		lcd.setText("================", {x:0, y:1}, false);
	},
	onSetupComplete: function (externalIP, apiKey) {
		lcd.setColor(100, 255, 100);
		lcd.setText("Finished  Config");
		lcd.setText("================", {x:0, y:1}, false);
	},
	onConnectToWIFI: function (SSID, internalIP) {
		lcd.setColor(0, 255, 0);
		lcd.setText("Cnctd:" + SSID)
		lcd.setText("IP:" + internalIP, {x:0, y:1}, false);
	}
});