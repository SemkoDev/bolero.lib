const path = require('path');
const installer = require('./installer');
const iri = require('./iri');
const nelson = require('./nelson');
const system = require('./system');
const settings = require('./settings');

const DEFAULT_OPTIONS = {
    targetDir: null,
    onStateChange: (state) => {}
};

class Controller {
    constructor(options) {
        this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
        this.state = {};
        const targetDir = this.opts.targetDir || path.join(process.cwd(), 'data');
        this.targetDir = targetDir;
        this.iriInstaller = new installer.iri.IRIInstaller({ targetDir });
        this.nelsonInstaller = new installer.nelson.NelsonInstaller({ targetDir });
        this.databaseInstaller = new installer.database.DatabaseInstaller({ targetDir });
        this.iri = new iri.IRI({
            iriPath: this.iriInstaller.getTargetFileName(),
            dbPath: this.databaseInstaller.targetDir,
            onError: (err) => {
                this.updateState('iri', { status: 'error', error: err ? err.message : '' })
            }
        });
        this.nelson = new nelson.Nelson({
            dataPath: this.databaseInstaller.targetDir,
            onError: (err) => {
                this.updateState('nelson', { status: 'error', error: err ? err.message : '' })
            }
        });
        this.system = new system.System();
        this.settings = new settings.Settings();
        this.state = {
            system: {
                status: 'pristine',
                hasEnoughSpace: false,
                hasEnoughMemory: false,
                hasJavaInstalled: false,
                isSupportedPlatform: false
            },
            iri: {
                status: 'pristine'
            },
            nelson: {
                status: 'pristine'
            },
            database: {
                status: 'pristine'
            },
        };
        this.updater = null;
        this.updateCounter = 0;
        this.updateState = this.updateState.bind(this);
    }

    tick () {
        const getNelsonInfo = () => {
            if (this.state.nelson.status === 'running') {
                const info = this.nelson.getNodeInfo();
                this.updateState('nelson', { info });
                this.updateCounter += 1;
                if (!this.updateCounter % 6) {
                    // TODO: add webhook here
                }
            } else if (this.state.nelson.status === 'error') {
                setTimeout(() => this.nelson.stop().then(() => this.nelson.start()), 5000);
            }
        };
        if (this.state.iri.status === 'running') {
            this.iri.getNodeInfo().then((info) => {
                this.updateState('iri', { info })
            }).catch((err) => {
                this.updateState('iri', { status: 'error', error: err.message });
                getNelsonInfo();
            });
        } else if (this.state.iri.status === 'error') {
            this.iri.stop();
            setTimeout(() => this.iri.start(), 5000);
        }
    }

    start () {
        return new Promise((resolve, reject) => {
            this.checkSystem().then((ready) => {
                if (ready) {
                    Promise.all([
                        this.install('iri'),
                        this.install('nelson'),
                        this.install('database'),
                    ]).then(() => {
                        Promise.all([
                            this.startIRI(),
                            this.startNelson()
                        ]).then(() => {
                            this.updater = setInterval(() => this.tick(), 5000);
                            resolve();
                        }).catch((err) => {
                            // Start failed
                            reject(err);
                        })
                    }).catch((err) => {
                        // Installation failed
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
        return this.nelson.stop().then(() => {
            if (this.state.iri.status === 'downloading') {
                this.iriInstaller.uninstall();
            }
            if (this.state.nelson.status === 'downloading') {
                this.nelsonInstaller.uninstall();
            }
            if (this.state.database.status === 'downloading') {
                this.databaseInstaller.uninstall();
            }
            this.iri.stop();
            this.updateState('nelson', { status: 'stopped' });
            this.updateState('iri', { status: 'stopped' });

            return true;
        })
    }

    startIRI () {
        this.updateState('iri', { status: 'starting' });
        return new Promise((resolve) => {
            this.iri.start();

            const getNodeInfo = () => {
                setTimeout(() => {
                    this.iri.getNodeInfo().then((info) => {
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

    checkSystem () {
        this.updateState('system', { status: 'checking' });
        return this.system.hasEnoughSpace().then((hasEnoughSpace) => {
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
                hasEnoughMemory
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
            case 'nelson':
                installer = this.nelsonInstaller;
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

    getState () {
        return this.state
    }
}

module.exports = {
    Controller,
    DEFAULT_OPTIONS
};