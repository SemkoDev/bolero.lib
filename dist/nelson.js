'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _require = require('nelson.cli'),
    Node = _require.Node;

var _require2 = require('../node_modules/nelson.cli/dist/node/api'),
    getNodeStats = _require2.getNodeStats;

var request = require('request');
var path = require('path');

var DEFAULT_OPTIONS = {
    iriPort: 14265,
    dataPath: '',
    neighborsURL: 'https://raw.githubusercontent.com/SemkoDev/nelson.cli/master/ENTRYNODES',
    onError: function onError() {},
    onStarted: function onStarted() {},
    onStopped: function onStopped() {}
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
                dataPath: path.join(this.opts.dataPath, 'neighbors.db')
            });

            return this.node.start().then(function () {
                _this.running = true;
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

module.exports = {
    Nelson: Nelson,
    DEFAULT_OPTIONS: DEFAULT_OPTIONS
};