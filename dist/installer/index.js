'use strict';

var iri = require('./iri-installer');
var nelson = require('./nelson-installer');
var database = require('./database-installer');

module.exports = {
    iri: iri,
    nelson: nelson,
    database: database
};