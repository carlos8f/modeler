var utils = require('./utils')
  , es = require('event-stream')

module.exports = function (api) {
  api || (api = {});
  api.hooks || (api.hooks = {});

  if (!api.idAttribute) api.idAttribute = 'id';
  if (!api.newId) api.newId = utils.newId;

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
      if (!cb) options = entity;
      options = utils.copy(options);
      var autoId = false;

      if (cb) {
        if (typeof options.isNew === 'undefined') {
          options.isNew = typeof entity[api.idAttribute] === 'undefined';
        }
        if (options.isNew && typeof entity[api.idAttribute] === 'undefined') {
          entity[api.idAttribute] = api.newId();
          autoId = true;
        }
        if (options.hooks !== false && api.hooks.save) api.hooks.save.call(api, entity, options, doSave);
        else doSave();

        function onErr (err) {
          if (autoId) delete entity[api.idAttribute];
          return cb(err);
        }

        function doSave (err) {
          if (err) return onErr(err);
          api._save(entity, options, function (err) {
            if (err) return onErr(err);
            if (api.hooks.afterSave) {
              api.hooks.afterSave.call(api, entity, options, function (err) {
                if (err) return onErr(err);
                cb(null, entity);
              });
            }
            else cb(null, entity);
          });
        }
      }
      else return es.map(function (entity, _cb) {
        api.save(entity, function (err) {
          if (err) return _cb(err);
          _cb(null, entity);
        });
      });
    };
  }
  if (!api.load) {
    api.load = function (id, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
      options = utils.copy(options);

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
  if (!api.head) {
    api.head = function (options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
      options = utils.copy(options);
      options.offset || (options.offset = 0);

      function getNext (_cb) {
        if (!_cb) _cb = cb;
        api._list(options, function (err, chunk) {
          if (err) return _cb(err);
          if (chunk.length) {
            options.offset += chunk.length;
            if (options.hooks === false || !api.hooks.load) _cb(null, chunk, getNext);
            else {
              var latch = chunk.length, errored = false;
              chunk.forEach(function (entity) {
                api.hooks.load.call(api, entity, options, function (err) {
                  if (err) {
                    errored = true;
                    return _cb(err);
                  }
                  if (!--latch && !errored) _cb(null, chunk, getNext);
                });
              });
            }
          }
          else _cb(null, chunk, null);
        });
      }
      if (cb) getNext(cb);
      else {
        var emitCount = 0;
        return es.readable(function (count, _cb) {
          var self = this;
          getNext(function (err, chunk) {
            if (err) return _cb(err);
            var remaining = (options.limit || -1) - emitCount;
            if (remaining !== 0 && chunk.length) {
              if (remaining !== -1 && chunk.length > remaining) chunk.splice(0, remaining);
              chunk.forEach(function (entity) {
                self.emit('data', entity);
                emitCount++;
              });
              _cb();
            }
            else return self.emit('end');
          });
        });
      }
    }
  }
  if (!api.tail) {
    api.tail = function (options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
      options = utils.copy(options);
      options.reverse = true;
      return api.head(options, cb);
    }
  }
  if (!api.destroy) {
    api.destroy = function (id, options, cb) {
      if (typeof options === 'function') {
        cb = options;
        options = {};
      }
      options = utils.copy(options);

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
