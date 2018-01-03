const fs = require('fs');
const { DatabaseInstaller } = require('../database-installer');

describe('DatabaseInstaller', () => {
    const source = 'http://www.vim.org/scripts/download_script.php?src_id=6273';

    it('Installs latest version correctly', (done) => {
        const installer = new DatabaseInstaller({ source });
        installer.install(null, () => {
            expect(fs.existsSync(installer.getTargetFileName())).toBeTruthy;
            done();
        });
    }, 30000);
    it('Uninstalls latest version correctly', (done) => {
        const installer = new DatabaseInstaller({ source });
        installer.install(null, () => {
            installer.uninstall();
            expect(fs.existsSync(installer.getTargetFileName())).toBeFalsy;
            done();
        });
    }, 30000);
    it('Reinstalls latest version correctly', (done) => {
        const installer = new DatabaseInstaller({ source });
        installer.install(null, () => {
            installer.reinstall(() => {
                expect(fs.existsSync(installer.getTargetFileName())).toBeTruthy;
                done();
            });
        });
    }, 60000);
});
