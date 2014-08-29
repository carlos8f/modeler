var utils = require('../utils')
  , assert = require('assert')
  , util = require('util')
  , modeler = require('../')

describe('api', function () {
  var destroyed = [];
  if (typeof setUp !== 'undefined') before(setUp);
  if (typeof tearDown !== 'undefined') after(tearDown);

  function assertList (expected, done) {
    var list = [];
    return function getNext (err, res, next) {
      assert.ifError(err);
      list = list.concat(res);
      if (list.length === expected.length) {
        assert.deepEqual(list, expected);
        done();
      }
      else {
        assert(list.length < expected.length, 'list returned too many results');
        next();
      }
    };
  }

  var apples;
  it('creates apples model', function () {
    var options = {
      name: 'apples',
      biteSize: 10,
      hooks: {
        save: function (apple, options, cb) {
          assert(this.name, 'apples');
          if (!apple.size) return cb(new Error('size matters'));
          if (!apple.condition) return cb(new Error('condition is required'));
          if (options.isNew) {
            apple.hooks = {
              save: 0,
              afterSave: 0,
              load: 0,
              destroy: 0,
              afterDestroy: 0
            }
            apple.rev = 0;
            apple.created = new Date();
            apple.updated = new Date();
            apple.bitesTaken = 0;
          };
          apples.load(apple.id, function (err, existing) {
            if (err) return cb(err);
            if (existing && existing.rev > apple.rev) {
              err = new Error('cannot save over a newer revision');
              err.code = 'REV_CONFLICT';
              err.existing = existing;
              return cb(err);
            }
            apple.rev++;
            process.nextTick(cb);
          });
        },
        afterSave: function (apple, options, cb) {
          apple.hooks.afterSave++;
          cb();
        },
        load: function (apple, options, cb) {
          apple.hooks.load++;
          process.nextTick(cb);
        },
        destroy: function (apple, options, cb) {
          apple.hooks.destroy++;
          destroyed.push(apple.id);
          process.nextTick(cb);
        },
        afterDestroy: function (apple, options, cb) {
          apple.hooks.afterDestroy++;
          cb();
        }
      },
      // this is a custom method
      takeBite: function (apple) {
        apple.bitesTaken += this.biteSize;
      }
    };
    if (typeof testOptions !== 'undefined') testOptions(options);
    apples = modeler(options);
  });
  it('creates oranges model', function () {
    var options = {
      name: 'oranges'
    };
    if (typeof testOptions !== 'undefined') testOptions(options);
    oranges = modeler(options);
  });
  it('creates a few apples', function (done) {
    bigGood = {size: 'big', condition: 'good'};
    smallBad = {size: 'small', condition: 'bad'};
    apples.save(smallBad, function (err) {
      assert.ifError(err);
      assert(smallBad.id);
      assert.equal(smallBad.size, 'small');
      assert.equal(smallBad.condition, 'bad');
      assert.strictEqual(smallBad.__internal, undefined);

      apples.save(bigGood, done);
    });
    assert.equal(smallBad.size, 'small');
    assert.equal(smallBad.condition, 'bad');
  });
  it('cannot create with same id', function (done) {
    apples.save({id: bigGood.id, size: 'big', condition: 'good'}, {isNew: true}, function (err, dupeBigGood) {
      assert(err);
      assert(!dupeBigGood);
      assert.equal(err.code, 'REV_CONFLICT');
      assert.equal(err.existing.id, bigGood.id);
      done();
    });
  });
  it('loads', function (done) {
    apples.load(bigGood.id, function (err, savedBigGood) {
      assert.ifError(err);
      assert.deepEqual(savedBigGood, bigGood);
      assert.equal(savedBigGood.rev, 1);
      assert.equal(savedBigGood.size, 'big');
      assert.equal(savedBigGood.condition, 'good');
      assert.strictEqual(savedBigGood.__internal, undefined);
      assert.strictEqual(bigGood.__internal, undefined);

      apples.load(smallBad.id, function (err, savedSmallBad) {
        assert.ifError(err);
        assert.deepEqual(savedSmallBad, smallBad);
        done();
      });
    });
  });
  it('saves', function (done) {
    bigGood.type = 'red delicious';
    apples.save(bigGood, done);
  });
  it('loads new', function (done) {
    apples.load(bigGood.id, function (err, savedBigGood) {
      assert.ifError(err);
      assert.deepEqual(savedBigGood, bigGood);
      assert.equal(savedBigGood.type, 'red delicious');
      assert.equal(savedBigGood.rev, 2);
      done();
    });
  });
  it('deletes a property', function (done) {
    delete bigGood.type;
    apples.save(bigGood, function (err) {
      assert.ifError(err);
      apples.load(bigGood.id, function (err, savedBigGood) {
        assert.ifError(err);
        assert.deepEqual(savedBigGood, bigGood);
        assert.equal(savedBigGood.type, undefined);
        assert.equal(savedBigGood.rev, 3);
        done();
      });
    });
  });
  it('validates', function (done) {
    apples.save({size: 'medium'}, function (err, apple) {
      assert.equal(err.message, 'condition is required');
      assert.equal(apple, undefined);
      done();
    });
  });
  it('validation', function (done) {
    apples.save({condition: 'ok'}, function (err) {
      assert.equal(err.message, 'size matters');
      done();
    });
  });
  it('create another', function (done) {
    apples.save({condition: 'ok', size: 10}, function (err, apple) {
      assert.ifError(err);
      notSureOk = apple;
      done();
    });
  });
  it('tail', function (done) {
    apples.tail({limit: 10}, assertList([
      notSureOk,
      bigGood,
      smallBad
    ], done));
  });
  it('tail with limit', function (done) {
    apples.tail({limit: 2}, assertList([
      notSureOk,
      bigGood
    ], done));
  });
  it('destroys', function (done) {
    apples.destroy(smallBad.id, function (err) {
      assert.ifError(err);
      assert.deepEqual(destroyed, [
        smallBad.id
      ]);
      apples.load(smallBad.id, function (err, apple) {
        assert.ifError(err);
        assert.equal(apple, null);
        done();
      });
    });
  });
  it('creates an orange', function (done) {
    oranges.save(function (err, savedSingle) {
      assert.ifError(err);
      assert(savedSingle.id);
      singleOrange = savedSingle;
      done();
    });
  });
  it('loads orange', function (done) {
    oranges.load(singleOrange.id, function (err, orange) {
      assert.ifError(err);
      assert(orange);
      oranges.destroy(orange.id, function (err) {
        assert.ifError(err);
        assert.equal(destroyed.length, 1); // destroyed array only applies to apples
        done();
      });
    });
  });
  it('creates 100 oranges', function (done) {
    var latch = 100;
    for (var i = 0; i < 100; i++) {
      (function (i) {
        oranges.save({
          id: i
        }, {isNew: true}, function (err) {
          assert.ifError(err);
          if (!--latch) done();
        });
      })(i);
    }
  });
  it('iterates with correct chunk size', function (done) {
    var curr = 90, iterations = 0;
    oranges.tail({limit: 5, offset: 9}, function (err, chunk, next) {
      assert.ifError(err);
      iterations++;
      if (chunk.length !== 5) {
        assert.equal(iterations, 19);
        assert.deepEqual(chunk, [{id: 0}]);
        done();
      }
      else {
        assert.deepEqual(chunk, [
          {id: curr--}, {id: curr--}, {id: curr--}, {id: curr--}, {id: curr--}
        ]);
        next();
      }
    });
  });
});
