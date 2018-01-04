const { Node } = require('nelson.cli');
const { getNodeStats } = require('../node_modules/nelson.cli/dist/node/api');
const request = require('request');
const path = require('path');

const DEFAULT_OPTIONS = {
    iriPort: 14265,
    dataPath: '',
    neighborsURL: 'https://raw.githubusercontent.com/SemkoDev/nelson.cli/master/ENTRYNODES',
    onError: () => {},
    onStarted: () => {},
    onStopped: () => {},
};

class Nelson {
    constructor (options) {
        this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
        this.node = null;
        this.running = false;
        this.neighbors = [];
    }

    _init () {
        const { onError, onStarted } = this.opts;

        this.node = new Node({
            name: 'Bolero',
            neighbors: this.neighbors,
            silent: true,
            IRIPort: this.opts.iriPort,
            dataPath: path.join(this.opts.dataPath, 'neighbors.db')
        });

        return this.node.start().then(() => {
            this.running = true;
            onStarted && onStarted();
        }).catch(onError);
    }

    start () {
        return new Promise((resolve, reject) => {
            request(this.opts.neighborsURL, (err, resp, body) => {
                if (err) {
                    reject(err);
                }
                this.neighbors = body.split('\n').map((str) => {
                    if (!str || !str.length) {
                        return null;
                    }
                    if (this.validNeighbor(str)) {
                        return str;
                    }
                    else {
                        return null;
                    }
                }).filter(n => n);
                this._init().then(resolve);
            });
        })
    }

    stop () {
        const { onStopped } = this.opts;

        if (!this.node) {
            return Promise.resolve();
        }
        return this.node.end().then(() => {
            this.running = false;
            this.node = null;
            onStopped && onStopped()
        });
    }

    isRunning () {
        return this.running
    }

    getNodeInfo () {
        return getNodeStats(this.node);
    }

    validNeighbor(str) {
        const tokens = str.split('/');
        return (
            (tokens.length >= 2 && tokens.length <= 5) &&
            (Number.isInteger(parseInt(tokens[1]))) &&
            (!tokens[2] || Number.isInteger(parseInt(tokens[2]))) &&
            (!tokens[3] || Number.isInteger(parseInt(tokens[3]))) &&
            (!tokens[4] || !!parseFloat(tokens[4]))
        );
    }
}

module.exports = {
    Nelson,
    DEFAULT_OPTIONS
};
