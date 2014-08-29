var crypto = require('crypto');

module.exports = {
  copy: function (obj) {
    var c = {};
    Object.keys(obj || {}).forEach(function (prop) {
      c[prop] = obj[prop];
    });
    return c;
  },
  newId: function () {
    return crypto.pseudoRandomBytes(16).toString('base64')
          .replace(/\+/g, '-')
          .replace(/\//g, '_')
          .replace(/=/g, '');
  }
};
