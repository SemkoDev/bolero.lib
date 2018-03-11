'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var path = require('path');
var fs = require('fs');
var installer = require('./installer');
var iri = require('./iri');
var nelson = require('./nelson');
var field = require('./field');
var system = require('./system');
var settings = require('./settings');

var DEFAULT_OPTIONS = {
    targetDir: null,
    maxMessages: 1000,
    onStateChange: function onStateChange(state) {},
    onMessage: function onMessage(messages) {}
};

var Controller = function () {
    function Controller(options) {
        var _this = this;

        _classCallCheck(this, Controller);

        this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
        this.state = {};
        this.messages = {
            iri: [],
            system: [],
            database: [],
            nelson: [],
            field: []
        };
        var targetDir = this.opts.targetDir || path.join(process.cwd(), 'data');
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir);
        }
        this.targetDir = targetDir;
        this.settings = new settings.Settings({
            basePath: this.targetDir
        });
        this.iriInstaller = new installer.iri.IRIInstaller({ targetDir: targetDir });
        this.databaseInstaller = new installer.database.DatabaseInstaller({
            settings: this.settings,
            targetDir: targetDir,
            onMessage: function onMessage(message) {
                return _this.message('database', message);
            }
        });
        this.reloadSystems();
        this.system = new system.System({
            onMessage: function onMessage(message) {
                return _this.message('system', message);
            }
        });
        this.state = {
            system: {
                status: 'waiting',
                hasEnoughSpace: false,
                hasEnoughMemory: false,
                hasJavaInstalled: false,
                isSupportedPlatform: false
            },
            iri: {
                status: 'waiting'
            },
            nelson: {
                status: 'waiting'
            },
            field: {
                status: 'waiting'
            },
            database: {
                status: 'waiting'
            }
        };
        this.updater = null;
        this.updateCounter = 0;
        this.updateState = this.updateState.bind(this);
    }

    _createClass(Controller, [{
        key: 'reloadSystems',
        value: function reloadSystems() {
            var _this2 = this;

            this.iri = new iri.IRI({
                port: this.settings.settings.iriPort,
                isPublic: this.settings.settings.iriPublic,
                iriPath: this.iriInstaller.getTargetFileName(),
                dbPath: this.databaseInstaller.targetDir,
                onError: function onError(err) {
                    _this2.message('iri', 'ERROR: ' + (err ? err.message : ''));
                    _this2.updateState('iri', { status: 'error', error: err ? err.message : '' });
                },
                onMessage: function onMessage(message) {
                    return _this2.message('iri', message);
                }
            });
            this.nelson = new nelson.Nelson({
                name: this.settings.settings.name,
                protocol: this.settings.settings.protocol,
                dataPath: this.targetDir,
                onError: function onError(err) {
                    _this2.message('nelson', 'ERROR: ' + (err ? err.message : ''));
                    _this2.updateState('nelson', { status: 'error', error: err ? err.message : '' });
                },
                onMessage: function onMessage(message) {
                    return _this2.message('nelson', message);
                }
            });
            this.field = new field.Field({
                name: this.settings.settings.name,
                seed: this.settings.settings.seed,
                address: this.settings.settings.address,
                iriPort: this.settings.settings.iriPort,
                onMessage: function onMessage(message) {
                    return _this2.message('field', message);
                }
            });
        }
    }, {
        key: 'tick',
        value: function tick() {
            var _this3 = this;

            var getNelsonInfo = function getNelsonInfo() {
                if (_this3.state.nelson.status === 'running') {
                    var info = _this3.nelson.getNodeInfo();
                    _this3.updateState('nelson', { info: info });
                    _this3.updateCounter += 1;
                } else if (_this3.state.nelson.status === 'error') {
                    _this3.message('nelson', 'Service seems down, trying to restart...');
                    setTimeout(function () {
                        return _this3.nelson.stop().then(function () {
                            return _this3.nelson.start();
                        });
                    }, 5000);
                }
            };
            if (this.state.iri.status === 'running') {
                this.iri.getNodeInfo().then(function (info) {
                    _this3.updateState('iri', { info: info });
                    getNelsonInfo();
                }).catch(function (err) {
                    _this3.message('iri', 'Failed getting IRI API update...');
                    _this3.updateState('iri', { status: 'error', error: err.message });
                    getNelsonInfo();
                });
            } else if (this.state.iri.status === 'error') {
                this.message('iri', 'IRI seems down, trying to restart in 5 seconds...');
                this.iri.stop();
                getNelsonInfo();
                setTimeout(function () {
                    return _this3.iri.start();
                }, 5000);
            }
        }
    }, {
        key: 'start',
        value: function start() {
            var _this4 = this;

            return new Promise(function (resolve, reject) {
                _this4.checkSystem().then(function (ready) {
                    if (ready) {
                        Promise.all([_this4.install('iri'), _this4.install('database')]).then(function () {
                            Promise.all([_this4.startIRI(), _this4.startNelson(), _this4.startField()]).then(function () {
                                _this4.updater = setInterval(function () {
                                    return _this4.tick();
                                }, 5000);
                                resolve();
                            }).catch(function (err) {
                                // Start failed
                                reject(err);
                            });
                        }).catch(function (err) {
                            // Installation failed
                            _this4.message('iri', 'Installation failed');
                            _this4.message('database', 'Installation failed');
                            reject(err);
                        });
                    }
                });
            });
        }
    }, {
        key: 'stop',
        value: function stop() {
            var _this5 = this;

            if (this.updater) {
                clearInterval(this.updater);
                this.updater = null;
            }
            this.iri.stop('SIGKILL');
            this.updateState('iri', { status: 'stopped' });
            return this.nelson.stop().then(function () {
                _this5.updateState('nelson', { status: 'stopped' });
                return _this5.field.stop().then(function () {
                    _this5.updateState('field', { status: 'stopped' });
                    return true;
                });
            });
        }
    }, {
        key: 'updateSettings',
        value: function updateSettings(config) {
            var _this6 = this;

            return this.stop().then(function () {
                _this6.settings.saveSettings(config);
                _this6.reloadSystems();
                return _this6.start();
            });
        }
    }, {
        key: 'startIRI',
        value: function startIRI() {
            var _this7 = this;

            this.updateState('iri', { status: 'starting' });
            return new Promise(function (resolve) {
                _this7.iri.start();

                var getNodeInfo = function getNodeInfo() {
                    setTimeout(function () {
                        _this7.iri.getNodeInfo().then(function (info) {
                            _this7.message('iri', 'started');
                            _this7.updateState('iri', { status: 'running', info: info });
                            resolve();
                        }).catch(getNodeInfo);
                    }, 1000);
                };
                getNodeInfo();
            });
        }
    }, {
        key: 'startNelson',
        value: function startNelson() {
            var _this8 = this;

            this.updateState('nelson', { status: 'starting' });
            return new Promise(function (resolve) {
                _this8.nelson.start().then(function () {
                    _this8.updateState('nelson', { status: 'running', info: _this8.nelson.getNodeInfo() });
                    resolve();
                });
            });
        }
    }, {
        key: 'startField',
        value: function startField() {
            var _this9 = this;

            this.updateState('field', { status: 'starting' });
            return new Promise(function (resolve) {
                _this9.field.start().then(function () {
                    _this9.updateState('field', { status: 'running', info: _this9.field.getFieldInfo() });
                    resolve();
                });
            });
        }
    }, {
        key: 'checkSystem',
        value: function checkSystem() {
            var _this10 = this;

            this.updateState('system', { status: 'checking' });
            return this.system.hasEnoughSpace(this.databaseInstaller.isInstalled()).then(function (hasEnoughSpace) {
                _this10.updateState('system', { hasEnoughSpace: hasEnoughSpace });
                return _this10.system.hasJavaInstalled();
            }).then(function (hasJavaInstalled) {
                _this10.updateState('system', { hasJavaInstalled: hasJavaInstalled });
            }).then(function () {
                var _state$system = _this10.state.system,
                    hasEnoughSpace = _state$system.hasEnoughSpace,
                    hasJavaInstalled = _state$system.hasJavaInstalled;

                var isSupportedPlatform = _this10.system.isSupportedPlatform();
                var hasEnoughMemory = _this10.system.hasEnoughMemory();
                var isReady = isSupportedPlatform && hasEnoughMemory && hasEnoughSpace && hasJavaInstalled;
                _this10.updateState('system', {
                    status: isReady ? 'ready' : 'error',
                    isSupportedPlatform: isSupportedPlatform,
                    hasEnoughMemory: hasEnoughMemory,
                    error: hasEnoughSpace ? hasJavaInstalled ? isSupportedPlatform ? hasEnoughMemory ? '' : 'not enough RAM (+3.6GB)' : 'operating system is not supported' : 'java v1.8.0_151 or higher is not installed' : 'not enough free space in home or temp directory (+8GB)'
                });
                return isReady;
            });
        }
    }, {
        key: 'install',
        value: function install(component) {
            var _this11 = this;

            var installer = null;
            switch (component) {
                case 'iri':
                    installer = this.iriInstaller;
                    break;
                case 'database':
                default:
                    installer = this.databaseInstaller;
            }
            this.updateState(component, { status: 'checking' });
            return new Promise(function (resolve, reject) {
                if (installer.isInstalled()) {
                    _this11.updateState(component, { status: 'ready' });
                    resolve();
                } else {
                    installer.install(function (progress) {
                        return _this11.updateState(component, { status: 'downloading', progress: progress });
                    }, function () {
                        _this11.updateState(component, { status: 'ready' });
                        resolve();
                    }, function (error) {
                        _this11.updateState(component, { status: 'error', error: error.message });
                        installer.uninstall();
                        reject(error);
                    });
                }
            });
        }
    }, {
        key: 'updateState',
        value: function updateState(component, state) {
            this.state[component] = Object.assign(this.state[component], state);
            this.opts.onStateChange(this.state);
        }
    }, {
        key: 'message',
        value: function message(component, _message) {
            this.messages[component].push(_message);
            this.messages[component] = this.messages[component].splice(-this.opts.maxMessages);
            this.opts.onMessage(component, _message, this.messages);
        }
    }, {
        key: 'getState',
        value: function getState() {
            return this.state;
        }
    }]);

    return Controller;
}();

module.exports = {
    Controller: Controller,
    DEFAULT_OPTIONS: DEFAULT_OPTIONS
};