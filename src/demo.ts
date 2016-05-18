import {Question, QuestionTypes} from './types/question.type';

var WIFIsetup = require('wifi-setup')(`Edyza ${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
    '123edyza',
    [
        new Question(
            'First name',
            'firstName',
            QuestionTypes.TEXT
        ),
        new Question(
            'Email',
            'email',
            QuestionTypes.EMAIL
        )
    ]
);

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
