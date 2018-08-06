const fs = require('fs');
const expect = require('chai').expect;
const { NelsonInstaller } = require('../nelson-installer');

xdescribe('NelsonInstaller', () => {
    it('Selects latest version correctly', (done) => {
        const installer = new NelsonInstaller();
        installer.selectVersion().then((version) => {
            expect(version).to.be.an('object');
            done();
        });
    }, 5000);
    it('Installs latest version correctly', (done) => {
        const installer = new NelsonInstaller();
        installer.install(null, () => {
            expect(fs.existsSync(installer.getTargetFileName())).to.be.true;
            done();
        });
    }, 60000);
    it('Uninstalls latest version correctly', (done) => {
        const installer = new NelsonInstaller();
        installer.install(null, () => {
            installer.uninstall();
            expect(fs.existsSync(installer.getTargetFileName())).to.be.false;
            done();
        });
    }, 60000);
    it('Reinstalls latest version correctly', (done) => {
        const installer = new NelsonInstaller();
        installer.install(null, () => {
            installer.reinstall(() => {
                expect(fs.existsSync(installer.getTargetFileName())).to.be.true;
                done();
            });
        });
    }, 60000);
});
