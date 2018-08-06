'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var os = require('os');
var diskspace = require('diskspace');
var child_process = require('child_process');

var DEFAULT_OPTIONS = {
    minimalMemory: 3600, //MB
    minimalSpace: 8000, //MB
    supportedPlatform: ['linux', 'darwin', 'win32'],
    onMessage: function onMessage(message) {}
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
            var result = this.opts.supportedPlatform.includes(os.platform());
            if (!result) {
                this.opts.onMessage('Your platform is not supported!');
            }
            return result;
        }
    }, {
        key: 'hasEnoughMemory',
        value: function hasEnoughMemory() {
            var result = os.totalmem() >= this.opts.minimalMemory * 1024 * 1024;
            if (!result) {
                this.opts.onMessage('Not enough memory!');
            }
            return result;
        }
    }, {
        key: 'isWindows',
        value: function isWindows() {
            return os.platform() === 'win32';
        }
    }, {
        key: 'hasEnoughSpace',
        value: function hasEnoughSpace() {
            var _this2 = this;

            var databaseAlreadyInstalled = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            return new Promise(function (resolve) {
                if (databaseAlreadyInstalled) {
                    return resolve(true);
                }
                diskspace.check(_this2.isWindows() ? 'C' : os.homedir(), function (err, info) {
                    if (err) {
                        resolve(false);
                    } else {
                        if (info.free < _this2.opts.minimalSpace * 1024 * 1024) {
                            _this2.opts.onMessage('Not enough space in home directory!');
                            return resolve(false);
                        }
                        if (_this2.isWindows()) {
                            return resolve(true);
                        }
                        diskspace.check(os.tmpdir(), function (err, info) {
                            if (err) {
                                resolve(false);
                            } else {
                                var result = info.free >= _this2.opts.minimalSpace * 1024 * 1024;
                                !result && _this2.opts.onMessage('Not enough space in temp directory!');
                                resolve(result);
                            }
                        });
                    }
                });
            });
        }
    }, {
        key: 'hasJavaInstalled',
        value: function hasJavaInstalled() {
            var _this3 = this;

            return new Promise(function (resolve) {
                var spawn = child_process.spawn('java', ['-version']);
                var received = false;
                spawn.on('error', function () {
                    _this3.opts.onMessage('Java could not be started!');
                    return resolve(false);
                });
                spawn.stderr.on('data', function (data) {
                    if (received) {
                        return;
                    }
                    received = true;
                    if (!data || !data.toString()) {
                        _this3.opts.onMessage('Java does not respond!');
                        return resolve(false);
                    }
                    _this3.opts.onMessage('Java: \n' + data);
                    var javaVersion = _this3._parseJavaVersion(data);
                    resolve(javaVersion !== false && _this3._checkJavaVersion(javaVersion));
                });
            }).then(function (result) {
                !result && _this3.opts.onMessage('No supported Java found on your system! If you just installed, consider restarting your computer.');
                return result;
            });
        }
    }, {
        key: '_parseJavaVersion',
        value: function _parseJavaVersion(raw) {
            var data = raw.toString().split('\n')[0];
            this.opts.onMessage('Java version line: [' + data + ']');
            var javaVersion = new RegExp('java version').test(data) || new RegExp('openjdk version').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
            this.opts.onMessage('Java version detected: [' + (javaVersion || 'none') + ']');
            return javaVersion;
        }
    }, {
        key: '_checkJavaVersion',
        value: function _checkJavaVersion(versionString) {
            var tokens = versionString.split('_');
            var versions = tokens[0].split('.');
            var ext = tokens[1] && parseInt(tokens[1]) || 0;
            var major = versions[0] && parseInt(versions[0]) || 0;
            var minor = versions[1] && parseInt(versions[1]) || 0;
            var patch = versions[2] && parseInt(versions[2]) || 0;
            return major > 8 || major > 2 && (minor || patch) || major === 1 && (minor > 8 || minor === 8 && (patch > 0 || ext >= 151));
        }
    }]);

    return System;
}();

module.exports = {
    System: System,
    DEFAULT_OPTIONS: DEFAULT_OPTIONS
};