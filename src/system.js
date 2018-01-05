const os = require('os');
const diskspace = require('diskspace');
const child_process =require('child_process');

const DEFAULT_OPTIONS = {
    minimalMemory: 4000, //MB
    minimalSpace: 8000, //MB
    supportedPlatform: [ 'linux', 'darwin', 'win32' ]
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
        return this.opts.supportedPlatform.includes(os.platform())
    }

    hasEnoughMemory () {
        return os.totalmem() >= this.opts.minimalMemory * 1024 * 1024;
    }

    hasEnoughSpace () {
        const path = os.platform() === 'win32' ? 'C' : '/';
        return new Promise ((resolve) => {
            diskspace.check(path, (err, info) => {
                if (err) {
                    resolve(false);
                } else {
                    resolve(info.free >= this.opts.minimalSpace * 1024 * 1024);
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
                data = data.toString().split('\n')[0];
                const javaVersion = new RegExp('java version').test(data) ? data.split(' ')[2].replace(/"/g, '') : false;
                resolve(javaVersion !== false);
            });
        })
    }
}

module.exports = {
    System,
    DEFAULT_OPTIONS
};