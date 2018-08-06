const path = require('path');
const tmp = require('tmp');
const fs = require('fs-extra');
const request = require('request');
const getLatestRelease = require('get-latest-release');
const progress = require('request-progress');
const { BaseInstaller } = require('./base-installer');

const DEFAULT_OPTIONS = {
    name: 'nelson',
    latestVersion: 'x.x.x',
    repo: {
        owner: 'SemkoDev',
        repo: 'nelson.cli',
    },
};

tmp.setGracefulCleanup();

class BasePackageInstaller extends BaseInstaller {
    constructor (options) {
        const opts = Object.assign({}, DEFAULT_OPTIONS, options);
        super(Object.assign(opts, {
            targetDir: path.join(opts.targetDir || tmp.dirSync().name, opts.name)
        }));
    }

    getLatestReleases () {
        return getLatestRelease(this.opts.repo).then((info) => info.assets);
    }

    selectVersion () {
        const name = this.getName();
        return this.getLatestReleases().then((releases) => {
            return releases.filter(r => r.name === name)[0];
        });
    }

    getName () {
        return this.opts.name;
    }

    getTargetFileName () {
        return path.join(this.targetDir, this.getName());
    }

    isInstalled () {
        return super.isInstalled() && fs.existsSync(this.getTargetFileName())
    }

    install (onProgress, onEnd, onError) {
        if (this.isInstalled()) {
            onEnd && onEnd();
            return;
        }

        const target = path.join(tmp.dirSync().name, this.getName());

        this.selectVersion().then((version) => {
            if (!version) {
                onError && onError(new Error(`could not find version ${this.opts.latestVersion} in latest!`));
            }
            progress(request(version.download_url), {
                // throttle: 2000,                    // Throttle the progress event to 2000ms, defaults to 1000ms
                // delay: 1000,                       // Only start to emit after 1000ms delay, defaults to 0ms
                // lengthHeader: 'x-transfer-length'  // Length header to use, defaults to content-length
            })
                .on('progress', (state) => {
                    // The state is an object that looks like this:
                    // {
                    //     percent: 0.5,               // Overall percent (between 0 to 1)
                    //     speed: 554732,              // The download speed in bytes/sec
                    //     size: {
                    //         total: 90044871,        // The total payload size in bytes
                    //         transferred: 27610959   // The transferred payload size in bytes
                    //     },
                    //     time: {
                    //         elapsed: 36.235,        // The total elapsed seconds since the start (3 decimals)
                    //         remaining: 81.403       // The remaining seconds to finish (3 decimals)
                    //     }
                    // }
                    onProgress && onProgress(state);
                })
                .on('error', (err) => {
                    onError && onError(err)
                })
                .on('end', () => {
                    fs.moveSync(target, this.getTargetFileName());
                    onEnd && onEnd()
                })
                .pipe(fs.createWriteStream(target));
        })
    }
}

module.exports = {
    BasePackageInstaller,
    DEFAULT_OPTIONS
};
