var idgen = require('idgen');

module.exports = function (_opts) {
  var api = {
    list: function (options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = null;
      }
      options || (options = {});
      api._list.call(api, options, cb);
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
      api.load(entity.id, function (err, existing) {
        if (err) return cb(err);
        if (existing && existing.rev > entity.rev) {
          err = new Error('cannot save over a newer revision');
          err.code = 'REV_CONFLICT';
          return cb(err);
        }
        entity.rev++;

        if (api.options.save) api.options.save.call(api, entity, doSave);
        else doSave();

        function doSave (err, saveEntity) {
          if (!saveEntity) saveEntity = entity;
          if (err) return cb(err);

          api._save(saveEntity, function (err) {
            if (err) return cb(err);
            cb(null, entity);
          });
        }
      });
    },
    load: function (id, cb) {
      if (!cb) cb = defaultCb;
      api._load(id, function (err, entity) {
        if (err) return cb(err);
        if (!entity) return cb(null, null);

        if (api.options.load) api.options.load.call(api, entity, doCallback);
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

  api.options.defaultCb || (api.options.defaultCb = function defaultCb (err) {
    if (err) throw err;
  });

  return api;
};
