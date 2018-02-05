'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('nelson.cli'),
    Node = _require.Node;

var _require2 = require('nelson.cli/dist/api/index'),
    createAPI = _require2.createAPI;

var _require3 = require('nelson.cli/dist/api/node'),
    getNodeStats = _require3.getNodeStats;

var request = require('request');
var path = require('path');

var _require4 = require('./installer/nelson-installer'),
    version = _require4.DEFAULT_OPTIONS.latestVersion;

var DEFAULT_IRI_OPTIONS = require('./iri').DEFAULT_OPTIONS;

var DEFAULT_OPTIONS = {
    name: 'Bolero',
    protocol: 'prefertcp',
    iriPort: DEFAULT_IRI_OPTIONS.port,
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
                name: this.opts.name,
                neighbors: this.neighbors,
                silent: true,
                IRIPort: this.opts.iriPort,
                IRIProtocol: this.opts.protocol,
                dataPath: path.join(this.opts.dataPath, 'neighbors.db')
            });

            return this.node.start().then(function () {
                _this.running = true;
                _this.opts.onMessage('started');
                _this.api = createAPI({
                    node: _this.node
                });
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
                if (_this3.api) {
                    _this3.api.close();
                    _this3.api = null;
                }
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

module.exports = {
    Nelson: Nelson,
    DEFAULT_OPTIONS: DEFAULT_OPTIONS
};