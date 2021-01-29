var test = require('tape');
var vm = require('vm');
var concat = require('concat-stream');

var path = require('path');
var insert = require('../');
var bpack = require('browser-pack');
var mdeps = require('module-deps');

test('$', function (t) {
    t.plan(1);
    
    var file = path.join(__dirname, 'jquery', 'main.js');
    var deps = mdeps();
    var pack = bpack({ raw: true });
    
    deps.pipe(pack);
    
    pack.pipe(concat(function (src) {
        var c = {
            window: { jQuery: function () { return 20 } }
        };
        vm.runInNewContext('require=' + src, c);
        var x = c.require(file);
        t.equal(x, 20);
    }));
    
    deps.write({ transform: inserter, global: true });
    deps.end(file);
});

function inserter (file) {
    return insert(file, {
        basedir: __dirname + '/jquery',
        vars: { $: function () { return 'window.jQuery' } }
    });
}
