const tmp = require('tmp');
const path = require('path');
const expect = require('chai').expect;
const { IRIInstaller } = require('../installer').iri;
const { IRI } = require('../iri');

tmp.setGracefulCleanup();

describe('IRI', () => {
    const targetDir = path.join(__dirname, '..', '..', 'data');
    const iriInstaller = new IRIInstaller({ targetDir });

    before((done) => {
        iriInstaller.install(null, () => done(), (err) => {
            throw err
        });
    });

    it('Spawns IRI correctly', (done) => {
        const iri = new IRI({
            iriPath: iriInstaller.getTargetFileName(),
            dbPath: targetDir
        });
        iri.start();

        function getNodeInfo() {
            setTimeout(() => {
                iri.getNodeInfo().then((info) => {
                    expect(info).to.be.an('object');
                    expect(info.appName).to.equal('IRI');
                    iri.stop('SIGKILL');
                    done();
                }).catch(getNodeInfo);
            }, 1000)
        }

        getNodeInfo();
    })
});