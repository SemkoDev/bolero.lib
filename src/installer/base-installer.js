const path = require('path');
const tmp = require('tmp');
const fs = require('fs');
const rimraf = require('rimraf');

const DEFAULT_OPTIONS = {
    targetDir: ''
};

class BaseInstaller {
    constructor (options) {
        this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
        this.targetDir = this.opts.targetDir || tmp.dirSync().name;
        this.createTargetDir();
    }

    install () {
        if (this.isInstalled()) {
            return Promise.resolve(true);
        }
        return new Promise((resolve) => resolve(true));
    }

    uninstall () {
        if (!this.isInstalled()) {
            return;
        }
        fs.readdirSync(this.targetDir).forEach((filename) => rimraf.sync(path.join(this.targetDir, filename)));
    }

    reinstall () {
        this.uninstall();
        return this.install(...arguments);
    }

    isInstalled () {
        // Overwrite this to check specific version
        if (!fs.existsSync(this.targetDir) || !fs.readdirSync(this.targetDir).length) {
            return false;
        }
        return true;
    }

    createTargetDir () {
        if (!fs.existsSync(this.targetDir)) {
            fs.mkdirSync(this.targetDir);
        }
    }
}

module.exports = {
    BaseInstaller,
    DEFAULT_OPTIONS
};