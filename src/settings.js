const path = require('path');
const tmp = require('tmp');
const fs = require('fs');
const DEFAULT_IRI_OPTIONS = require('./iri').DEFAULT_OPTIONS;
const DEFAULT_NELSON_OPTIONS = require('./nelson').DEFAULT_OPTIONS;
const DEFAULT_FIELD_OPTIONS = require('./field').DEFAULT_OPTIONS;

const DEFAULT_SETTINGS = {
    version: 0,
    databaseVersion: '1.4.2.1',
    iriPort: DEFAULT_IRI_OPTIONS.port,
    iriPublic: DEFAULT_IRI_OPTIONS.isPublic,
    name: DEFAULT_NELSON_OPTIONS.name,
    protocol: DEFAULT_NELSON_OPTIONS.protocol,
    seed: DEFAULT_FIELD_OPTIONS.seed,
    address: DEFAULT_FIELD_OPTIONS.address,
};

tmp.setGracefulCleanup();

class Settings {
    constructor(options) {
        this.opts = options || {};
        this.settingsPath = path.join(this.opts.basePath || tmp.dirSync().name, 'settings.json');
        this.settings = this.saveSettings(Object.assign({}, DEFAULT_SETTINGS, this.loadSettings()));
    }

    loadSettings () {
        if (!fs.existsSync(this.settingsPath)) {
            return this.saveSettings(DEFAULT_SETTINGS)
        }
        return JSON.parse(fs.readFileSync(this.settingsPath));
    }

    saveSettings (config) {
        this.settings = Object.assign({}, this.settings, config);
        fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings, null, 4));
        return this.settings;
    }

    getSettings () {
        return this.settings
    }
}

module.exports = {
    Settings,
    DEFAULT_SETTINGS
};