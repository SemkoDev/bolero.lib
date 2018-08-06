const path = require('path');
const expect = require('chai').expect;
const { IRIInstaller } = require('../installer').iri;
const { IRI } = require('../iri');
const { Nelson } = require('../nelson');

describe('Nelson', () => {
    const targetDir = path.join(__dirname, '..', '..', 'data');
    const iriInstaller = new IRIInstaller({ targetDir });

    before((done) => {
        iriInstaller.install(null, () => done(), (err) => {throw err});
    });

    it('Spawns IRI and Nelson correctly', (done) => {
        const iri = new IRI({
            iriPath: iriInstaller.getTargetFileName(),
            dbPath: targetDir,
            port: 14266,
        });
        const nelson = new Nelson({
            iriPort: 14266,
            dataPath: targetDir
        });
        iri.start();

        function getNodeInfo() {
            setTimeout(() => {
                iri.getNodeInfo().then((info) => {
                    expect(info).to.be.an('object');
                    expect(info.appName).to.equal('IRI');
                    nelson.start().then(() => {
                        const info = nelson.getNodeInfo();
                        expect(info).to.be.an('object');
                        expect(info.isIRIHealthy).to.be.true;
                        iri.stop('SIGKILL');
                        nelson.stop().then(done);
                    });
                }).catch(getNodeInfo);
            }, 1000)
        }

        getNodeInfo();
    })
});