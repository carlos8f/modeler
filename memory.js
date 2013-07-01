var core = require('./core');

// basic memory-based implementation
module.exports = function (_opts) {
  var api = core(_opts);
  var data = {}, keys = [];

  api._tail = function (limit, cb) {
    cb(null, keys.slice(0, limit));
  };
  api._save = function (saveEntity, cb) {
    if (!~keys.indexOf(saveEntity.id)) keys.unshift(saveEntity.id);
    data[':' + saveEntity.id] = saveEntity; // object is not a hash
    cb();
  };
  api._load = function (id, cb) {
    var entity = data[':' + id];
    if (typeof entity === 'undefined') entity = null;
    else entity = api.copy(entity);
    cb(null, entity);
  };
  api._destroy = function (id, cb) {
    delete data[':' + id];
    var idx = keys.indexOf(id);
    if (~idx) keys.splice(idx, 1);
    cb();
  };

  return api;
};
