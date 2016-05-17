import {Utils} from './utils';
import {Question, QuestionTypes} from '../types/question.type';
import {Network} from '../types/network.type';

var SERVICE_NAME = 'DEFAULT';

import * as Promise from 'bluebird';
Promise.onPossiblyUnhandledRejection((error) => {
    throw error;
});

module.exports = (questions: Array<Question>, wifiManager, callbacks) => {
    var server = {
        app: undefined,
        appServer: undefined,

        init: (express, app) => {
            return new Promise((resolve) => {
                console.log('Initializing server');
                server.app = app;

                let questionsWithWiFi = [];
                wifiManager.scan().then((networks: Array<Network>) => {
                    let networkSSIDoptions = [];
                    for (let i in networks) {
                        networkSSIDoptions.push(networks[i].SSID);
                    }

                    questionsWithWiFi = questions.concat([
                        new Question('WiFi SSID', 'wifiSSID', QuestionTypes.SPINNER, networkSSIDoptions),
                        new Question('WiFi password', 'wifiPassword', QuestionTypes.PASSWORD, /([\x00-\x7F]){8,63}/)
                    ]);
                })

                app.get('/get-questions', function (req, res) {
                    res.json(questionsWithWiFi);
                    if (callbacks && callbacks.onClientConfiguring) {
                        callbacks.onClientConfiguring();
                    }
                });

                app.post('/save-settings', (req, res) => {
                    console.log(req.body);
                    res.json({message: 'success'});
                    if (callbacks && callbacks.onSetupComplete) {
                        callbacks.onSetupComplete(req.body);
                    }
                });

                resolve();
            });
        },
        start: (port) => {
            return new Promise((resolve) => {
                console.log('Starting server');
                server.appServer = server.app.listen(port, () => {
                    console.log(`Listening on ${server.appServer.address().port}`);
                    resolve();
                });
            });
        },
        stop: () => {
            return new Promise((resolve) => {
                console.log('Stopping server');
                if (server.appServer) {
                    server.appServer.close();
                }

                resolve();
            });
        }
    };

    return server;
};
