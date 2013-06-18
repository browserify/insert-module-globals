var parseScope = require('lexical-scope');
var commondir = require('commondir');
var through = require('through');

var path = require('path');
var fs = require('fs');

var processModulePath = require.resolve('process/browser.js');
var processModuleSrc = fs.readFileSync(processModulePath, 'utf8');

var bufferModulePath = path.join(__dirname, 'buffer.js');
var bufferModuleSrc = fs.readFileSync(bufferModulePath, 'utf8');

var _vars = {
    process: function (row, globals) {
        if (!this.resolved.process) {
            this.queue({
                id: processModulePath,
                source: processModuleSrc,
                deps: {}
            });
        }
        
        this.resolved.process = true;
        row.deps.__browserify_process = processModulePath;
        globals.process = 'require("__browserify_process")';
    },
    global: function (row, globals) {
        globals.global = 'self';
    },
    Buffer: function (row, globals) {
        if (!this.resolved.Buffer) {
            this.queue({
                id: bufferModulePath,
                source: bufferModuleSrc,
                deps: {}
            });
        }
        
        this.resolved.Buffer = true;
        row.deps.__browserify_buffer = bufferModulePath;
        globals.Buffer = 'require("__browserify_buffer").Buffer';
    },
    __filename: function (row, globals) {
        var file = '/' + path.relative(this.basedir, row.id);
        globals.__filename = JSON.stringify(file);
    },
    __dirname: function (row, globals) {
        var dir = path.dirname('/' + path.relative(this.basedir, row.id));
        globals.__dirname = JSON.stringify(dir);
    }
}

module.exports = function (files, opts) {
    if (!Array.isArray(files)) {
        opts = files;
        files = [];
    }
    if (!opts) opts = {};
    if (!files) files = [];
    
    var vars = opts.vars || _vars

    var basedir = opts.basedir || (files.length
        ? commondir(files.map(function (x) {
            return path.resolve(path.dirname(x));
        }))
        : '/'
    );

    var varNames = Object.keys(vars)

    var quick = varNames.map(function (name) {
        return new RegExp('\\b'+name+'\\b', 'g')
    })

    var tr = through(write, end);

    tr.resolved = { /*process: false, Buffer: false*/ };
    tr.basedir = basedir

    return tr
    
    function write (row) {

        //remove hashbang if present
        row.source = String(row.source).replace(/^#![^\n]*\n/, '\n');

        if (!opts.always 
          && quick.every(function (rx) { return !rx.test(row.source) })
        )  return this.queue(row);

        var scope = opts.always
            ? { globals: { implicit: varNames } }
            : parseScope(row.source)
        ;

        var globals = {};

        for(var name in vars) {
          if(~scope.globals.implicit.indexOf(name))
            vars[name].call(this, row, globals);
        }

        row.source = closeOver(globals, row.source)

        this.queue(row);
    }
    
    function end () {
        this.ended = true;
        this.queue(null);
    }
};

function closeOver (globals, src) {
    var keys = Object.keys(globals);
    return '(function(' + keys + '){' + src + '\n})('
        + keys.map(function (key) { return globals[key] }).join(',') + ')'
    ;
}
