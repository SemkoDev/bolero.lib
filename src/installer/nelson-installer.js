const os = require('os');
const { BasePackageInstaller } = require('./base-package-installer');

const DEFAULT_OPTIONS = {
    name: 'nelson',
    latestVersion: '0.3.12',
    repo: {
        owner: 'SemkoDev',
        repo: 'nelson.cli',
    },
};

class NelsonInstaller extends BasePackageInstaller {
    constructor (options) {
        super (Object.assign({}, DEFAULT_OPTIONS, options));
    }

    getName () {
        return `nelson-${this.opts.latestVersion}-${this.getExtension()}`;
    }

    getExtension () {
        switch(os.platform()) {
            case 'linux':
                return 'linux';
            case 'darwin':
                return 'macos';
            case 'win32':
            default:
                return 'win.exe';
        }
    }
}

module.exports = {
    NelsonInstaller,
    DEFAULT_OPTIONS
};
