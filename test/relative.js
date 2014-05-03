var test = require('tap').test;
var insert = require('../');

test('use relative path for process', function (t) {
    t.plan(1);

    var expected = '../node_modules/process/browser.js';
    var result = insert.vars.process();

    t.ok(result.indexOf(expected) !== -1);
});
