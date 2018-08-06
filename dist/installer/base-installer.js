'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var path = require('path');
var tmp = require('tmp');
var fs = require('fs');
var rimraf = require('rimraf');

var DEFAULT_OPTIONS = {
    targetDir: ''
};

var BaseInstaller = function () {
    function BaseInstaller(options) {
        _classCallCheck(this, BaseInstaller);

        this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
        this.targetDir = this.opts.targetDir || tmp.dirSync().name;
        this.createTargetDir();
    }

    _createClass(BaseInstaller, [{
        key: 'install',
        value: function install() {
            if (this.isInstalled()) {
                return Promise.resolve(true);
            }
            return new Promise(function (resolve) {
                return resolve(true);
            });
        }
    }, {
        key: 'uninstall',
        value: function uninstall() {
            var _this = this;

            if (!this.isInstalled()) {
                return;
            }
            fs.readdirSync(this.targetDir).forEach(function (filename) {
                return rimraf.sync(path.join(_this.targetDir, filename));
            });
        }
    }, {
        key: 'reinstall',
        value: function reinstall() {
            this.uninstall();
            return this.install.apply(this, arguments);
        }
    }, {
        key: 'isInstalled',
        value: function isInstalled() {
            // Overwrite this to check specific version
            if (!fs.existsSync(this.targetDir) || !fs.readdirSync(this.targetDir).length) {
                return false;
            }
            return true;
        }
    }, {
        key: 'createTargetDir',
        value: function createTargetDir() {
            if (!fs.existsSync(this.targetDir)) {
                fs.mkdirSync(this.targetDir);
            }
        }
    }]);

    return BaseInstaller;
}();

module.exports = {
    BaseInstaller: BaseInstaller,
    DEFAULT_OPTIONS: DEFAULT_OPTIONS
};