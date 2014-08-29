var utils = require('./utils');

module.exports = function (api) {
  api || (api = {});
  api.hooks || (api.hooks = {});

  if (!api.idAttribute) {
    api.idAttribute = 'id';
  }
  if (!api.newId) {
    api.newId = utils.newId;
  }
  if (!api.save) {
    api.save = function (entity, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
      else if (typeof entity === 'function') {
        cb = entity;
        entity = {};
        options = {};
      }
      options = utils.copy(options);

      if (typeof options.isNew === 'undefined') {
        options.isNew = typeof entity[api.idAttribute] === 'undefined';
      }
      if (options.isNew && typeof entity[api.idAttribute] === 'undefined') {
        entity[api.idAttribute] = api.newId();
      }
      if (options.hooks !== false && api.hooks.save) api.hooks.save.call(api, entity, options, doSave);
      else doSave();

      function doSave (err) {
        if (err) return cb(err);
        api._save(entity, options, function (err) {
          if (err) return cb(err);
          if (api.hooks.afterSave) {
            api.hooks.afterSave.call(api, entity, options, function (err) {
              if (err) return cb(err);
              cb(null, entity);
            });
          }
          else cb(null, entity);
        });
      }
    };
  }
  if (!api.load) {
    api.load = function (id, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
      options || (options = {});

      api._load(id, options, function (err, entity) {
        if (err) return cb(err);
        if (!entity) return cb(null, null);

        if (options.hooks !== false && api.hooks.load) api.hooks.load.call(api, entity, options, withHook);
        else withHook();

        function withHook (err) {
          if (err) return cb(err);
          cb(null, entity);
        }
      });
    };
  }
  if (!api.tail) {
    api.tail = function (limit, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
      options || (options = {});

      var offset = options.offset || 0;
      (function getNext () {
        api._tail(offset, limit, options, function (err, chunk) {
          if (err) return cb(err);
          if (chunk.length) {
            offset += chunk.length;
            if (options.hooks === false || !api.hooks.load) cb(null, chunk, getNext);
            else {
              var latch = chunk.length, errored = false;
              chunk.forEach(function (entity) {
                api.hooks.load.call(api, entity, options, function (err) {
                  if (err) {
                    errored = true;
                    return cb(err);
                  }
                  if (!--latch && !errored) cb(null, chunk, getNext);
                });
              });
            }
          }
          else cb(null, chunk, null);
        });
      })();
    }
  }
  if (!api.destroy) {
    api.destroy = function (id, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
      options || (options = {});

      api.load(id, options, function (err, entity) {
        if (err) return cb(err);
        if (!entity) return cb(null, null);

        if (options.hooks !== false && api.hooks.destroy) api.hooks.destroy.call(api, entity, options, withHook);
        else withHook();

        function withHook (err) {
          if (err) return cb(err);
          api._destroy(entity, options, function (err) {
            if (err) return cb(err);
            if (options.hooks !== false && api.hooks.afterDestroy) {
              api.hooks.afterDestroy.call(api, entity, options, function (err) {
                if (err) return cb(err);
                cb(null, entity);
              });
            }
            else cb(null, entity);
          });
        }
      });
    };
  }
  return api;
};
