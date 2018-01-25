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
    it('Checks Java string correctly', () => {
        const system = new System();
        const string1 = system._parseJavaVersion(`java version "1.8.0_151"
Java(TM) SE Runtime Environment (build 1.8.0_151-b12)
Java HotSpot(TM) 64-Bit Server VM (build 25.151-b12, mixed mode)`);
        expect(string1).to.equal('1.8.0_151');
        expect(system._checkJavaVersion(string1)).to.be.true;
        const string2 = system._parseJavaVersion(`openjdk version "1.8.0_01-internal"
OpenJDK Runtime Environment (build 1.8.0_01-internal-b04)
OpenJDK 64-Bit Server VM (build 25.40-b08, mixed mode)`);
        expect(string2).to.equal('1.8.0_01-internal');
        expect(system._checkJavaVersion(string2)).to.be.false;
        const string3 = system._parseJavaVersion(`openjdk version "1.8.0_151-internal"
OpenJDK Runtime Environment (build 1.8.0_151-internal-b04)
OpenJDK 64-Bit Server VM (build 25.40-b08, mixed mode)`);
        expect(string3).to.equal('1.8.0_151-internal');
        expect(system._checkJavaVersion(string3)).to.be.true;
    });
    it('Checks system ready', (done) => {
        const system = new System();
        system.isReady().then((okay) => {
            expect(okay).to.be.true;
            done();
        })
    });
});