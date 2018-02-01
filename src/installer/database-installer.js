const path = require('path');
const tmp = require('tmp');
const os = require('os');
const fs = require('fs');
const rimraf = require('rimraf');
const request = require('request');
const targz = require('targz');
const progress = require('request-progress');
const { BaseInstaller } = require('./base-installer');

const DEFAULT_OPTIONS = {
    name: 'db',
    source: 'http://db.iota.partners/IOTA.partners-mainnetdb.tar.gz',
    databaseVersion: '1.4.2.1',
    onMessage: (message) => {}
};

tmp.setGracefulCleanup();

class DatabaseInstaller extends BaseInstaller {
    constructor (options) {
        const opts = Object.assign({}, DEFAULT_OPTIONS, options);
        super(Object.assign({}, DEFAULT_OPTIONS, options, {
            targetDir: path.join(opts.targetDir || tmp.dirSync().name, opts.name)
        }));
    }

    getTargetFileName (temp=false) {
        return path.join(temp ? tmp.dirSync().name : this.targetDir, this.opts.source.split('/').splice(-1)[0]);
    }

    isInstalled () {
        const sinstalled = super.isInstalled();
        if (sinstalled && this.opts.settings && this.opts.settings.settings.databaseVersion !== DEFAULT_OPTIONS.databaseVersion) {
            // Delete old database so we can download the new one.
            rimraf.sync(this.targetDir);
            this.opts.settings && this.opts.settings.saveSettings({
                databaseVersion: DEFAULT_OPTIONS.databaseVersion
            });
            return false;
        }
        // Until we do not have snappy-disabled snapshots, windows users cannot download the database
        // and have to sync manually.
        return os.platform() === 'win32' || sinstalled
    }

    install (onProgress, onEnd, onError) {
        if (this.isInstalled()) {
            onEnd && onEnd();
            return;
        }
        const target = this.getTargetFileName(true);

        this.opts.onMessage('Download starting...');
        progress(request(this.opts.source), {
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
                this.opts.onMessage(`Downloading ${(state.percent * 100).toFixed(2)}% finished...`);
                onProgress && onProgress(state);
            })
            .on('error', (err) => {
                this.opts.onMessage('Download failed!');
                onError && onError(err)
            })
            .on('end', () => {
                this.opts.onMessage('Downloaded. Extracting database...');
                targz.decompress({
                    src: target,
                    dest: this.targetDir
                }, (err) => {
                    if(err) {
                        this.opts.onMessage('Extracting failed!');
                        onError && onError(err);
                    } else {
                        this.opts.settings && this.opts.settings.saveSettings({
                            databaseVersion: DEFAULT_OPTIONS.databaseVersion
                        });
                        this.opts.onMessage('Extraction complete!');
                        fs.unlinkSync(target);
                        onEnd && onEnd();
                    }
                });
            })
            .pipe(fs.createWriteStream(target));
    }
}

module.exports = {
    DatabaseInstaller,
    DEFAULT_OPTIONS
};