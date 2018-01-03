const fs = require('fs');
const expect = require("chai").expect;
const { Settings, DEFAULT_SETTINGS } = require('../settings');

describe('Settings', () => {
   it('loads default settings correctly', () => {
       const settings = new Settings();
       expect(settings.getSettings()).to.deep.equal(DEFAULT_SETTINGS);
       expect(JSON.parse(fs.readFileSync(settings.settingsPath))).to.deep.equal(DEFAULT_SETTINGS);
   });
   it('saves settings correctly', () => {
       const settings = new Settings();
       expect(settings.getSettings()).to.deep.equal(DEFAULT_SETTINGS);
       const updatedSettings = Object.assign({}, DEFAULT_SETTINGS, { version: 1, newSetting: true });
       settings.saveSettings(updatedSettings);
       expect(settings.getSettings()).to.deep.equal(updatedSettings);
       expect(JSON.parse(fs.readFileSync(settings.settingsPath))).to.deep.equal(updatedSettings);
   })
});