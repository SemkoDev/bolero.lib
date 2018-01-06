const fs = require('fs-extra');
const path = require('path');
const { BasePackageInstaller } = require('./base-package-installer');

const DEFAULT_OPTIONS = {
    name: 'iri',
    latestVersion: '1.4.1.6',
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
        // TODO: replace when IRI bug #350 is fixed and published: https://github.com/iotaledger/iri/issues/350
        return `iri-${this.opts.latestVersion}-bolero.jar`;
        // return `iri-${this.opts.latestVersion}.jar`;
    }

    // TODO: remove when IRI bug #350 is fixed and published: https://github.com/iotaledger/iri/issues/350
    install (onProgress, onEnd, onError) {
        if (this.isInstalled()) {
            onEnd && onEnd();
            return;
        }
        fs.copySync(path.join(__dirname, '..', '..', this.getName()), this.getTargetFileName());
        onEnd && onEnd();
        return Promise.resolve();
    }
}

module.exports = {
    IRIInstaller,
    DEFAULT_OPTIONS
};
