const path = require('path');
const expect = require('chai').expect;
const { IRIInstaller } = require('../installer').iri;
const { IRI } = require('../iri');
const { Field } = require('../field');

describe('Field', () => {
  const targetDir = path.join(__dirname, '..', '..', 'data');
  const iriInstaller = new IRIInstaller({ targetDir });

  before((done) => {
    iriInstaller.install(null, () => done(), (err) => {throw err});
  });

  it('Spawns IRI and Field correctly', (done) => {
    const iri = new IRI({
      iriPath: iriInstaller.getTargetFileName(),
      dbPath: targetDir,
      port: 14200
    });
    const field = new Field({
      iriPort: 14200,
      onStopped: done,
      fieldHostname: 'localhost'
    });
    iri.start();

    function getNodeInfo() {
      setTimeout(() => {
        iri.getNodeInfo().then((info) => {
          expect(info).to.be.an('object');
          expect(info.appName).to.equal('IRI');
          field.start().then(() => {
            field.field.getNeighbors().then((neighbors) => {
              console.log('neighbors', neighbors);
              expect(neighbors).to.be.an('array');
              iri.stop('SIGKILL');
              field.stop();
            });
          });
        }).catch(getNodeInfo);
      }, 1000)
    }

    getNodeInfo();
  })
}, 120000);