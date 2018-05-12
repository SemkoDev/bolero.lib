const { System } = require('../system');
const { BasePackageInstaller } = require('./base-package-installer');

const DEFAULT_OPTIONS = {
    name: 'iri',
    latestVersion: '1.4.2.4',
    emulateWindows: false,
    repo: {
        owner: 'iotaledger',
        repo: 'iri',
    }
};

class IRIInstaller extends BasePackageInstaller {
    constructor (options) {
        super (Object.assign({}, DEFAULT_OPTIONS, options));
        this.system = new System();
    }

    isWindows () {
        return this.system.isWindows() || this.opts.emulateWindows
    }

    getName () {
        return `iri-${this.opts.latestVersion}.jar`;
    }
}

module.exports = {
    IRIInstaller,
    DEFAULT_OPTIONS
};
