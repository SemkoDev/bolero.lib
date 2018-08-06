const fs = require('fs');
const expect = require('chai').expect;
const { DatabaseInstaller } = require('../database-installer');

describe('DatabaseInstaller', () => {
    const source = 'https://github.com/phayes/geoPHP/archive/1.2.tar.gz';

    it('Installs latest version correctly', (done) => {
        const installer = new DatabaseInstaller({ source });
        installer.install(null, () => {
            expect(installer.isInstalled()).to.be.true;
            done();
        });
    });
    it('Uninstalls latest version correctly', (done) => {
        const installer = new DatabaseInstaller({ source });
        installer.install(null, () => {
            installer.uninstall();
            expect(installer.isInstalled()).to.be.false;
            done();
        });
    });
    it('Reinstalls latest version correctly', (done) => {
        const installer = new DatabaseInstaller({ source });
        installer.install(null, () => {
            installer.reinstall(null, () => {
                expect(installer.isInstalled()).to.be.true;
                done();
            });
        });
    });
});
