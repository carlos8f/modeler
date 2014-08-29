var modeler = require('./core')
  , utils = require('./utils')

// basic memory-based implementation
module.exports = function (api) {
  api || (api = {});
  var data = {}, keys = [];
  if (!api._tail) {
    api._tail = function (offset, limit, options, cb) {
      cb(null, keys.slice(offset, limit ? offset + limit : undefined).map(function (id) {
        var entity = data[':' + id];
        if (typeof entity === 'undefined') return null;
        else return utils.copy(entity);
      }));
    };
  }
  if (!api._save) {
    api._save = function (entity, options, cb) {
      if (!~keys.indexOf(entity.id)) keys.unshift(entity.id);
      data[':' + entity.id] = entity; // object is not a hash
      cb();
    };
  }
  if (!api._load) {
    api._load = function (id, options, cb) {
      var entity = data[':' + id];
      if (typeof entity === 'undefined') entity = null;
      else entity = utils.copy(entity);
      cb(null, entity);
    };
  }
  if (!api._destroy) {
    api._destroy = function (entity, options, cb) {
      delete data[':' + entity.id];
      var idx = keys.indexOf(entity.id);
      if (~idx) keys.splice(idx, 1);
      cb();
    };
  }
  return modeler(api);
};
