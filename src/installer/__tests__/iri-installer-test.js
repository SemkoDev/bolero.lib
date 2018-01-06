const fs = require('fs');
const expect = require('chai').expect;
const { IRIInstaller } = require('../iri-installer');

describe('IRIInstaller', () => {
    it('Selects latest version correctly', (done) => {
        const installer = new IRIInstaller();
        installer.selectVersion().then((version) => {
            // TODO: uncomment when IRI bug #350 is fixed and published: https://github.com/iotaledger/iri/issues/350
            //expect(version).to.be.an('object');
            done();
        });
    });
    it('Installs latest version correctly', (done) => {
        const installer = new IRIInstaller();
        installer.install(null, () => {
            expect(fs.existsSync(installer.getTargetFileName())).to.be.true;
            done();
        });
    });
    it('Uninstalls latest version correctly', (done) => {
        const installer = new IRIInstaller();
        installer.install(null, () => {
            installer.uninstall();
            expect(fs.existsSync(installer.getTargetFileName())).to.be.false;
            done();
        });
    });
    it('Reinstalls latest version correctly', (done) => {
        const installer = new IRIInstaller();
        installer.install(null, () => {
            installer.reinstall(null, () => {
                expect(fs.existsSync(installer.getTargetFileName())).to.be.true;
                done();
            });
        });
    });
});
