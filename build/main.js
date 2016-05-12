require('babel-polyfill');
var bodyParser = require('body-parser');
var database;
var wifiManager = require('./modules/wifi-manager')();
var server = require('./modules/server')({
    onClientConfiguring: function () {
        console.log('onClientConfiguring');
    },
    onSetupComplete: function (settings) {
        console.log('onSetupComplete');
        console.log(settings);
        wifiManager.accessPoint.down().then(function () {
            wifiManager.client.connect(settings.wifiSSID, settings.wifiPassword).then(function () {
                database.setWifiCreds(settings.wifiSSID, settings.wifiPassword);
                if (module.exports.callbacks && module.exports.callbacks.onConnectToWIFI) {
                    module.exports.callbacks.onConnectToWIFI(settings.wifiSSID, '10.0.0.1');
                }
                server.stop();
            }).catch(function () {
                console.log('Failed to connect using new creds');
            });
        });
    }
});
module.exports = function (SERVICE_NAME, express, app, _database) {
    if (!express) {
        express = require('express');
    }
    if (!app) {
        app = express();
    }
    database = _database;
    if (!database) {
        database = require('./modules/database')(SERVICE_NAME);
        database.init().then(function () {
            database.start();
        });
    }
    var wifiSetup = {
        init: function (callbacks) {
            return new Promise(function (resolve) {
                if (module.exports.callbacks) {
                    module.exports.callbacks = callbacks;
                }
                app.use(bodyParser.json());
                app.use(bodyParser.urlencoded({
                    extended: true
                }));
                Promise.all([wifiManager.init(), server.init(express, app)]).then(function () {
                    resolve();
                }).catch(function (errs) {
                    console.log('Something failed to initialize');
                    console.log(errs);
                });
            });
        },
        start: function () {
            return new Promise(function (resolve) {
                database.getWifiCreds().then(function (creds) {
                    wifiManager.client.connect(creds.SSID, creds.password).then(function () {
                        if (module.exports.callbacks && module.exports.callbacks.onConnectToWIFI) {
                            module.exports.callbacks.onConnectToWIFI(creds.SSID, '10.0.0.1');
                        }
                        resolve();
                    }).catch(function (err) {
                        console.log(err);
                        wifiSetup.startConfigServer();
                        resolve();
                    });
                }).catch(function () {
                    wifiSetup.startConfigServer();
                    resolve();
                });
            });
        },
        stop: function () {
            return new Promise(function (resolve) {
                Promise.all([wifiManager.stop()]).then(function () {
                    resolve();
                }).catch(function (errs) {
                    console.log('Something failed to stop');
                    console.log(errs);
                });
            });
        },
        startConfigServer: function () {
            Promise.all([wifiManager.accessPoint.up(SERVICE_NAME, 'testtest'), server.start(8081)]).then(function (responses) {
                if (module.exports.callbacks && module.exports.callbacks.onAPstart) {
                    module.exports.callbacks.onAPstart(responses[0].SSID, responses[0].password);
                }
            }).catch(function (errs) {
                console.log(errs);
            });
        }
    };
    return wifiSetup;
};

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsT0FBTyxDQUFDLGdCQUFnQixDQUFDLENBQUM7QUFFMUIsSUFBSSxVQUFVLEdBQUcsT0FBTyxDQUFDLGFBQWEsQ0FBQyxDQUFDO0FBRXhDLElBQUksUUFBUSxDQUFDO0FBQ2IsSUFBSSxXQUFXLEdBQUcsT0FBTyxDQUFDLHdCQUF3QixDQUFDLEVBQUUsQ0FBQztBQUN0RCxJQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztJQUNyQyxtQkFBbUIsRUFBRTtRQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLHFCQUFxQixDQUFDLENBQUM7SUFDdkMsQ0FBQztJQUNELGVBQWUsRUFBRSxVQUFDLFFBQVE7UUFDdEIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1FBQy9CLE9BQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDdEIsV0FBVyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUM7WUFDaEMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxRQUFRLENBQUMsWUFBWSxDQUFDLENBQUMsSUFBSSxDQUFDO2dCQUN0RSxRQUFRLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxRQUFRLEVBQUUsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDO2dCQUNoRSxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDO29CQUN2RSxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxVQUFVLENBQUMsQ0FBQztnQkFDNUUsQ0FBQztnQkFDRCxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDbEIsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO2dCQUNMLE9BQU8sQ0FBQyxHQUFHLENBQUMsbUNBQW1DLENBQUMsQ0FBQztZQUNyRCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQztDQUNKLENBQUMsQ0FBQztBQUVILE1BQU0sQ0FBQyxPQUFPLEdBQUcsVUFBQyxZQUFZLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxTQUFTO0lBQ25ELEVBQUUsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztRQUNYLE9BQU8sR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUNELEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNQLEdBQUcsR0FBRyxPQUFPLEVBQUUsQ0FBQztJQUNwQixDQUFDO0lBQ0QsUUFBUSxHQUFHLFNBQVMsQ0FBQztJQUNyQixFQUFFLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUM7UUFDWixRQUFRLEdBQUcsT0FBTyxDQUFDLG9CQUFvQixDQUFDLENBQUMsWUFBWSxDQUFDLENBQUM7UUFDdkQsUUFBUSxDQUFDLElBQUksRUFBRSxDQUFDLElBQUksQ0FBQztZQUNqQixRQUFRLENBQUMsS0FBSyxFQUFFLENBQUM7UUFDckIsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0lBRUQsSUFBSSxTQUFTLEdBQUc7UUFDWixJQUFJLEVBQUUsVUFBQyxTQUFTO1lBQ1osTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTztnQkFDdkIsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDO29CQUMzQixNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7Z0JBQ3pDLENBQUM7Z0JBRUQsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztnQkFDM0IsR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDO29CQUMxQixRQUFRLEVBQUUsSUFBSTtpQkFDakIsQ0FBQyxDQUFDLENBQUM7Z0JBRUosT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsRUFBRSxNQUFNLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUM5RCxPQUFPLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQyxJQUFJO29CQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztvQkFDOUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdEIsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFDRCxLQUFLLEVBQUU7WUFDSCxNQUFNLENBQUMsSUFBSSxPQUFPLENBQUMsVUFBQyxPQUFPO2dCQUN2QixRQUFRLENBQUMsWUFBWSxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQUMsS0FBSztvQkFDL0IsV0FBVyxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDO3dCQUN4RCxFQUFFLENBQUMsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsSUFBSSxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxDQUFDOzRCQUN2RSxNQUFNLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxVQUFVLENBQUMsQ0FBQzt3QkFDckUsQ0FBQzt3QkFDRCxPQUFPLEVBQUUsQ0FBQztvQkFDZCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQyxHQUFHO3dCQUNULE9BQU8sQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7d0JBQ2pCLFNBQVMsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDO3dCQUM5QixPQUFPLEVBQUUsQ0FBQztvQkFDZCxDQUFDLENBQUMsQ0FBQztnQkFDUCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUM7b0JBQ0wsU0FBUyxDQUFDLGlCQUFpQixFQUFFLENBQUM7b0JBQzlCLE9BQU8sRUFBRSxDQUFDO2dCQUNkLENBQUMsQ0FBQyxDQUFDO1lBQ1AsQ0FBQyxDQUFDLENBQUM7UUFDUCxDQUFDO1FBQ0QsSUFBSSxFQUFFO1lBQ0YsTUFBTSxDQUFDLElBQUksT0FBTyxDQUFDLFVBQUMsT0FBTztnQkFDdkIsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO29CQUNuQyxPQUFPLEVBQUUsQ0FBQztnQkFDZCxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsVUFBQyxJQUFJO29CQUNWLE9BQU8sQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQUMsQ0FBQztvQkFDeEMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztnQkFDdEIsQ0FBQyxDQUFDLENBQUM7WUFDUCxDQUFDLENBQUMsQ0FBQztRQUNQLENBQUM7UUFFRCxpQkFBaUIsRUFBRTtZQUNmLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxXQUFXLENBQUMsV0FBVyxDQUFDLEVBQUUsQ0FBQyxZQUFZLEVBQUUsVUFBVSxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsU0FBUztnQkFDbkcsRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLElBQUksTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztvQkFDakUsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2dCQUNqRixDQUFDO1lBQ0wsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLFVBQUMsSUFBSTtnQkFDVixPQUFPLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO1lBQ3RCLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztLQUNKLENBQUM7SUFFRixNQUFNLENBQUMsU0FBUyxDQUFDO0FBQ3JCLENBQUMsQ0FBQyIsImZpbGUiOiJtYWluLmpzIiwic291cmNlc0NvbnRlbnQiOlsicmVxdWlyZSgnYmFiZWwtcG9seWZpbGwnKTtcblxudmFyIGJvZHlQYXJzZXIgPSByZXF1aXJlKCdib2R5LXBhcnNlcicpO1xuXG52YXIgZGF0YWJhc2U7XG52YXIgd2lmaU1hbmFnZXIgPSByZXF1aXJlKCcuL21vZHVsZXMvd2lmaS1tYW5hZ2VyJykoKTtcbnZhciBzZXJ2ZXIgPSByZXF1aXJlKCcuL21vZHVsZXMvc2VydmVyJykoe1xuICAgIG9uQ2xpZW50Q29uZmlndXJpbmc6ICgpID0+IHtcbiAgICAgICAgY29uc29sZS5sb2coJ29uQ2xpZW50Q29uZmlndXJpbmcnKTtcbiAgICB9LFxuICAgIG9uU2V0dXBDb21wbGV0ZTogKHNldHRpbmdzKSA9PiB7XG4gICAgICAgIGNvbnNvbGUubG9nKCdvblNldHVwQ29tcGxldGUnKTtcbiAgICAgICAgY29uc29sZS5sb2coc2V0dGluZ3MpO1xuICAgICAgICB3aWZpTWFuYWdlci5hY2Nlc3NQb2ludC5kb3duKCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICB3aWZpTWFuYWdlci5jbGllbnQuY29ubmVjdChzZXR0aW5ncy53aWZpU1NJRCwgc2V0dGluZ3Mud2lmaVBhc3N3b3JkKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgICAgICBkYXRhYmFzZS5zZXRXaWZpQ3JlZHMoc2V0dGluZ3Mud2lmaVNTSUQsIHNldHRpbmdzLndpZmlQYXNzd29yZCk7XG4gICAgICAgICAgICAgICAgaWYgKG1vZHVsZS5leHBvcnRzLmNhbGxiYWNrcyAmJiBtb2R1bGUuZXhwb3J0cy5jYWxsYmFja3Mub25Db25uZWN0VG9XSUZJKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzLmNhbGxiYWNrcy5vbkNvbm5lY3RUb1dJRkkoc2V0dGluZ3Mud2lmaVNTSUQsICcxMC4wLjAuMScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZXJ2ZXIuc3RvcCgpO1xuICAgICAgICAgICAgfSkuY2F0Y2goKCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdGYWlsZWQgdG8gY29ubmVjdCB1c2luZyBuZXcgY3JlZHMnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSAoU0VSVklDRV9OQU1FLCBleHByZXNzLCBhcHAsIF9kYXRhYmFzZSkgPT4ge1xuICAgIGlmICghZXhwcmVzcykge1xuICAgICAgICBleHByZXNzID0gcmVxdWlyZSgnZXhwcmVzcycpO1xuICAgIH1cbiAgICBpZiAoIWFwcCkge1xuICAgICAgICBhcHAgPSBleHByZXNzKCk7XG4gICAgfVxuICAgIGRhdGFiYXNlID0gX2RhdGFiYXNlO1xuICAgIGlmICghZGF0YWJhc2UpIHtcbiAgICAgICAgZGF0YWJhc2UgPSByZXF1aXJlKCcuL21vZHVsZXMvZGF0YWJhc2UnKShTRVJWSUNFX05BTUUpO1xuICAgICAgICBkYXRhYmFzZS5pbml0KCkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICBkYXRhYmFzZS5zdGFydCgpO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICB2YXIgd2lmaVNldHVwID0ge1xuICAgICAgICBpbml0OiAoY2FsbGJhY2tzKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgICAgICAgICAgICBpZiAobW9kdWxlLmV4cG9ydHMuY2FsbGJhY2tzKSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzLmNhbGxiYWNrcyA9IGNhbGxiYWNrcztcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBhcHAudXNlKGJvZHlQYXJzZXIuanNvbigpKTtcbiAgICAgICAgICAgICAgICBhcHAudXNlKGJvZHlQYXJzZXIudXJsZW5jb2RlZCh7XG4gICAgICAgICAgICAgICAgICAgIGV4dGVuZGVkOiB0cnVlXG4gICAgICAgICAgICAgICAgfSkpO1xuXG4gICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwoW3dpZmlNYW5hZ2VyLmluaXQoKSwgc2VydmVyLmluaXQoZXhwcmVzcywgYXBwKV0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycnMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1NvbWV0aGluZyBmYWlsZWQgdG8gaW5pdGlhbGl6ZScpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBzdGFydDogKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgZGF0YWJhc2UuZ2V0V2lmaUNyZWRzKCkudGhlbigoY3JlZHMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgd2lmaU1hbmFnZXIuY2xpZW50LmNvbm5lY3QoY3JlZHMuU1NJRCwgY3JlZHMucGFzc3dvcmQpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG1vZHVsZS5leHBvcnRzLmNhbGxiYWNrcyAmJiBtb2R1bGUuZXhwb3J0cy5jYWxsYmFja3Mub25Db25uZWN0VG9XSUZJKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbW9kdWxlLmV4cG9ydHMuY2FsbGJhY2tzLm9uQ29ubmVjdFRvV0lGSShjcmVkcy5TU0lELCAnMTAuMC4wLjEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycikgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coZXJyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdpZmlTZXR1cC5zdGFydENvbmZpZ1NlcnZlcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHdpZmlTZXR1cC5zdGFydENvbmZpZ1NlcnZlcigpO1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcDogKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICAgICAgICAgICAgUHJvbWlzZS5hbGwoW3dpZmlNYW5hZ2VyLnN0b3AoKV0pLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICAgICAgfSkuY2F0Y2goKGVycnMpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ1NvbWV0aGluZyBmYWlsZWQgdG8gc3RvcCcpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJzKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0YXJ0Q29uZmlnU2VydmVyOiAoKSA9PiB7XG4gICAgICAgICAgICBQcm9taXNlLmFsbChbd2lmaU1hbmFnZXIuYWNjZXNzUG9pbnQudXAoU0VSVklDRV9OQU1FLCAndGVzdHRlc3QnKSwgc2VydmVyLnN0YXJ0KDgwODEpXSkudGhlbigocmVzcG9uc2VzKSA9PiB7XG4gICAgICAgICAgICAgICAgaWYgKG1vZHVsZS5leHBvcnRzLmNhbGxiYWNrcyAmJiBtb2R1bGUuZXhwb3J0cy5jYWxsYmFja3Mub25BUHN0YXJ0KSB7XG4gICAgICAgICAgICAgICAgICAgIG1vZHVsZS5leHBvcnRzLmNhbGxiYWNrcy5vbkFQc3RhcnQocmVzcG9uc2VzWzBdLlNTSUQsIHJlc3BvbnNlc1swXS5wYXNzd29yZCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSkuY2F0Y2goKGVycnMpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhlcnJzKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiB3aWZpU2V0dXA7XG59O1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
