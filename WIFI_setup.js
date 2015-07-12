String.prototype.replaceAll = function (find, replace) {
  return this.replace(new RegExp(find, 'g'), replace);
};






module.exports = {
	start: function (_callbacks) {
		if (callbacks !== undefined)
			callbacks = _callbacks;

		if (configured) {
			connectToWiFi();
		} else {
			this.configure();
		}
	},
	configure: function (SSID) {
		startConfigServer();
        // var password = utils.generateStrongPassword(11, undefined, {lowercase: undefined, uppercase: undefined, numbers: undefined, symbols: "!@#$%^&*-_+=<.>?"});
        var password = "testtest";
		startAP(SERVICE_NAME, password);
	},
	resetConfiguration: function () {
		configured = false;
	},
	setServiceName: function (serviceName) {
		SERVICE_NAME = serviceName;
	}
};

var SERVICE_NAME = "DEFAULT";
var configured = false;
var serviceData = {};

var callbacks = {};

var PORT = 81;
var express = require("express");
var app = express();
var server;
var fs = require('fs');
var configPage;
var finishConfigPage;
var utils = require("./lib/utils");
var bodyParser = require('body-parser');
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
var sys = require('sys');
var exec = require('child_process').exec;

function loadPages () {
	// TODO: search document for all names encapsulated by {{}} and auto replace them if the var exists in this scope
	configPage = fs.readFileSync('./pages/configure.html').toString();
	configPage = configPage.replaceAll("{{SERVICE_NAME}}", SERVICE_NAME);

	finishConfigPage = fs.readFileSync('./pages/finish_configure.html').toString();
	finishConfigPage = finishConfigPage.replaceAll("{{SERVICE_NAME}}", SERVICE_NAME);
}

function startAP (SSID, password) {
	if (fs.readFileSync("/etc/hostapd/hostapd.conf").toString().indexOf("# WiFi setup configuration") == -1) {
		fs.renameSync("/etc/hostapd/hostapd.conf", "/etc/hostapd/hostapd.conf.back");
	}

    // var hostapdConf = "# WiFi setup configuration\ninterface=wlan0\nssid={{SSID}}\nwpa_passphrase={{password}}\nhw_mode=g\nwpa=2\nwpa_key_mgmt=WPA-PSK WPA-EAP WPA-PSK-SHA256 WPA-EAP-SHA256";
    var hostapdConf = fs.readFileSync('./hostapd.fill.conf').toString();
	hostapdConf = hostapdConf.replaceAll("{{SSID}}", SSID);
	hostapdConf = hostapdConf.replaceAll("{{password}}", password);
	fs.writeFileSync("/etc/hostapd/hostapd.conf", hostapdConf);

    // exec("ifconfig wlan0 up", function (error, stdout, stderr) {
    //     exec("iwconfig wlan0 mode ad-hoc", function (error, stdout, stderr) {
    //         exec("iwconfig wlan0 essid " + SSID, function (error, stdout, stderr) {
    //             exec("ifconfig wlan0 192.168.1.1 netmask 255.255.255.0", function (error, stdout, stderr) {
    //                 console.log(error + "\n" + stdout + "\n" + stderr);
    //                 // fs.writeFileSync("./start_ap", "ifconfig wlan0 up 192.168.5.1 netmask 255.255.255.0\nsleep 5\nif [ \"$(ps | grep udhcpd)\" == \"\" ]; then\nudhcpd wlan0 &\nfi\nsleep 2\nhostapd /etc/hostapd/hostapd.conf 1>/dev/null\nkillall udhcpd");
    //                 // fs.chmodSync("./start_ap", 0777);
    //                 // exec("./start_ap", function (error, stdout, stderr) {
    //                 //   console.log(error + "\n" + stdout + "\n" + stderr);
    //                     if (callbacks.onAPstart != undefined) {
    //                         callbacks.onAPstart(SSID, password);
    //                     }
    //                 // });
    //             }
    //         }
    //     }
    // }

    exec("systemctl start hostapd", function (error, stdout, stderr) {
        if (callbacks.onAPstart !== undefined) {
            callbacks.onAPstart(SSID, password);
        }
    });
}

function stopAP (callback) {
    exec("systemctl stop hostapd", function (error, stdout, stderr) {
        console.log("WiFi AP stopped");
        callback();
    });
}

function startConfigServer () {
	server = app.listen(PORT, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log('Listening on %s', port);
	});

	app.use(express.static("./pages/static"));
	app.get('/', function (req, res) {
		res.send(configPage);
		if (callbacks.onClientConfiguring !== undefined) {
			callbacks.onClientConfiguring(undefined);
		}
	});
	app.post('/finishConfig/', function (req, res) {
		console.log(req.body);
		serviceData = req.body;
		configured = true;
		res.send(finishConfigPage);
		if (callbacks.onSetupComplete !== undefined) {
			callbacks.onSetupComplete(undefined);
		}
		module.exports.start();
	});
}

function connectToWiFi () {
    stopAP(function () {
        exec("iwconfig wlan0 essid " + serviceData.SSID + " key s:" + serviceData.password, function (error, stdout, stderr) {
    		exec("dhclient wlan0", function (error, stdout, stderr) {
    			serviceData.internalIP = stdout;
    			console.log(stdout);
    			if (callbacks !== undefined && callbacks.onConnectToWIFI !== undefined) {
    				callbacks.onConnectToWIFI(serviceData.SSID, serviceData.internalIP);
    			}
    		});
    		sys.puts(stdout);
    	});
    });
}

function disconnectWiFi () {

}

function init () {
	loadPages();
}

init();
