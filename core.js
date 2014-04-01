var idgen = require('idgen');

module.exports = function (_opts) {
  var api = {
    _prepareList: function (list, load, cb) {
      // some backends may return full entities in the list. reduce to what we need
      if (list.length && load) {
        return api.load(list, cb);
      }
      else if (typeof list[0] === 'object') {
        list = list.map(function (entity) {
          return entity.id;
        });
      }
      cb(null, list);
    },
    list: function (options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
      options || (options = {});

      var args = [options.offset || 0, options.limit, function (err, list, next) {
        if (err) return cb(err);
        api._prepareList(list, options.load, function (err, list) {
          cb(err, list, next);
        });
      }];

      api[options.reverse ? '_tail' : '_head'].apply(api, args);
    },
    head: function (limit, _opts, cb) {
      if (typeof limit === 'function') {
        cb = limit;
        limit = undefined;
        _opts = {};
      }
      if (typeof _opts === 'function') {
        cb = _opts;
        if (typeof limit === 'object') {
          _opts = limit;
          limit = undefined;
        }
        else _opts = {};
      }
      _opts || (_opts = {});
      var options = api.copy(_opts);
      options.limit = limit;
      api.list(options, cb);
    },
    tail: function (limit, _opts, cb) {
      if (typeof limit === 'function') {
        cb = limit;
        limit = undefined;
        _opts = {};
      }
      if (typeof _opts === 'function') {
        cb = _opts;
        if (typeof limit === 'object') {
          _opts = limit;
          limit = undefined;
        }
        else _opts = {};
      }
      _opts || (_opts = {});
      var options = api.copy(_opts);
      options.limit = limit;
      options.reverse = true;
      api.list(options, cb);
    },
    slice: function (offset, limit, _opts, cb) {
      if (typeof limit === 'function') {
        cb = limit;
        limit = undefined;
        _opts = {};
      }
      if (typeof _opts === 'function') {
        cb = _opts;
        if (typeof limit === 'object') {
          _opts = limit;
          limit = undefined;
        }
        else _opts = {};
      }
      _opts || (_opts = {});
      var options = api.copy(_opts);
      options.offset = offset;
      options.limit = limit;
      api.list(options, cb);
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
      if (!cb) cb = api.options.defaultCb;
      api.load(entity.id, {raw: true}, function (err, existing) {
        if (err) return cb(err);
        if (existing && existing.rev > entity.rev) {
          err = new Error('cannot save over a newer revision');
          err.code = 'REV_CONFLICT';
          err.existing = existing;
          return cb(err);
        }
        else if (existing) {
          // expose the existing entity as .__old to track changes
          entity.__old = existing;
          // sync up save-only properties
          Object.keys(existing).forEach(function (k) {
            if (k.indexOf('__') === 0 && typeof entity[k] === 'undefined') {
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

          // don't save old entity.
          delete entity.__old;
          delete saveEntity.__old;

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

            if (api.options.afterSave) {
              api.options.afterSave.call(api, entity, function (err) {
                if (err) return cb(err);
                cb(null, entity);
              });
            }
            else cb(null, entity);
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
      if (!cb) cb = api.options.defaultCb;
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

      function prepare (entity) {
        if (api.options.load) api.options.load.call(api, entity, doCallback);
        else doCallback();

        function doCallback (err, loadEntity) {
          if (err) return cb(err);
          if (!loadEntity) loadEntity = entity;

          if (!options.raw) {
            // clean up save-only properties
            Object.keys(loadEntity).forEach(function (k) {
              if (k.indexOf('__') === 0) delete loadEntity[k];
            });
          }

          cb(null, loadEntity);
        }
      }

      if (typeof id === 'object') prepare(id);
      else {
        api._load(id, function (err, entity) {
          if (err) return cb(err);
          if (!entity) return cb(null, null);

          prepare(entity);
        });
      }
    },
    destroy: function (id, cb) {
      if (!cb) cb = api.options.defaultCb;
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
        api._destroy(id, function (err) {
          if (err) return cb(err);
          if (api.options.afterDestroy) {
            api.options.afterDestroy.call(api, entity, cb);
          }
          else cb(null);
        });
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
