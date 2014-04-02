describe('basic test', function () {
  var apples, oranges, lemons, destroyed = [], bigGood, smallBad, notSureOk, singleOrange, singleLemon, deletedLemonSpy = {};
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
      else next();
    };
  }

  it('creates apples model', function () {
    var options = {
      name: 'apples',
      create: function (apple) {
        apple.size || (apple.size = 'not sure');
      },
      save: function (apple, cb) {
        // old entity should be exposed on .__old
        if (apple.rev > 1) {
          assert(apple.__old.rev === apple.rev - 1);
        }
        // simple validator
        if (!apple.condition) return cb(new Error('condition is required'));
        if (!apple.size) return cb(new Error('size matters'));

        // test save transformation
        process.nextTick(function () {
          var c = apples.copy(apple);
          if (!Array.isArray(c.condition)) c.condition = [c.condition];
          c.__internal = true;
          cb(null, c);
        });
      },
      load: function (apple, cb) {
        if (!Array.isArray(apple.condition))
          return cb(new Error('apples need to be stored with a condition as an array. don\'t ask me why!'));
        if (!apple.condition.length) return cb(new Error(apple.size + ' has no condition'));
        if (!apple.__internal) return cb(new Error('apple should be internal right now'));
        process.nextTick(function () {
          apple.condition = apple.condition[0];
          cb(null, apple);
        });
      },
      destroy: function (apple, cb) {
        destroyed.push(apple.id);
        process.nextTick(cb);
      }
    };
    if (typeof extraOptions !== 'undefined') {
      Object.keys(extraOptions).forEach(function (k) {
        options[k] = extraOptions[k];
      });
    }
    apples = modeler(options);
  });
  it('creates oranges model', function () {
    var options = {
      name: 'oranges'
    };
    if (typeof extraOptions !== 'undefined') {
      Object.keys(extraOptions).forEach(function (k) {
        options[k] = extraOptions[k];
      });
    }
    oranges = modeler(options);
  });
  it('creates lemons model', function () {
    var options = {
      name: 'lemons',
      afterSave: function (lemon, cb) {
        assert(lemon);
        lemon.afterSaveCalled = true;
        process.nextTick(cb);
      },
      afterDestroy: function (lemon, cb) {
        assert(lemon);
        deletedLemonSpy.afterDestroyCalled = true;
        process.nextTick(cb);
      }
    };
    if (typeof extraOptions !== 'undefined') {
      Object.keys(extraOptions).forEach(function (k) {
        options[k] = extraOptions[k];
      });
    }
    lemons = modeler(options);
  });
  it('creates a few apples', function (done) {
    bigGood = apples.create({size: 'big', condition: 'good'});
    assert(bigGood.id);
    assert(bigGood.created.getTime());
    assert.equal(bigGood.rev, 0);
    assert.equal(bigGood.size, 'big');
    assert.equal(bigGood.condition, 'good');

    smallBad = apples.create({size: 'small', condition: 'bad'}, function (err, savedSmallBad) {
      assert.ifError(err);
      assert(savedSmallBad.id);
      assert(savedSmallBad.created.getTime());
      assert.deepEqual(smallBad, savedSmallBad);
      assert.equal(savedSmallBad.rev, 1);
      assert.equal(savedSmallBad.size, 'small');
      assert.equal(savedSmallBad.condition, 'bad');
      assert.strictEqual(savedSmallBad.__internal, undefined);
      assert.strictEqual(smallBad.__internal, undefined);

      apples.load(bigGood.id, function (err, savedBigGood) {
        assert.ifError(err);
        assert(!savedBigGood);
        apples.save(bigGood, done);
      });
    });
    assert.equal(smallBad.size, 'small');
    assert.equal(smallBad.condition, 'bad');
  });
  it('cannot create with same id', function (done) {
    apples.create({id: bigGood.id, size: 'big', condition: 'good'}, function (err, dupeBigGood) {
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
      assert(savedBigGood.updated > savedBigGood.created);
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
    apples.create({size: 'medium'}, function (err, apple) {
      assert.equal(err.message, 'condition is required');
      assert.equal(apple, undefined);
      done();
    });
  });
  it('defaults', function () {
    var notSure = apples.create({condition: 'so so'});
    assert.equal(notSure.size, 'not sure');
  });
  it('runs afterSave hook', function (done) {
    var lemon = {
      color: 'yellow',
      smooth: false
    }
    lemons.create(lemon, function (err, model) {
      assert.ifError(err);
      Object.keys(lemon).forEach(function (prop) {
        assert.equal(model[prop], lemon[prop]);
      });
      assert(model.afterSaveCalled);
      singleLemon = model;
      done();
    });
  });
  it('runs afterDestroy hook', function (done) {
    lemons.destroy(singleLemon.id, function (err) {
      assert.ifError(err);
      assert(deletedLemonSpy.afterDestroyCalled);
      done();
    });
  });
  it('lists', function (done) {
    apples.list(assertList([
      smallBad.id,
      bigGood.id
    ], done));
  });
  it('slice', function (done) {
    apples.slice(1, assertList([
      bigGood.id
    ], done));
  });
  it('head', function (done) {
    apples.head(1, assertList([
      smallBad.id
    ], done));
  });
  it('creates another', function (done) {
    notSureOk = apples.create({condition: 'ok'}, function (err) {
      assert.ifError(err);
      done();
    });
  });
  it('tail', function (done) {
    apples.tail(assertList([
      notSureOk.id,
      bigGood.id,
      smallBad.id
    ], done));
  });
  it('tail with load', function (done) {
    apples.tail({load: true}, assertList([
      notSureOk,
      bigGood,
      smallBad
    ], done));
  });
  it('tail with limit', function (done) {
    apples.tail(2, assertList([
      notSureOk.id,
      bigGood.id
    ], done));
  });
  it('slice again', function (done) {
    apples.slice(1, assertList([
      bigGood.id,
      notSureOk.id
    ], done));
  });
  it('slice with limit', function (done) {
    apples.slice(1, 1, assertList([
      bigGood.id,
    ], done));
  });
  it('load multi', function (done) {
    apples.load([smallBad.id, notSureOk.id, 'made up', bigGood.id], function (err, entities) {
      assert.ifError(err);
      assert.deepEqual(entities, [
        smallBad,
        notSureOk,
        null,
        bigGood
      ]);
      done();
    });
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
  it('new list', function (done) {
    apples.list(assertList([
      bigGood.id,
      notSureOk.id
    ], done));
  });
  it('creates an orange', function (done) {
    singleOrange = oranges.create(function (err, savedSingle) {
      assert.ifError(err);
      assert.deepEqual(savedSingle, singleOrange);
      assert(savedSingle.id);
      assert.equal(savedSingle.rev, 1);
      done();
    });
  });
  it('lists oranges', function (done) {
    oranges.list(assertList([
      singleOrange.id
    ], done));
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
        oranges.create({
          id: i
        }, function (err) {
          assert.ifError(err);
          if (!--latch) done();
        });
      })(i);
    }
  });
  it('iterates with correct chunk size', function (done) {
    var curr = 90, iterations = 0;
    oranges.list({reverse: true, offset: 9, limit: 5}, function (err, chunk, next) {
      assert.ifError(err);
      iterations++;
      if (chunk.length !== 5) {
        assert.equal(iterations, 19);
        assert.deepEqual(chunk, [0]);
        done();
      }
      else {
        assert.deepEqual(chunk, [
          curr--, curr--, curr--, curr--, curr--
        ]);
        next();
      }
    });
  });
});
