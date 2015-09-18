var test = require('tap').test;
var mdeps = require('module-deps');
var bpack = require('browser-pack');
var insert = require('../');
var concat = require('concat-stream');
var vm = require('vm');

test('isbuffer', function (t) {
    t.plan(3);
    var deps = mdeps();
    var pack = bpack({ raw: true, hasExports: true });
    deps.pipe(pack).pipe(concat(function (src) {
        var c = {};
        vm.runInNewContext(src, c);
        t.equal(c.require('main')(Buffer('wow')), true, 'is a buffer');
        t.equal(c.require('main')('wow'), false, 'not a buffer (string)');
        t.equal(c.require('main')({}), false, 'not a buffer (object)');
    }));
    deps.end({ id: 'main', file: __dirname + '/isbuffer/main.js' });
});
