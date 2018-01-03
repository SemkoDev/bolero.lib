const IOTA = require('iota.lib.js');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp');
const { spawn } = require('child_process');

const DEFAULT_OPTIONS = {
    port: 14265,
    iriPath: '',
    dbPath: '',
    onError: () => {},
    onStarted: () => {},
    onStopped: () => {},
};

class IRI {
    constructor (options) {
        this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
        this.api = (new IOTA({ host: `http://localhost`, port: this.opts.port })).api;
        this.process = null;
        this.running = false;
    }

    start () {
        const { onError, onStarted } = this.opts;

        this.process = spawn('java', ['-jar', this.opts.iriPath, '-c', this._getConfig()]);
        this.process.stderr.on('data', (data) => {
            // TODO: pass error message?
        });
        this.process.on('close', (code) => {
            if (this.process) {
                this.running = false;
                onError && onError()
            }
        });

        this.running = true;
        onStarted && onStarted();
    }

    stop (signal = 'SIGTERM') {
        const { onStopped } = this.opts;

        if (!this.process) {
            return;
        }
        this.process.kill(signal);
        this.running = false;
        this.process = null;
        onStopped && onStopped()
    }

    isRunning () {
        return this.running
    }

    getNodeInfo () {
        return new Promise((resolve, reject) => {
            if (!this.isRunning()) {
                reject(new Error('iri service is not running!'));
            }
            this.api.getNodeInfo((err, info) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(info);
                }
            });
        })
    }

    _getConfig () {
        const filename = tmp.fileSync().name;
        fs.writeFileSync(filename, `[IRI]
DB_PATH = ${this.opts.dbPath}
DB_LOG_PATH = ${this.opts.dbPath}
PORT = ${this.opts.port}
IXI_DIR = ${path.join(this.opts.dbPath, 'ixi')}
HEADLESS = true
        `);
        return filename
    }
}

module.exports = {
    IRI,
    DEFAULT_OPTIONS
};
