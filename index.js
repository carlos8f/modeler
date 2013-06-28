var idgen = require('idgen')
  , redis = require('redis').createClient()
  , hydration = require('hydration')

module.exports = function (_opts) {
  var api = {
    list: function (_opts, cb) {
      if (typeof _opts === 'function') {
        cb = _opts;
        _opts = {};
      }
      _opts || (_opts = {});
      var listOptions = api.copy(_opts);
      listOptions.start || (listOptions.start = 0);
      listOptions.stop || (listOptions.stop = -1);
      var method = listOptions.reverse ? 'ZREVRANGE' : 'ZRANGE';
      redis[method](listOptions.prefix + ':', listOptions.start, listOptions.stop, cb);
    },
    create: function (attrs, cb) {
      if (typeof attrs === 'function') {
        cb = attrs;
        attrs = {};
      }
      attrs || (attrs = {});
      var entity = api.copy(attrs);
      if (typeof entity.id === 'undefined') entity.id = idgen();
      if (typeof entity.created === 'undefined') entity.created = new Date();
      if (typeof entity.rev === 'undefined') entity.rev = 0;
      if (options.create) options.create.call(api, entity);
      if (cb) api.save(entity, cb);
      return entity;
    },
    save: function (entity, cb) {
      if (!cb) cb = defaultCb;
      api.load(entity.id, function (err, existing) {
        if (err) return cb(err);
        if (existing && existing.rev > entity.rev) {
          err = new Error('cannot save over a newer revision');
          err.code = 'REV_CONFLICT';
          return cb(err);
        }
        entity.rev++;

        if (options.save) options.save.call(api, entity, doSave);
        else doSave();

        function doSave (err, saveEntity) {
          if (!saveEntity) saveEntity = entity;
          if (err) return cb(err);
          try {
            var data = hydration.dehydrate(saveEntity);
            data = JSON.stringify(data);
          }
          catch (e) {
            return cb(e);
          }
          redis.MULTI()
            .SET(options.prefix + ':' + entity.id, data)
            .ZADD(options.prefix + ':', options.scoreFn(entity), entity.id)
            .EXEC(function (err) {
              if (err) return cb(err);
              cb(null, entity);
            });
        }
      });
    },
    load: function (id, cb) {
      if (!cb) cb = defaultCb;
      redis.GET(options.prefix + ':' + id, function (err, data) {
        if (err) return cb(err);
        if (!data) return cb(null, null);
        try {
          var entity = JSON.parse(data);
          entity = hydration.hydrate(entity);
        }
        catch (e) {
          return cb(e);
        }
        if (options.load) options.load.call(api, entity, doCallback);
        else doCallback();

        function doCallback (err, loadEntity) {
          if (!loadEntity) loadEntity = entity;
          if (err) return cb(err);
          cb(null, loadEntity);
        }
      });
    },
    destroy: function (id, cb) {
      if (!cb) cb = defaultCb;
      if (id.id) id = id.id;
      if (options.destroy) {
        api.load(id, function (err, entity) {
          if (err) return cb(err);
          if (!entity) return cb();
          options.destroy.call(api, entity, doDestroy);
        });
      }
      else doDestroy();

      function doDestroy (err) {
        if (err) return cb(err);
        redis.MULTI()
          .DEL(options.prefix + ':' + id)
          .ZREM(options.prefix + ':', id)
          .EXEC(cb);
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
  var options = api.copy(_opts);
  options.prefix || (options.prefix = 'entity');
  options.scoreFn || (options.scoreFn = function (entity) {
    return 0;
  });

  function defaultCb (err) {
    if (err) {
      console.error('entity error!');
      throw err;
    }
  }

  return api;
};
