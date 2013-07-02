var idgen = require('idgen');

module.exports = function (_opts) {
  var api = {
    list: function (options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = null;
      }
      options || (options = {});
      api.tail(0, {load: options.load}, function (err, list) {
        if (err) return cb(err);
        if (!options.reverse) list.reverse();
        list = list.slice(options.start, options.stop);
        cb(null, list);
      });
    },
    tail: function (limit, options, cb) {
      if (typeof limit === 'function') {
        cb = limit;
        limit = undefined;
        options = {};
      }
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
      limit || (limit = undefined);
      options || (options = {});

      api._tail(limit, function (err, list) {
        // some backends may return full entities here. filter to what we need
        if (options.load && typeof list[0] !== 'object') {
          api.load(list, cb);
          return;
        }
        else if (!options.load && typeof list[0] === 'object') {
          list = list.map(function (entity) {
            return entity.id;
          });
        }
        cb(null, list);
      });
    },
    create: function (attrs, cb) {
      if (typeof attrs === 'function') {
        cb = attrs;
        attrs = {};
      }
      attrs || (attrs = {});
      var entity = api.copy(attrs);
      if (typeof entity.id === 'undefined') entity.id = idgen(16);
      if (typeof entity.created === 'undefined') entity.created = new Date();
      if (typeof entity.rev === 'undefined') entity.rev = 0;
      if (api.options.create) api.options.create.call(api, entity);
      if (cb) process.nextTick(function () {
        api.save(entity, cb);
      });
      return entity;
    },
    save: function (entity, cb) {
      if (!cb) cb = defaultCb;
      api.load(entity.id, {raw: true}, function (err, existing) {
        if (err) return cb(err);
        if (existing && existing.rev > entity.rev) {
          err = new Error('cannot save over a newer revision');
          err.code = 'REV_CONFLICT';
          return cb(err);
        }
        else if (existing) {
          Object.keys(existing).forEach(function (k) {
            if (typeof entity[k] === 'undefined') {
              entity[k] = existing[k];
            }
          });
        }
        entity.rev++;
        entity.updated = new Date();

        if (api.options.save) api.options.save.call(api, entity, doSave);
        else doSave();

        function doSave (err, saveEntity) {
          if (!saveEntity) saveEntity = entity;
          if (err) return cb(err);

          api._save(saveEntity, function (err, savedEntity) {
            if (err) {
              entity.rev--;
              return cb(err);
            }

            if (savedEntity) {
              // sync up in-memory entity with saved one, e.g. auto-incremented ids
              Object.keys(savedEntity).forEach(function (k) {
                entity[k] = savedEntity[k];
              });
            }

            // clean up save-only properties
            Object.keys(entity).forEach(function (k) {
              if (k.indexOf('__') === 0) delete entity[k];
            });

            cb(null, entity);
          });
        }
      });
    },
    load: function (id, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
      options || (options = {});
      if (!cb) cb = defaultCb;
      if (Array.isArray(id)) {
        var ret = [];
        if (!id.length) return cb(null, ret);
        if (api._loadMulti) return api._loadMulti(id, cb);
        var latch = id.length, errored = false;
        id.forEach(function (id, idx) {
          api.load(id, function (err, entity) {
            if (err) return cb(err);
            ret[idx] = entity;
            if (!--latch) return cb(null, ret);
          });
        });
        return;
      }
      api._load(id, function (err, entity) {
        if (err) return cb(err);
        if (!entity) return cb(null, null);

        if (api.options.load) api.options.load.call(api, entity, doCallback);
        else doCallback();

        function doCallback (err, loadEntity) {
          if (!loadEntity) loadEntity = entity;
          if (err) return cb(err);

          if (!options.raw) {
            // clean up save-only properties
            Object.keys(loadEntity).forEach(function (k) {
              if (k.indexOf('__') === 0) delete loadEntity[k];
            });
          }

          cb(null, loadEntity);
        }
      });
    },
    destroy: function (id, cb) {
      if (!cb) cb = defaultCb;
      if (id.id) id = id.id;
      if (api.options.destroy) {
        api.load(id, function (err, entity) {
          if (err) return cb(err);
          if (!entity) return cb();
          api.options.destroy.call(api, entity, doDestroy);
        });
      }
      else doDestroy();

      function doDestroy (err) {
        if (err) return cb(err);
        api._destroy(id, cb);
      }
    },
    copy: function (obj) {
      var c = {};
      Object.keys(obj).forEach(function (prop) {
        c[prop] = obj[prop];
      });
      return c;
    }
  };

  _opts || (_opts = {});
  api.options = api.copy(_opts);
  api.options.name || (api.options.name = 'modeler');
  api.options.defaultCb || (api.options.defaultCb = function defaultCb (err) {
    if (err) throw err;
  });

  return api;
};
