'use strict';

var benchmark = require('benchmark');

var suite = new benchmark.Suite();

String.prototype.replaceAllRGX = function (find, replace) {
    return this.replace(new RegExp(find, 'g'), replace);
};
suite.add('RegExp test', function () {
    'asdf {{test}} fdsa'.replaceAllRGX('{{test}}', 'Hello, world!');
});

String.prototype.replaceAllSJ = function (find, replace) {
    return this.split(find).join(replace);
};
suite.add('Split/Join test', function () {
    'asdf {{test}} fdsa'.replaceAllSJ('{{test}}', 'Hello, world!');
});

suite.on('cycle', function (event) {
    console.log(String(event.target));
});

suite.on('complete', function () {
    console.log('Fastest in ' + benchmark.filter(suite, 'fastest'));
});

suite.run({ async: true });