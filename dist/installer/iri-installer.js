'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _require = require('../system'),
    System = _require.System;

var _require2 = require('./base-package-installer'),
    BasePackageInstaller = _require2.BasePackageInstaller;

var DEFAULT_OPTIONS = {
    name: 'iri',
    latestVersion: '1.4.2.4',
    emulateWindows: false,
    repo: {
        owner: 'iotaledger',
        repo: 'iri'
    }
};

var IRIInstaller = function (_BasePackageInstaller) {
    _inherits(IRIInstaller, _BasePackageInstaller);

    function IRIInstaller(options) {
        _classCallCheck(this, IRIInstaller);

        var _this = _possibleConstructorReturn(this, (IRIInstaller.__proto__ || Object.getPrototypeOf(IRIInstaller)).call(this, Object.assign({}, DEFAULT_OPTIONS, options)));

        _this.system = new System();
        return _this;
    }

    _createClass(IRIInstaller, [{
        key: 'isWindows',
        value: function isWindows() {
            return this.system.isWindows() || this.opts.emulateWindows;
        }
    }, {
        key: 'getName',
        value: function getName() {
            return 'iri-' + this.opts.latestVersion + '.jar';
        }
    }]);

    return IRIInstaller;
}(BasePackageInstaller);

module.exports = {
    IRIInstaller: IRIInstaller,
    DEFAULT_OPTIONS: DEFAULT_OPTIONS
};