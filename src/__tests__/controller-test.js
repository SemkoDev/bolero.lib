const path = require('path');
const expect = require('chai').expect;
const { Controller } = require('../controller');

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

describe.skip('Controller', () => {
    const targetDir = path.join(__dirname, '..', '..', 'data');
    it('starts and stops Controller', function(done) {
        this.timeout(3600000);
        const onStateChange = (state) => {
            console.log('UPDATE', state);
        };
        const controller = new Controller({ targetDir, onStateChange });
        controller.start().then(() => {
            setTimeout(() => {
                controller.stop();
                done();
            }, 40000);
        })
    });
});
