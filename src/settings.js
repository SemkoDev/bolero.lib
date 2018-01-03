const path = require('path');
const tmp = require('tmp');
const fs = require('fs');

const DEFAULT_CONFIG = {
  version: 0
};

tmp.setGracefulCleanup();

class Config {
    constructor(options) {
        this.opts = options || {};
        this.configPath = path.join(this.opts.basePath || tmp.dirSync().name, 'config.json');
        this.config = this.loadConfig();
    }

    loadConfig () {
        if (!fs.existsSync(this.configPath)) {
            return this.saveConfig(DEFAULT_CONFIG)
        }
        return JSON.parse(fs.readFileSync(this.configPath));
    }

    saveConfig (config) {
        this.config = Object.assign({}, this.config, config);
        fs.writeFileSync(this.configPath, JSON.stringify(this.config));
        return this.config;
    }

    getConfig () {
        return this.config
    }
}

module.exports = {
    Config,
    DEFAULT_CONFIG
};