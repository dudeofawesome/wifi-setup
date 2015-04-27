String.prototype.replaceAll = function (find, replace) {
  return this.replace(new RegExp(find, 'g'), replace);
}






module.exports = {
	start: function (_callbacks) {
		if (callbacks != undefined)
			callbacks = _callbacks;

		if (configured) {
			connectToWiFi();
		} else {
			this.configure();
		}
	},
	configure: function (SSID) {
		startConfigServer();
		startAP(SERVICE_NAME);
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
var bodyParser = require('body-parser')
app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 
var sys = require('sys')
var exec = require('child_process').exec;

function loadPages () {
	// TODO: search document for all names encapsulated by {{}} and auto replace them if the var exists in this scope
	configPage = fs.readFileSync('./pages/configure.html').toString();
	configPage = configPage.replaceAll("{{SERVICE_NAME}}", SERVICE_NAME);

	finishConfigPage = fs.readFileSync('./pages/finish_configure.html').toString();
	finishConfigPage = finishConfigPage.replaceAll("{{SERVICE_NAME}}", SERVICE_NAME);
}

function startAP (SSID) {
	var password = utils.generateStrongPassword(11, undefined, {lowercase: undefined, uppercase: undefined, numbers: undefined, symbols: "!@#$%^&*-_+=<.>?"});

	if (fs.readFileSync("/etc/hostapd/hostapd.conf").toString().indexOf("# WiFi setup configuration") == -1) {
		fs.renameSync("/etc/hostapd/hostapd.conf", "/etc/hostapd/hostapd.conf.back");
	}

	var hostapdConf = "# WiFi setup configuration\ninterface=wlan0\nssid={{SSID}}\nwpa_passphrase={{password}}\nhw_mode=g\nwpa=2\nwpa_key_mgmt=WPA-PSK WPA-EAP WPA-PSK-SHA256 WPA-EAP-SHA256"
	hostapdConf = hostapdConf.replaceAll("{{SSID}}", SSID);
	hostapdConf = hostapdConf.replaceAll("{{password}}", password);
	fs.writeFileSync("/etc/hostapd/hostapd.conf", hostapdConf);

	exec("sysctl -w net.ipv4.ip_forward=1", function (error, stdout, stderr) {
		console.log(error + "\n" + stdout + "\n" + stderr);
		fs.writeFile("/etc/dhcp/dhcpd.conf", "subnet\n192.168.5.0 netmask 255.255.255.0 {\ninterface \"wlan0\";\n# — default gateway\noption routers\n192.168.5.1;\n# — Netmask\noption subnet-mask\n255.255.255.0;\n# — Broadcast Address\noption broadcast-address\n192.168.5.255;\n# — Domain name servers, tells the clients which DNS servers to use.\n#option domain-name-servers\n#10.0.0.1, 8.8.8.8, 8.8.4.4;\noption time-offset\n0;\n#range 10.0.0.3 10.0.0.13;\nrange 192.168.5.3 192.168.5.45;\ndefault-lease-time 1209600;\nmax-lease-time 1814400;\n}", function () {
			exec("iptables --flush", function (error, stdout, stderr) {
				exec("iptables --delete-chain", function (error, stdout, stderr) {
					exec("iptables --table nat --delete-chain", function (error, stdout, stderr) {
						exec("iptables --table nat -F", function (error, stdout, stderr) {
							exec("iptables --table nat -X", function (error, stdout, stderr) {
								exec("iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT", function (error, stdout, stderr) {
									exec("iptables -A OUTPUT -p tcp --dport 80 -j ACCEPT", function (error, stdout, stderr) {
										exec("iptables -A OUTPUT -p tcp --dport 443 -j ACCEPT", function (error, stdout, stderr) {
											exec("iptables -A INPUT -p udp --dport 22 -j ACCEPT", function (error, stdout, stderr) {
												exec("iptables -t nat -A POSTROUTING -o ppp0 -j MASQUERADE", function (error, stdout, stderr) {
													exec("iptables -A FORWARD -i ppp0 -o wlan0 -j ACCEPT -m state --state RELATED,ESTABLISHED", function (error, stdout, stderr) {
														exec("iptables -A FORWARD -i wlan0 -o ppp0 -j ACCEPT", function (error, stdout, stderr) {
															exec("iptables -A INPUT -j DROP", function (error, stdout, stderr) {
																console.log(error + "\n" + stdout + "\n" + stderr);
																fs.writeFileSync("./start_ap", "ifconfig wlan0 up 192.168.5.1 netmask 255.255.255.0\nsleep 5\nif [ \"$(ps | grep udhcpd)\" == \"\" ]; then\nudhcpd wlan0 &\nfi\nsleep 2\nhostapd /etc/hostapd/hostapd.conf 1>/dev/null\nkillall udhcpd");
																fs.chmodSync("./start_ap", 0777);
																exec("./start_ap", function (error, stdout, stderr) {
																	console.log(error + "\n" + stdout + "\n" + stderr);
																	if (callbacks.onAPstart != undefined) {
																		callbacks.onAPstart(SSID, password);
																	}
																});
															});
														});
													});
												});
											});
										});
									});
								});
							});
						});
					});
				});
			});

			// fs.writeFileSync("./iptables_start", "#!/bin/bash\niptables --flush\niptables --delete-chain\niptables --table nat --delete-chain\niptables --table nat -F\niptables --table nat -X\n\niptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT\n\niptables -A OUTPUT -p tcp --dport 80 -j ACCEPT\niptables -A OUTPUT -p tcp --dport 443 -j ACCEPT\n\niptables -t nat -A POSTROUTING -o ppp0 -j MASQUERADE\niptables -A FORWARD -i ppp0 -o wlan0 -j ACCEPT -m state --state RELATED,ESTABLISHED\niptables -A FORWARD -i wlan0 -o ppp0 -j ACCEPT\n\niptables -A INPUT -j DROP\niptables -A OUTPUT -j DROP");
			// fs.chmodSync("./iptables_start", 0777);
			// exec("./iptables_start", function (error, stdout, stderr) {
			// 	console.log(error + "\n" + stdout + "\n" + stderr);
			// 	fs.writeFileSync("./start_ap", "ifconfig wlan0 up 192.168.5.1 netmask 255.255.255.0\nsleep 5\nif [ \"$(ps -e | grep udhcpd)\" == \"\" ]; then\nudhcpd wlan0 &\nfi\nsleep 2\nhostapd /etc/hostapd/hostapd.conf 1>/dev/null\nkillall udhcpd");
			// 	fs.chmodSync("./start_ap", 0777);
			// 	exec("./start_ap", function (error, stdout, stderr) {
			// 		console.log(error + "\n" + stdout + "\n" + stderr);
			// 		if (callbacks.onAPstart != undefined) {
			// 			callbacks.onAPstart(SSID, password);
			// 		}
			// 	});
			// });
		});
	});
}

function stopAP () {
	
}

function startConfigServer () {
	server = app.listen(PORT, function () {
		var host = server.address().address;
		var port = server.address().port;

		console.log('Listening on %s', port);
	});

	app.use(express.static("./pages/static"))
	app.get('/', function (req, res) {
		res.send(configPage);
		if (callbacks.onClientConfiguring != undefined) {
			callbacks.onClientConfiguring(undefined);
		}
	});
	app.post('/finishConfig/', function (req, res) {
		console.log(req.body);
		serviceData = req.body;
		configured = true;
		res.send(finishConfigPage);
		if (callbacks.onSetupComplete != undefined) {
			callbacks.onSetupComplete(undefined);
		}
		module.exports.start();
	});
}

function connectToWiFi () {
	exec("iwconfig wlan0 essid " + serviceData.SSID + " key s:" + serviceData.password, function (error, stdout, stderr) {
		exec("dhclient wlan0", function (error, stdout, stderr) {
			serviceData.internalIP = stdout;
			console.log(stdout);
			if (callbacks.onConnectToWIFI != undefined) {
				callbacks.onConnectToWIFI(serviceData.SSID, serviceData.internalIP);
			}
		});
		sys.puts(stdout);
	});
}

function disconnectWiFi () {

}

function init () {
	loadPages();
}

init();
