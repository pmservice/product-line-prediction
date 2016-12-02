const nconf = require('nconf');
const path = require('path');

nconf.argv()
  .env()
  .file('model', path.join(__dirname, 'model.json'));

module.exports = nconf.get.bind(nconf);
