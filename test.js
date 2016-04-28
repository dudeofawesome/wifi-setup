var benchmark = require('benchmark');

var suite = new benchmark.Suite;

String.prototype.replaceAllRGX = function (find, replace) {
    return this.replace(new RegExp(find, 'g'), replace);
};
suite.add('RegExp test', () => {
    'asdf {{test}} fdsa'.replaceAllRGX('{{test}}', 'Hello, world!');
});

String.prototype.replaceAllSJ = function (find, replace) {
    return this.split(find).join(replace);
};
suite.add('Split/Join test', () => {
    'asdf {{test}} fdsa'.replaceAllSJ('{{test}}', 'Hello, world!');
});

suite.on('cycle', (event) => {
    console.log(String(event.target));
});

suite.on('complete', () => {
    console.log(`Fastest in ${benchmark.filter(suite, 'fastest')}`);
});

suite.run({async: true});
