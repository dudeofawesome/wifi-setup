var fs = require('fs');
var Promise = require('bluebird');
Promise.onPossiblyUnhandledRejection(function (error) {
    throw error;
});

module.exports = {
    // NOTE: this is not cryptographically secure. Only use this for very unimportant passwords
    /* requirements = {lowercase: true, uppercase: true, numbers: true, symbols: true} */
    /* specialLists = {lowercase: "??", uppercase: "??", numbers: "??", symbols: "??"} */
    generatePassword: function (length, requirements, specialLists) {
        var lowercase = 'abcdefghijklmnopqrstuvwxyz';
        var uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        var numbers = '0123456789';
        var symbols = '!@#$%^&*()-_+=,<.>/?|`~';
        if (specialLists) {
            if (specialLists.lowercase) {
                lowercase = specialLists.lowercase;
            }
            if (specialLists.uppercase) {
                uppercase = specialLists.uppercase;
            }
            if (specialLists.numbers) {
                numbers = specialLists.numbers;
            }
            if (specialLists.symbols) {
                symbols = specialLists.symbols;
            }
        }

        if (!requirements) {
            requirements = {};
        }
        if (!requirements.lowercase) {
            requirements.lowercase = true;
        }
        if (!requirements.uppercase) {
            requirements.uppercase = true;
        }
        if (!requirements.numbers) {
            requirements.numbers = true;
        }
        if (!requirements.symbols) {
            requirements.symbols = true;
        }
        if (!length) {
            length = 24;
        }

        var characters = ((requirements.lowercase) ? lowercase : '') + ((requirements.uppercase) ? uppercase : '') + ((requirements.numbers) ? numbers : '') + ((requirements.symbols) ? symbols : '');
        var password = '';
        for (var i = 0; i < length; i++) {
            password += characters[Math.floor(Math.random() * characters.length)];
        }

        return password;
    },
    backupFile: function (path, modifier) {
        if (!modifier) {
            modifier = function (path) {
                return path += '.back';
            };
        }

        fs.renameSync(path, modifier(path));
    }
};
