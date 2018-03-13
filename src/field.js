const { Field: FieldBase, DEFAULT_OPTIONS: DEFAULT_FIELD_OPTIONS } = require('field.cli');

const DEFAULT_OPTIONS = {
  fieldHostname: 'field.carriota.com',
  name: 'Bolero Field',
  seed: '',
  address: '',
  iriPort: 14265,
  onError: () => {},
  onStarted: () => {},
  onStopped: () => {},
  onMessage: (message) => {}
};

class LoggedField extends FieldBase {
  log () {
    const { onMessage } = this.opts;
    onMessage(Array.from(arguments).map(a => (
      typeof a === 'object' ? JSON.stringify(a) : a.toString()
    )).join(' '))
  }
}

class Field {
  constructor (options) {
    this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
    const { name, seed, address, iriPort, fieldHostname, onMessage } = this.opts;
    this.field = null;
    this.running = false;
    Field.log = this.log;
    this.field = new LoggedField({
      name,
      seed,
      address,
      IRIPort: iriPort,
      fieldHostname,
      port: DEFAULT_FIELD_OPTIONS.port,
      pow: true,
      customFieldId: true,
      onMessage
    });
  }

  start () {
    const { onStarted } = this.opts;

    return this.field.start().then(() => {
      this.running = true;
      onStarted && onStarted();
    });
  }

  stop () {
    const { onStopped } = this.opts;

    if (!this.field) {
      return Promise.resolve().then(() => onStopped && onStopped());
    }
    return this.field.end().then(() => {
      this.field = null;
      this.running = false;
      onStopped && onStopped();
    });
  }

  isRunning () {
    return this.running
  }

  getFieldInfo () {
    const { id, publicId } = this.field;
    return { id, publicId };
  }




}

module.exports = {
  Field,
  DEFAULT_OPTIONS
};
