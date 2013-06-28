var core = require('./core');

// basic memory-based implementation
module.exports = function (_opts) {
  var api = core(_opts);
  var data = {};

  function key (id) {
    return ':' + id;
  }

  api._list = function (options, cb) {
    var keys = Object.keys(data);
    if (options.reverse) keys.reverse();
    keys = keys.slice(options.start, options.stop);
    var entities = keys.map(function (k) {
      return data[k];
    });
    cb(null, entities);
  };
  api._save = function (saveEntity, cb) {
    data[key(saveEntity.id)] = saveEntity;
    cb();
  };
  api._load = function (id, cb) {
    var entity = data[key(id)];
    if (typeof entity === 'undefined') return cb(null, null);
    cb(null, entity);
  };
  api._destroy = function (id, cb) {
    delete data[key(id)];
    cb();
  };

  return api;
};
