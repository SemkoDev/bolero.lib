'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var path = require('path');
var tmp = require('tmp');
var fs = require('fs-extra');
var request = require('request');
var getLatestRelease = require('get-latest-release');
var progress = require('request-progress');

var _require = require('./base-installer'),
    BaseInstaller = _require.BaseInstaller;

var DEFAULT_OPTIONS = {
    name: 'nelson',
    repo: {
        owner: 'SemkoDev',
        repo: 'nelson.cli'
    }
};

tmp.setGracefulCleanup();

var BasePackageInstaller = function (_BaseInstaller) {
    _inherits(BasePackageInstaller, _BaseInstaller);

    function BasePackageInstaller(options) {
        _classCallCheck(this, BasePackageInstaller);

        var opts = Object.assign({}, DEFAULT_OPTIONS, options);
        return _possibleConstructorReturn(this, (BasePackageInstaller.__proto__ || Object.getPrototypeOf(BasePackageInstaller)).call(this, Object.assign(opts, {
            targetDir: path.join(opts.targetDir || tmp.dirSync().name, opts.name)
        })));
    }

    _createClass(BasePackageInstaller, [{
        key: 'getLatestReleases',
        value: function getLatestReleases() {
            return getLatestRelease(this.opts.repo).then(function (info) {
                return info.assets;
            });
        }
    }, {
        key: 'selectVersion',
        value: function selectVersion() {
            var name = this.getName();
            return this.getLatestReleases().then(function (releases) {
                return releases.filter(function (r) {
                    return r.name === name;
                })[0];
            });
        }
    }, {
        key: 'getName',
        value: function getName() {
            return this.opts.name;
        }
    }, {
        key: 'getTargetFileName',
        value: function getTargetFileName() {
            return path.join(this.targetDir, this.getName());
        }
    }, {
        key: 'isInstalled',
        value: function isInstalled() {
            return _get(BasePackageInstaller.prototype.__proto__ || Object.getPrototypeOf(BasePackageInstaller.prototype), 'isInstalled', this).call(this) && fs.existsSync(this.getTargetFileName());
        }
    }, {
        key: 'install',
        value: function install(onProgress, onEnd, onError) {
            var _this2 = this;

            if (this.isInstalled()) {
                onEnd && onEnd();
                return;
            }

            var target = path.join(tmp.dirSync().name, this.getName());

            this.selectVersion().then(function (version) {
                if (!version) {
                    onError && onError(new Error('could not find version ' + _this2.opts.version + ' in latest!'));
                }
                progress(request(version.download_url), {
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
                    onProgress && onProgress(state);
                }).on('error', function (err) {
                    onError && onError(err);
                }).on('end', function () {
                    fs.moveSync(target, _this2.getTargetFileName());
                    onEnd && onEnd();
                }).pipe(fs.createWriteStream(target));
            });
        }
    }]);

    return BasePackageInstaller;
}(BaseInstaller);

module.exports = {
    BasePackageInstaller: BasePackageInstaller,
    DEFAULT_OPTIONS: DEFAULT_OPTIONS
};