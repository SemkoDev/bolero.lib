const path = require('path');
const tmp = require('tmp');
const fs = require('fs');

const DEFAULT_SETTINGS = {
    version: 0,
    databaseVersion: '1.4.1.7'
};

tmp.setGracefulCleanup();

class Settings {
    constructor(options) {
        this.opts = options || {};
        this.settingsPath = path.join(this.opts.basePath || tmp.dirSync().name, 'settings.json');
        this.settings = this.loadSettings();
    }

    loadSettings () {
        if (!fs.existsSync(this.settingsPath)) {
            return this.saveSettings(DEFAULT_SETTINGS)
        }
        return JSON.parse(fs.readFileSync(this.settingsPath));
    }

    saveSettings (config) {
        this.settings = Object.assign({}, this.settings, config);
        fs.writeFileSync(this.settingsPath, JSON.stringify(this.settings));
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