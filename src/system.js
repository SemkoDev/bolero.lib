const os = require('os');
const diskspace = require('diskspace');
const child_process =require('child_process');

const DEFAULT_OPTIONS = {
    minimalMemory: 3600, //MB
    minimalSpace: 8000, //MB
    supportedPlatform: [ 'linux', 'darwin', 'win32' ],
    onMessage: (message) => {}
};

class System {
    constructor (options) {
        this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
    }

    isReady () {
        return new Promise((resolve) => {
            if (!this.hasEnoughMemory() || !this.isSupportedPlatform()) {
                return resolve(false);
            }
            this.hasEnoughSpace().then((okay) => {
                if (!okay) {
                    return resolve(false);
                }
                this.hasJavaInstalled().then((okay) => {
                    resolve(okay);
                })
            })
        });
    }

    isSupportedPlatform () {
        const result = this.opts.supportedPlatform.includes(os.platform());
        if (!result) {
            this.opts.onMessage('Your platform is not supported!');
        }
        return result;
    }

    hasEnoughMemory () {
        const result = os.totalmem() >= this.opts.minimalMemory * 1024 * 1024;
        if (!result) {
            this.opts.onMessage('Not enough memory!');
        }
        return result;
    }

    hasEnoughSpace () {
        return new Promise ((resolve) => {
            diskspace.check(os.homedir(), (err, info) => {
                if (err) {
                    resolve(false);
                } else {
                    if (info.free < this.opts.minimalSpace * 1024 * 1024) {
                        this.opts.onMessage('Not enough space in home directory!');
                        resolve(false);
                    }
                    diskspace.check(os.tmpdir(), (err, info) => {
                        if (err) {
                            resolve(false);
                        } else {
                            this.opts.onMessage('Not enough space in temp directory!');
                            resolve(info.free >= this.opts.minimalSpace * 1024 * 1024);
                        }
                    });
                }
            });
        });
    }

    hasJavaInstalled () {
        return new Promise ((resolve) => {
            const spawn = child_process.spawn('java', ['-version']);
            spawn.on('error', () => {
                return resolve(false);
            });
            spawn.stderr.on('data', (data) => {
                if (!data || !data.toString()) {
                    return resolve(false);
                }
                data = data.toString().split('\n')[0];
                const javaVersion = new RegExp('java version').test(data) || new RegExp('openjdk version').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
                resolve(javaVersion !== false && this._checkJavaVersion(javaVersion));
            });
        }).then((result) => {
            this.opts.onMessage('No Java found on your system! If you just installed, consider restarting your computer.');
            return result;
        })
    }

    _checkJavaVersion (versionString) {
        const tokens = versionString.split('_');
        const versions = tokens[0].split('.');
        const ext = (tokens[1] && parseInt(tokens[1])) || 0;
        const major = (versions[0] && parseInt(versions[0])) || 0;
        const minor = (versions[1] && parseInt(versions[1])) || 0;
        const patch = (versions[2] && parseInt(versions[2])) || 0;
        return (
            major > 8 ||
            (major > 2 && (minor || patch)) ||
            (major === 1 && (minor > 8 || minor === 8 && (patch > 0 || ext >= 151)))
        )
    }
}

module.exports = {
    System,
    DEFAULT_OPTIONS
};