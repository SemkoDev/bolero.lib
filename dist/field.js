"use strict";

var _typeof =
  typeof Symbol === "function" && typeof Symbol.iterator === "symbol"
    ? function(obj) {
        return typeof obj;
      }
    : function(obj) {
        return obj &&
          typeof Symbol === "function" &&
          obj.constructor === Symbol &&
          obj !== Symbol.prototype
          ? "symbol"
          : typeof obj;
      };

var _createClass = (function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }
  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
})();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _possibleConstructorReturn(self, call) {
  if (!self) {
    throw new ReferenceError(
      "this hasn't been initialised - super() hasn't been called"
    );
  }
  return call && (typeof call === "object" || typeof call === "function")
    ? call
    : self;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError(
      "Super expression must either be null or a function, not " +
        typeof superClass
    );
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass)
    Object.setPrototypeOf
      ? Object.setPrototypeOf(subClass, superClass)
      : (subClass.__proto__ = superClass);
}

var _require = require("field.cli"),
  FieldBase = _require.Field,
  DEFAULT_FIELD_OPTIONS = _require.DEFAULT_OPTIONS;

var DEFAULT_OPTIONS = {
  fieldHostname: "field.deviota.com",
  name: "Bolero Field",
  seed: "",
  address: "",
  iriPort: 14265,
  onError: function onError() {},
  onStarted: function onStarted() {},
  onStopped: function onStopped() {},
  onMessage: function onMessage(message) {}
};

var LoggedField = (function(_FieldBase) {
  _inherits(LoggedField, _FieldBase);

  function LoggedField() {
    _classCallCheck(this, LoggedField);

    return _possibleConstructorReturn(
      this,
      (LoggedField.__proto__ || Object.getPrototypeOf(LoggedField)).apply(
        this,
        arguments
      )
    );
  }

  _createClass(LoggedField, [
    {
      key: "log",
      value: function log() {
        var onMessage = this.opts.onMessage;

        onMessage(
          Array.from(arguments)
            .map(function(a) {
              return (typeof a === "undefined" ? "undefined" : _typeof(a)) ===
                "object"
                ? JSON.stringify(a)
                : a.toString();
            })
            .join(" ")
        );
      }
    }
  ]);

  return LoggedField;
})(FieldBase);

var Field = (function() {
  function Field(options) {
    _classCallCheck(this, Field);

    this.opts = Object.assign({}, DEFAULT_OPTIONS, options);
    var _opts = this.opts,
      name = _opts.name,
      seed = _opts.seed,
      address = _opts.address,
      iriPort = _opts.iriPort,
      fieldHostname = _opts.fieldHostname,
      onMessage = _opts.onMessage;

    this.field = null;
    this.running = false;
    Field.log = this.log;
    this.field = new LoggedField({
      name: name,
      seed: seed,
      address: address,
      IRIPort: iriPort,
      fieldHostname: fieldHostname,
      port: DEFAULT_FIELD_OPTIONS.port,
      pow: true,
      customFieldId: true,
      onMessage: onMessage
    });
  }

  _createClass(Field, [
    {
      key: "start",
      value: function start() {
        var _this2 = this;

        var onStarted = this.opts.onStarted;

        return this.field.start().then(function() {
          _this2.running = true;
          onStarted && onStarted();
        });
      }
    },
    {
      key: "stop",
      value: function stop() {
        var _this3 = this;

        var onStopped = this.opts.onStopped;

        if (!this.field) {
          return Promise.resolve().then(function() {
            return onStopped && onStopped();
          });
        }
        return this.field.end().then(function() {
          _this3.field = null;
          _this3.running = false;
          onStopped && onStopped();
        });
      }
    },
    {
      key: "isRunning",
      value: function isRunning() {
        return this.running;
      }
    },
    {
      key: "getFieldInfo",
      value: function getFieldInfo() {
        var _field = this.field,
          id = _field.id,
          publicId = _field.publicId;

        return { id: id, publicId: publicId };
      }
    }
  ]);

  return Field;
})();

module.exports = {
  Field: Field,
  DEFAULT_OPTIONS: DEFAULT_OPTIONS
};
