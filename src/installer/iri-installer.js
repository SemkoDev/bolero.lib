const { BasePackageInstaller } = require('./base-package-installer');

const DEFAULT_OPTIONS = {
    name: 'iri',
    latestVersion: '1.4.1.4',
    repo: {
        owner: 'iotaledger',
        repo: 'iri',
    },
};

class IRIInstaller extends BasePackageInstaller {
    constructor (options) {
        super (Object.assign({}, DEFAULT_OPTIONS, options));
    }

    getName () {
        return `iri-${this.opts.latestVersion}.jar`;
    }
}

module.exports = {
    IRIInstaller,
    DEFAULT_OPTIONS
};
