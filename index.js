var core = require('./core');

// basic memory-based implementation
module.exports = function (_opts) {
  var api = core(_opts);
  var data = {}, keys = [];

  function key (id) {
    return ':' + id;
  }

  api._list = function (options, cb) {
    var _keys = keys.slice();
    if (options.reverse) _keys.reverse();
    _keys = _keys.slice(options.start, options.stop);
    cb(null, _keys.map(function (k) {
      return k.replace(/^:/, '');
    }));
  };
  api._save = function (saveEntity, cb) {
    data[key(saveEntity.id)] = saveEntity;
    keys = Object.keys(data);
    keys.sort(function (a, b) {
      if (data[a].created < data[b].created) return -1;
      if (data[a].created > data[b].created) return 1;
      return 0;
    });
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

module.exports.core = core;
