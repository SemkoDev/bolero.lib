'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var path = require('path');
var tmp = require('tmp');
var fs = require('fs');
var request = require('request');
var targz = require('targz');
var progress = require('request-progress');

var _require = require('./base-installer'),
    BaseInstaller = _require.BaseInstaller;

var DEFAULT_OPTIONS = {
    name: 'db',
    source: 'http://db.iota.partners/IOTA.partners-mainnetdb.tar.gz',
    onMessage: function onMessage(message) {}
};

tmp.setGracefulCleanup();

var DatabaseInstaller = function (_BaseInstaller) {
    _inherits(DatabaseInstaller, _BaseInstaller);

    function DatabaseInstaller(options) {
        _classCallCheck(this, DatabaseInstaller);

        var opts = Object.assign({}, DEFAULT_OPTIONS, options);
        return _possibleConstructorReturn(this, (DatabaseInstaller.__proto__ || Object.getPrototypeOf(DatabaseInstaller)).call(this, Object.assign({}, DEFAULT_OPTIONS, options, {
            targetDir: path.join(opts.targetDir || tmp.dirSync().name, opts.name)
        })));
    }

    _createClass(DatabaseInstaller, [{
        key: 'getTargetFileName',
        value: function getTargetFileName() {
            var temp = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

            return path.join(temp ? tmp.dirSync().name : this.targetDir, this.opts.source.split('/').splice(-1)[0]);
        }
    }, {
        key: 'install',
        value: function install(onProgress, onEnd, onError) {
            var _this2 = this;

            if (this.isInstalled()) {
                onEnd && onEnd();
                return;
            }
            var target = this.getTargetFileName(true);

            this.opts.onMessage('Download starting...');
            progress(request(this.opts.source), {
                // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
                // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
                // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
            }).on('progress', function (state) {
                // The state is an object that looks like this:
                // {
                //     percent: 0.5,               // Overall percent (between 0 to 1)
                //     speed: 554732,              // The download speed in bytes/sec
                //     size: {
                //         total: 90044871,        // The total payload size in bytes
                //         transferred: 27610959   // The transferred payload size in bytes
                //     },
                //     time: {
                //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
                //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
                //     }
                // }
                _this2.opts.onMessage('Downloading ' + (state.percent * 100).toFixed(2) + '% finished...');
                onProgress && onProgress(state);
            }).on('error', function (err) {
                _this2.opts.onMessage('Download failed!');
                onError && onError(err);
            }).on('end', function () {
                _this2.opts.onMessage('Downloaded. Extracting database...');
                targz.decompress({
                    src: target,
                    dest: _this2.targetDir
                }, function (err) {
                    if (err) {
                        _this2.opts.onMessage('Extracting failed!');
                        onError && onError(err);
                    } else {
                        _this2.opts.onMessage('Extraction complete!');
                        fs.unlinkSync(target);
                        onEnd && onEnd();
                    }
                });
            }).pipe(fs.createWriteStream(target));
        }
    }]);

    return DatabaseInstaller;
}(BaseInstaller);

module.exports = {
    DatabaseInstaller: DatabaseInstaller,
    DEFAULT_OPTIONS: DEFAULT_OPTIONS
};