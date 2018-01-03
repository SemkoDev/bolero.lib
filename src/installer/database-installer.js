const path = require('path');
const tmp = require('tmp');
const fs = require('fs');
const request = require('request');
const targz = require('targz');
const progress = require('request-progress');
const { BaseInstaller } = require('./base-installer');

const DEFAULT_OPTIONS = {
    name: 'db',
    source: 'http://db.iota.partners/IOTA.partners-mainnetdb.tar.gz',
};

class DatabaseInstaller extends BaseInstaller {
    constructor (options) {
        const opts = Object.assign({}, DEFAULT_OPTIONS, options);
        super(Object.assign({}, DEFAULT_OPTIONS, options, {
            targetDir: path.join(opts.targetDir || tmp.dirSync().name, opts.name)
        }));
    }

    getTargetFileName () {
        return this.opts.source.split('/').splice(-1)[0]
    }

    install (onProgress, onEnd, onError) {
        if (this.isInstalled()) {
            onEnd && onEnd();
            return;
        }
        const target = path.join(this.targetDir, this.getTargetFileName());

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
                onProgress && onProgress(state);
            })
            .on('error', (err) => {
                onError && onError(err)
            })
            .on('end', () => {
                targz.decompress({
                    src: target,
                    dest: this.targetDir
                }, function(err){
                    if(err) {
                        onError && onError(err);
                    } else {
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