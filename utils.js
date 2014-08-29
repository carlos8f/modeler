module.exports = {
  copy: function (obj) {
    var c = {};
    Object.keys(obj).forEach(function (prop) {
      c[prop] = obj[prop];
    });
    return c;
  }
};
