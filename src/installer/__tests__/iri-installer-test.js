const fs = require('fs');
const { IRIInstaller } = require('../iri-installer');

describe('IRIInstaller', () => {
    it('Selects latest version correctly', (done) => {
        const installer = new IRIInstaller();
        installer.selectVersion().then((version) => {
            expect(version).toBeTruthy;
            done();
        });
    });
    it('Installs latest version correctly', (done) => {
        const installer = new IRIInstaller();
        installer.install(null, () => {
            expect(fs.existsSync(installer.getTargetFileName())).toBeTruthy;
            done();
        });
    }, 30000);
    it('Uninstalls latest version correctly', (done) => {
        const installer = new IRIInstaller();
        installer.install(null, () => {
            installer.uninstall();
            expect(fs.existsSync(installer.getTargetFileName())).toBeFalsy;
            done();
        });
    }, 30000);
    it('Reinstalls latest version correctly', (done) => {
        const installer = new IRIInstaller();
        installer.install(null, () => {
            installer.reinstall(() => {
                expect(fs.existsSync(installer.getTargetFileName())).toBeTruthy;
                done();
            });
        });
    }, 60000);
});
