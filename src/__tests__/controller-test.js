const path = require('path');
const request = require('request');
const expect = require('chai').expect;
const { Controller } = require('../controller');

process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});

describe('Controller', () => {
    const targetDir = path.join(__dirname, '..', '..', 'data');

    it('starts and stops Controller', function(done) {
        this.timeout(3600000);
        const onStateChange = (state) => {
            //console.log('UPDATE', state);
        };
        const controller = new Controller({ targetDir, onStateChange });
        controller.start().then(() => {
            setTimeout(() => {
                controller.stop().then(() => done());
            }, 40000);
        })
    });

    it('reloads Controller settings', function(done) {
        this.timeout(3600000);
        const onStateChange = (state) => {
            //console.log('UPDATE', state);
        };
        const controller = new Controller({ targetDir, onStateChange });
        controller.start().then(() => {
            controller.updateSettings({ name: 'New' }).then(() => {
                request('http://localhost:18600', (err, req, body) => {
                    expect(err).to.not.exist;
                    expect(body).to.exist;
                    expect(JSON.parse(body).name).to.equal('New');
                    controller.stop().then(() => done());
                })
            });
        })
    });
});
