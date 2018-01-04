'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var os = require('os');
var diskspace = require('diskspace');
var child_process = require('child_process');

var DEFAULT_OPTIONS = {
    minimalMemory: 4000, //MB
    minimalSpace: 8000, //MB
    supportedPlatform: ['linux', 'darwin', 'win32']
};

var System = function () {
    function System(options) {
        _classCallCheck(this, System);

        this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
    }

    _createClass(System, [{
        key: 'isReady',
        value: function isReady() {
            var _this = this;

            return new Promise(function (resolve) {
                if (!_this.hasEnoughMemory() || !_this.isSupportedPlatform()) {
                    return resolve(false);
                }
                _this.hasEnoughSpace().then(function (okay) {
                    if (!okay) {
                        return resolve(false);
                    }
                    _this.hasJavaInstalled().then(function (okay) {
                        resolve(okay);
                    });
                });
            });
        }
    }, {
        key: 'isSupportedPlatform',
        value: function isSupportedPlatform() {
            return this.opts.supportedPlatform.includes(os.platform());
        }
    }, {
        key: 'hasEnoughMemory',
        value: function hasEnoughMemory() {
            return os.totalmem() >= this.opts.minimalMemory * 1024 * 1024;
        }
    }, {
        key: 'hasEnoughSpace',
        value: function hasEnoughSpace() {
            var _this2 = this;

            var path = os.platform() === 'win32' ? 'C' : '/';
            return new Promise(function (resolve) {
                diskspace.check(path, function (err, info) {
                    if (err) {
                        resolve(false);
                    } else {
                        resolve(info.free >= _this2.opts.minimalSpace * 1024 * 1024);
                    }
                });
            });
        }
    }, {
        key: 'hasJavaInstalled',
        value: function hasJavaInstalled() {
            return new Promise(function (resolve) {
                var spawn = child_process.spawn('java', ['-version']);
                spawn.on('error', function (err) {
                    return callback(err, null);
                });
                spawn.stderr.on('data', function (data) {
                    data = data.toString().split('\n')[0];
                    var javaVersion = new RegExp('java version').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
                    resolve(javaVersion !== false);
                });
            });
        }
    }]);

    return System;
}();

module.exports = {
    System: System,
    DEFAULT_OPTIONS: DEFAULT_OPTIONS
};