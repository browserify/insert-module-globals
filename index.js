var fs = require('fs');

var commondir = require('commondir');
var through = require('through');

var path = require('path');
var processModulePath = require.resolve('process/browser.js');
var processModuleSrc = fs.readFileSync(processModulePath, 'utf8');

module.exports = function (files, opts) {
    if (!Array.isArray(files)) {
        opts = files;
        files = [];
    }
    if (!opts) opts = {};
    if (!files) files = [];
    
    var basedir = opts.basedir || (files.length
        ? commondir(files.map(function (x) {
            return path.resolve(path.dirname(x));
        }))
        : '/'
    );
    var resolvedProcess = false;
    
    var tr = through(write, end);
    
    function write (row) {
        var tr = this;

        var global_re = /(\b|;)global[.].*/;
        var process_re = /(\b|;)process[.].*/;
        var filename_re = /__filename[^a-zA-Z_$]/;
        var dirname_re = /__dirname[^a-zA-Z_$]/;

        var globals = {};
        
        if (process_re.test(row.source)) {
            tr.queue({
                id: processModulePath,
                deps: {},
                source: processModuleSrc
            });
            row.deps.__browserify_process = processModulePath;
            globals.process = 'require("__browserify_process")';
        }
        if (global_re.test(row.source)) {
            globals.global = 'window';
        }
        if (filename_re.test(row.source)) {
            var file = '/' + path.relative(basedir, row.id);
            globals.__filename = JSON.stringify(file);
        }
        if (dirname_re.test(row.source)) {
            var dir = path.dirname('/' + path.relative(basedir, row.id));
            globals.__dirname = JSON.stringify(dir);
        }

        if (Object.keys(globals).length === 0) {
            return tr.queue(row);
        }
        
        row.source = closeOver(globals, row.source);
        tr.queue(row);
    }
    
    function end () {
        this.ended = true;
        this.queue(null);
    }

    return tr
};

function closeOver (globals, src) {
    var keys = Object.keys(globals);
    return '(function(' + keys + '){' + src + '\n})('
        + keys.map(function (key) { return globals[key] }).join(',') + ')'
    ;
}
