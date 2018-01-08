'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('nelson.cli'),
    Node = _require.Node;

var request = require('request');
var path = require('path');

var _require2 = require('./installer/nelson-installer'),
    version = _require2.DEFAULT_OPTIONS.latestVersion;

var DEFAULT_OPTIONS = {
    iriPort: 14265,
    dataPath: '',
    neighborsURL: 'https://raw.githubusercontent.com/SemkoDev/nelson.cli/master/ENTRYNODES',
    onError: function onError() {},
    onStarted: function onStarted() {},
    onStopped: function onStopped() {},
    onMessage: function onMessage(message) {}
};

var Nelson = function () {
    function Nelson(options) {
        _classCallCheck(this, Nelson);

        this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
        this.node = null;
        this.running = false;
        this.neighbors = [];
    }

    _createClass(Nelson, [{
        key: '_init',
        value: function _init() {
            var _this = this;

            var _opts = this.opts,
                onError = _opts.onError,
                onStarted = _opts.onStarted;


            this.node = new Node({
                name: 'Bolero',
                neighbors: this.neighbors,
                silent: true,
                IRIPort: this.opts.iriPort,
                IRIProtocol: 'prefertcp',
                dataPath: path.join(this.opts.dataPath, 'neighbors.db')
            });

            return this.node.start().then(function () {
                _this.running = true;
                _this.opts.onMessage('started');
                onStarted && onStarted();
            }).catch(onError);
        }
    }, {
        key: 'start',
        value: function start() {
            var _this2 = this;

            return new Promise(function (resolve, reject) {
                request(_this2.opts.neighborsURL, function (err, resp, body) {
                    if (err) {
                        reject(err);
                    }
                    _this2.neighbors = body.split('\n').map(function (str) {
                        if (!str || !str.length) {
                            return null;
                        }
                        if (_this2.validNeighbor(str)) {
                            return str;
                        } else {
                            return null;
                        }
                    }).filter(function (n) {
                        return n;
                    });
                    _this2._init().then(resolve);
                });
            });
        }
    }, {
        key: 'stop',
        value: function stop() {
            var _this3 = this;

            var onStopped = this.opts.onStopped;


            if (!this.node) {
                return Promise.resolve();
            }
            return this.node.end().then(function () {
                _this3.opts.onMessage('stopped');
                _this3.running = false;
                _this3.node = null;
                onStopped && onStopped();
            });
        }
    }, {
        key: 'isRunning',
        value: function isRunning() {
            return this.running;
        }
    }, {
        key: 'getNodeInfo',
        value: function getNodeInfo() {
            return getNodeStats(this.node);
        }
    }, {
        key: 'validNeighbor',
        value: function validNeighbor(str) {
            var tokens = str.split('/');
            return tokens.length >= 2 && tokens.length <= 5 && Number.isInteger(parseInt(tokens[1])) && (!tokens[2] || Number.isInteger(parseInt(tokens[2]))) && (!tokens[3] || Number.isInteger(parseInt(tokens[3]))) && (!tokens[4] || !!parseFloat(tokens[4]));
        }
    }]);

    return Nelson;
}();

function getNodeStats(node) {
    var _node$opts = node.opts,
        cycleInterval = _node$opts.cycleInterval,
        epochInterval = _node$opts.epochInterval,
        beatInterval = _node$opts.beatInterval,
        dataPath = _node$opts.dataPath,
        port = _node$opts.port,
        apiPort = _node$opts.apiPort,
        IRIPort = _node$opts.IRIPort,
        TCPPort = _node$opts.TCPPort,
        UDPPort = _node$opts.UDPPort,
        isMaster = _node$opts.isMaster,
        temporary = _node$opts.temporary;
    var _node$heart = node.heart,
        lastCycle = _node$heart.lastCycle,
        lastEpoch = _node$heart.lastEpoch,
        personality = _node$heart.personality,
        currentCycle = _node$heart.currentCycle,
        currentEpoch = _node$heart.currentEpoch,
        startDate = _node$heart.startDate;

    var totalPeers = node.list.all().length;
    var isIRIHealthy = node.iri && node.iri.isHealthy;
    var iriStats = node.iri && node.iri.iriStats;
    var connectedPeers = Array.from(node.sockets.keys()).filter(function (p) {
        return node.sockets.get(p).readyState === 1;
    }).map(function (p) {
        var _p$data = p.data,
            name = _p$data.name,
            hostname = _p$data.hostname,
            ip = _p$data.ip,
            port = _p$data.port,
            TCPPort = _p$data.TCPPort,
            UDPPort = _p$data.UDPPort,
            seen = _p$data.seen,
            connected = _p$data.connected,
            tried = _p$data.tried,
            weight = _p$data.weight,
            dateTried = _p$data.dateTried,
            dateLastConnected = _p$data.dateLastConnected,
            dateCreated = _p$data.dateCreated,
            isTrusted = _p$data.isTrusted,
            lastConnections = _p$data.lastConnections;

        return {
            name: name,
            hostname: hostname,
            ip: ip,
            port: port,
            TCPPort: TCPPort,
            UDPPort: UDPPort,
            seen: seen,
            connected: connected,
            tried: tried,
            weight: weight,
            dateTried: dateTried,
            dateLastConnected: dateLastConnected,
            dateCreated: dateCreated,
            isTrusted: isTrusted,
            lastConnections: lastConnections
        };
    });

    return {
        name: node.opts.name,
        version: version,
        ready: node._ready,
        isIRIHealthy: isIRIHealthy,
        iriStats: iriStats,
        peerStats: getSummary(node),
        totalPeers: totalPeers,
        connectedPeers: connectedPeers,
        config: {
            cycleInterval: cycleInterval,
            epochInterval: epochInterval,
            beatInterval: beatInterval,
            dataPath: dataPath,
            port: port,
            apiPort: apiPort,
            IRIPort: IRIPort,
            TCPPort: TCPPort,
            UDPPort: UDPPort,
            isMaster: isMaster,
            temporary: temporary
        },
        heart: {
            lastCycle: lastCycle,
            lastEpoch: lastEpoch,
            personality: personality,
            currentCycle: currentCycle,
            currentEpoch: currentEpoch,
            startDate: startDate
        }
    };
}

function getSummary(node) {
    var now = new Date();
    var hour = 3600000;
    var hourAgo = new Date(now - hour);
    var fourAgo = new Date(now - hour * 4);
    var twelveAgo = new Date(now - hour * 12);
    var dayAgo = new Date(now - hour * 24);
    var weekAgo = new Date(now - hour * 24 * 7);
    return {
        newNodes: {
            hourAgo: node.list.all().filter(function (p) {
                return p.data.dateCreated >= hourAgo;
            }).length,
            fourAgo: node.list.all().filter(function (p) {
                return p.data.dateCreated >= fourAgo;
            }).length,
            twelveAgo: node.list.all().filter(function (p) {
                return p.data.dateCreated >= twelveAgo;
            }).length,
            dayAgo: node.list.all().filter(function (p) {
                return p.data.dateCreated >= dayAgo;
            }).length,
            weekAgo: node.list.all().filter(function (p) {
                return p.data.dateCreated >= weekAgo;
            }).length
        },
        activeNodes: {
            hourAgo: node.list.all().filter(function (p) {
                return p.data.dateLastConnected >= hourAgo;
            }).length,
            fourAgo: node.list.all().filter(function (p) {
                return p.data.dateLastConnected >= fourAgo;
            }).length,
            twelveAgo: node.list.all().filter(function (p) {
                return p.data.dateLastConnected >= twelveAgo;
            }).length,
            dayAgo: node.list.all().filter(function (p) {
                return p.data.dateLastConnected >= dayAgo;
            }).length,
            weekAgo: node.list.all().filter(function (p) {
                return p.data.dateLastConnected >= weekAgo;
            }).length
        }
    };
}

module.exports = {
    Nelson: Nelson,
    DEFAULT_OPTIONS: DEFAULT_OPTIONS
};