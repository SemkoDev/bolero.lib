const path = require('path');
const fs = require('fs');
const installer = require('./installer');
const iri = require('./iri');
const nelson = require('./nelson');
const field = require('./field');
const system = require('./system');
const settings = require('./settings');

const DEFAULT_OPTIONS = {
    targetDir: null,
    maxMessages: 1000,
    onStateChange: (state) => {},
    onMessage: (messages) => {},
};

class Controller {
    constructor(options) {
        this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
        this.state = {};
        this.messages = {
            iri: [],
            system: [],
            database: [],
            nelson: [],
            field: []
        };
        const targetDir = this.opts.targetDir || path.join(process.cwd(), 'data');
        if (!fs.existsSync(targetDir)) {
            fs.mkdirSync(targetDir);
        }
        this.targetDir = targetDir;
        this.settings = new settings.Settings({
            basePath: this.targetDir
        });
        this.iriInstaller = new installer.iri.IRIInstaller({ targetDir });
        this.databaseInstaller = new installer.database.DatabaseInstaller({
            settings: this.settings,
            targetDir,
            onMessage: (message) => this.message('database', message)
        });
        this.reloadSystems();
        this.system = new system.System({
            onMessage: (message) => this.message('system', message)
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
            },
        };
        this.updater = null;
        this.updateCounter = 0;
        this.updateState = this.updateState.bind(this);
    }

    reloadSystems () {
        this.iri = new iri.IRI({
            port: this.settings.settings.iriPort,
            isPublic: this.settings.settings.iriPublic,
            iriPath: this.iriInstaller.getTargetFileName(),
            dbPath: this.databaseInstaller.targetDir,
            onError: (err) => {
                this.message('iri', `ERROR: ${err ? err.message : ''}`);
                this.updateState('iri', { status: 'error', error: err ? err.message : '' })
            },
            onMessage: (message) => this.message('iri', message)
        });
        this.nelson = new nelson.Nelson({
            name: this.settings.settings.name,
            protocol: this.settings.settings.protocol,
            dataPath: this.targetDir,
            onError: (err) => {
                this.message('nelson', `ERROR: ${err ? err.message : ''}`);
                this.updateState('nelson', { status: 'error', error: err ? err.message : '' })
            },
            onMessage: (message) => this.message('nelson', message)
        });
        this.field = new field.Field({
          name: this.settings.settings.name,
          seed: this.settings.settings.seed,
          address: this.settings.settings.address,
          iriPort: this.settings.settings.iriPort,
          onMessage: (message) => this.message('field', message)
        })
    }

    tick () {
        const getNelsonInfo = () => {
            if (this.state.nelson.status === 'running') {
                const info = this.nelson.getNodeInfo();
                this.updateState('nelson', { info });
                this.updateCounter += 1;
            } else if (this.state.nelson.status === 'error') {
                this.message('nelson', 'Service seems down, trying to restart...');
                setTimeout(() => this.nelson.stop().then(() => this.nelson.start()), 5000);
            }
        };
        if (this.state.iri.status === 'running') {
            this.iri.getNodeInfo().then((info) => {
                this.updateState('iri', { info });
                getNelsonInfo();
            }).catch((err) => {
                this.message('iri', 'Failed getting IRI API update...');
                this.updateState('iri', { status: 'error', error: err.message });
                getNelsonInfo();
            });
        } else if (this.state.iri.status === 'error') {
            this.message('iri', 'IRI seems down, trying to restart in 5 seconds...');
            this.iri.stop();
            getNelsonInfo();
            setTimeout(() => this.iri.start(), 5000);
        }
    }

    start () {
        return new Promise((resolve, reject) => {
            this.checkSystem().then((ready) => {
                if (ready) {
                    Promise.all([
                        this.install('iri'),
                        this.install('database'),
                    ]).then(() => {
                        Promise.all([
                            this.startIRI(),
                            this.startNelson(),
                            this.startField()
                        ]).then(() => {
                            this.updater = setInterval(() => this.tick(), 5000);
                            resolve();
                        }).catch((err) => {
                            // Start failed
                            reject(err);
                        })
                    }).catch((err) => {
                        // Installation failed
                        this.message('iri', 'Installation failed');
                        this.message('database', 'Installation failed');
                        reject(err);
                    })
                }
            })
        })
    }

    stop () {
        if (this.updater) {
            clearInterval(this.updater);
            this.updater = null;
        }
        this.iri.stop('SIGKILL');
        this.updateState('iri', { status: 'stopped' });
        return this.nelson.stop().then(() => {
            this.updateState('nelson', { status: 'stopped' });
            return this.field.stop().then(() => {
              this.updateState('field', { status: 'stopped' });
              return true;
            });
        })
    }

    updateSettings (config) {
        return this.stop().then(() => {
            this.settings.saveSettings(config);
            this.reloadSystems();
            return this.start();
        })
    }

    startIRI () {
        this.updateState('iri', { status: 'starting' });
        return new Promise((resolve) => {
            this.iri.start();

            const getNodeInfo = () => {
                setTimeout(() => {
                    this.iri.getNodeInfo().then((info) => {
                        this.message('iri', 'started');
                        this.updateState('iri', { status: 'running', info });
                        resolve();
                    }).catch(getNodeInfo);
                }, 1000)
            };
            getNodeInfo();
        });
    }

    startNelson () {
        this.updateState('nelson', { status: 'starting' });
        return new Promise((resolve) => {
            this.nelson.start().then(() => {
                this.updateState('nelson', { status: 'running', info: this.nelson.getNodeInfo() });
                resolve();
            });
        });
    }

    startField () {
        this.updateState('field', { status: 'starting' });
        return new Promise((resolve) => {
            this.field.start().then(() => {
                this.updateState('field', { status: 'running', info: this.field.getFieldInfo() });
                resolve();
            });
        });
    }

    checkSystem () {
        this.updateState('system', { status: 'checking' });
        return this.system.hasEnoughSpace(this.databaseInstaller.isInstalled()).then((hasEnoughSpace) => {
            this.updateState('system', { hasEnoughSpace });
            return this.system.hasJavaInstalled()
        }).then((hasJavaInstalled) => {
            this.updateState('system', { hasJavaInstalled });
        }).then(() => {
            const { hasEnoughSpace, hasJavaInstalled } = this.state.system;
            const isSupportedPlatform = this.system.isSupportedPlatform();
            const hasEnoughMemory = this.system.hasEnoughMemory();
            const isReady = isSupportedPlatform && hasEnoughMemory && hasEnoughSpace && hasJavaInstalled;
            this.updateState('system', {
                status: isReady ? 'ready' : 'error',
                isSupportedPlatform,
                hasEnoughMemory,
                error: hasEnoughSpace
                    ? hasJavaInstalled
                        ? isSupportedPlatform
                            ? hasEnoughMemory
                                ? ''
                                : 'not enough RAM (+3.6GB)'
                            : 'operating system is not supported'
                        : 'java v1.8.0_151 or higher is not installed'
                    : 'not enough free space in home or temp directory (+8GB)'
            });
            return isReady;
        })
    }

    install (component) {
        let installer = null;
        switch (component) {
            case 'iri':
                installer = this.iriInstaller;
                break;
            case 'database':
            default:
                installer = this.databaseInstaller;
        }
        this.updateState(component, { status: 'checking' });
        return new Promise((resolve, reject) => {
            if (installer.isInstalled()) {
                this.updateState(component, { status: 'ready' });
                resolve();
            } else {
                installer.install(
                    (progress) => this.updateState(component, { status: 'downloading', progress }),
                    () => {
                        this.updateState(component, { status: 'ready' });
                        resolve();
                    },
                    (error) => {
                        this.updateState(component, { status: 'error', error: error.message });
                        installer.uninstall();
                        reject(error);
                    }
                )
            }
        });
    }

    updateState (component, state) {
        this.state[component] = Object.assign(this.state[component], state);
        this.opts.onStateChange(this.state);
    }

    message (component, message) {
        this.messages[component].push(message);
        this.messages[component] = this.messages[component].splice(-this.opts.maxMessages);
        this.opts.onMessage(component, message, this.messages);
    }

    getState () {
        return this.state
    }
}

module.exports = {
    Controller,
    DEFAULT_OPTIONS
};
