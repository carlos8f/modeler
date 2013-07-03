var core = require('./core');

// basic memory-based implementation
module.exports = function (_opts) {
  var api = core(_opts);
  var data = {}, keys = [];

  function continuable (offset, limit, reverse, cb) {
    (function next () {
      var list = keys.slice();
      if (reverse) list.reverse();
      if (offset && limit) limit = offset + limit;
      list = list.slice(offset, limit);
      offset += list.length;
      cb(null, list, next);
    })();
  }

  api._head = function (limit, cb) {
    continuable(0, limit, true, cb);
  };
  api._tail = function (limit, cb) {
    continuable(0, limit, false, cb);
  };
  api._slice = function (offset, limit, cb) {
    continuable(offset, limit, true, cb);
  };
  api._save = function (saveEntity, cb) {
    // optimize for tailing
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
