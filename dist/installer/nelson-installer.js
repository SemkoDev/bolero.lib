'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var os = require('os');

var _require = require('./base-package-installer'),
    BasePackageInstaller = _require.BasePackageInstaller;

var DEFAULT_OPTIONS = {
    name: 'nelson',
    latestVersion: '0.3.5',
    repo: {
        owner: 'SemkoDev',
        repo: 'nelson.cli'
    }
};

var NelsonInstaller = function (_BasePackageInstaller) {
    _inherits(NelsonInstaller, _BasePackageInstaller);

    function NelsonInstaller(options) {
        _classCallCheck(this, NelsonInstaller);

        return _possibleConstructorReturn(this, (NelsonInstaller.__proto__ || Object.getPrototypeOf(NelsonInstaller)).call(this, Object.assign({}, DEFAULT_OPTIONS, options)));
    }

    _createClass(NelsonInstaller, [{
        key: 'getName',
        value: function getName() {
            return 'nelson-' + this.opts.latestVersion + '-' + this.getExtension();
        }
    }, {
        key: 'getExtension',
        value: function getExtension() {
            switch (os.platform()) {
                case 'linux':
                    return 'linux';
                case 'darwin':
                    return 'macos';
                case 'win32':
                default:
                    return 'win.exe';
            }
        }
    }]);

    return NelsonInstaller;
}(BasePackageInstaller);

module.exports = {
    NelsonInstaller: NelsonInstaller,
    DEFAULT_OPTIONS: DEFAULT_OPTIONS
};