'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var path = require('path');
var tmp = require('tmp');
var fs = require('fs');
var DEFAULT_IRI_OPTIONS = require('./iri').DEFAULT_OPTIONS;
var DEFAULT_NELSON_OPTIONS = require('./nelson').DEFAULT_OPTIONS;

var DEFAULT_SETTINGS = {
    version: 0,
    databaseVersion: '1.4.2.1',
    iriPort: DEFAULT_IRI_OPTIONS.port,
    iriPublic: DEFAULT_IRI_OPTIONS.isPublic,
    name: DEFAULT_NELSON_OPTIONS.name,
    protocol: DEFAULT_NELSON_OPTIONS.protocol
};

tmp.setGracefulCleanup();

var Settings = function () {
    function Settings(options) {
        _classCallCheck(this, Settings);

        this.opts = options || {};
        this.settingsPath = path.join(this.opts.basePath || tmp.dirSync().name, 'settings.json');
        this.settings = this.loadSettings();
    }

    _createClass(Settings, [{
        key: 'loadSettings',
        value: function loadSettings() {
            if (!fs.existsSync(this.settingsPath)) {
                return this.saveSettings(DEFAULT_SETTINGS);
            }
            return JSON.parse(fs.readFileSync(this.settingsPath));
        }
    }, {
        key: 'saveSettings',
        value: function saveSettings(config) {
            this.settings = Object.assign({}, this.settings, config);
            fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 4));
            return this.settings;
        }
    }, {
        key: 'getSettings',
        value: function getSettings() {
            return this.settings;
        }
    }]);

    return Settings;
}();

module.exports = {
    Settings: Settings,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS
};