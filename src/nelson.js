const { Node } = require('nelson.cli');
const request = require('request');
const path = require('path');
const { DEFAULT_OPTIONS: { latestVersion: version } } = require('./installer/nelson-installer');

const DEFAULT_OPTIONS = {
    iriPort: 14265,
    dataPath: '',
    neighborsURL: 'https://raw.githubusercontent.com/SemkoDev/nelson.cli/master/ENTRYNODES',
    onError: () => {},
    onStarted: () => {},
    onStopped: () => {},
    onMessage: (message) => {}
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
            IRIProtocol: 'prefertcp',
            dataPath: path.join(this.opts.dataPath, 'neighbors.db')
        });

        return this.node.start().then(() => {
            this.running = true;
            this.opts.onMessage('started');
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
            this.opts.onMessage('stopped');
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

function getNodeStats (node) {
    const {
        cycleInterval,
        epochInterval,
        beatInterval,
        dataPath,
        port,
        apiPort,
        IRIPort,
        TCPPort,
        UDPPort,
        isMaster,
        temporary
    } = node.opts;
    const {
        lastCycle,
        lastEpoch,
        personality,
        currentCycle,
        currentEpoch,
        startDate
    } = node.heart;
    const totalPeers = node.list.all().length;
    const isIRIHealthy = node.iri && node.iri.isHealthy;
    const iriStats = node.iri && node.iri.iriStats;
    const connectedPeers = Array.from(node.sockets.keys())
        .filter((p) => node.sockets.get(p).readyState === 1)
        .map((p) => {
            const {
                name,
                hostname,
                ip,
                port,
                TCPPort,
                UDPPort,
                seen,
                connected,
                tried,
                weight,
                dateTried,
                dateLastConnected,
                dateCreated,
                isTrusted,
                lastConnections
            } = p.data;
            return {
                name,
                hostname,
                ip,
                port,
                TCPPort,
                UDPPort,
                seen,
                connected,
                tried,
                weight,
                dateTried,
                dateLastConnected,
                dateCreated,
                isTrusted,
                lastConnections
            }
        });

    return {
        name: node.opts.name,
        version,
        ready: node._ready,
        isIRIHealthy,
        iriStats,
        peerStats: getSummary(node),
        totalPeers,
        connectedPeers,
        config: {
            cycleInterval,
            epochInterval,
            beatInterval,
            dataPath,
            port,
            apiPort,
            IRIPort,
            TCPPort,
            UDPPort,
            isMaster,
            temporary
        },
        heart: {
            lastCycle,
            lastEpoch,
            personality,
            currentCycle,
            currentEpoch,
            startDate
        }
    }
}

function getSummary (node) {
    const now = new Date();
    const hour = 3600000;
    const hourAgo = new Date(now - hour);
    const fourAgo = new Date(now - (hour * 4));
    const twelveAgo = new Date(now - (hour * 12));
    const dayAgo = new Date(now - (hour * 24));
    const weekAgo = new Date(now - (hour * 24 * 7));
    return {
        newNodes: {
            hourAgo: node.list.all().filter(p => p.data.dateCreated >= hourAgo).length,
            fourAgo: node.list.all().filter(p => p.data.dateCreated >= fourAgo).length,
            twelveAgo: node.list.all().filter(p => p.data.dateCreated >= twelveAgo).length,
            dayAgo: node.list.all().filter(p => p.data.dateCreated >= dayAgo).length,
            weekAgo: node.list.all().filter(p => p.data.dateCreated >= weekAgo).length,
        },
        activeNodes: {
            hourAgo: node.list.all().filter(p => p.data.dateLastConnected >= hourAgo).length,
            fourAgo: node.list.all().filter(p => p.data.dateLastConnected >= fourAgo).length,
            twelveAgo: node.list.all().filter(p => p.data.dateLastConnected >= twelveAgo).length,
            dayAgo: node.list.all().filter(p => p.data.dateLastConnected >= dayAgo).length,
            weekAgo: node.list.all().filter(p => p.data.dateLastConnected >= weekAgo).length,
        }
    }
}

module.exports = {
    Nelson,
    DEFAULT_OPTIONS
};
