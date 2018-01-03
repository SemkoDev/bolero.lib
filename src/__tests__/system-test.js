const expect = require('chai').expect;
const { System } = require('../system');

describe('System', () => {
    it('Checks platform correctly', () => {
        expect((new System()).isSupportedPlatform()).to.be.true;
        expect((new System({ supportedPlatform: [ 'someother' ] })).isSupportedPlatform()).to.be.false;
    });
    it('Checks the memory correctly', () => {
        expect((new System()).hasEnoughMemory()).to.be.true;
        expect((new System({ minimalMemory: 400000 })).hasEnoughMemory()).to.be.false;
    });
    it('Checks the space correctly', (done) => {
        const system = new System();
        system.hasEnoughSpace().then((okay) => {
            expect(okay).to.be.true;
            done();
        })
    });
    it('Checks Java correctly', (done) => {
        const system = new System();
        system.hasJavaInstalled().then((okay) => {
            expect(okay).to.be.true;
            done();
        })
    });
    it('Checks system ready', (done) => {
        const system = new System();
        system.isReady().then((okay) => {
            expect(okay).to.be.true;
            done();
        })
    });
});