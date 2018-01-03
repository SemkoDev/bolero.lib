const fs = require('fs');
const { Config, DEFAULT_CONFIG } = require('../config');

describe('Config', () => {
   it('loads default config correctly', () => {
       const config = new Config();
       expect(config.getConfig()).toEqual(DEFAULT_CONFIG);
       expect(JSON.parse(fs.readFileSync(config.configPath))).toEqual(DEFAULT_CONFIG);
   })
});