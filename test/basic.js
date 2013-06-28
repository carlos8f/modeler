describe('basic test', function () {
  var apples, oranges, destroyed = [], bigGood, smallBad, notSureOk;
  it('creates apples model', function () {
    apples = modeler({
      create: function (apple) {
        apple.size || (apple.size = 'not sure');
      },
      save: function (apple, cb) {
        // simple validator
        if (!apple.condition) return cb(new Error('condition is required'));
        if (!apple.size) return cb(new Error('size matters'));

        // test save transformation
        process.nextTick(function () {
          var c = apples.copy(apple);
          c.condition = [c.condition];
          c.internal = true;
          cb(null, c);
        });
      },
      load: function (apple, cb) {
        if (!Array.isArray(apple.condition))
          return cb(new Error('apples need to be stored with a condition as an array. don\'t ask me why!'));
        if (!apple.internal) return cb(new Error('apple should be internal right now'));
        var c = apples.copy(apple);
        delete c.internal;
        process.nextTick(function () {
          c.condition = c.condition.pop();
          cb(null, c);
        });
      },
      destroy: function (apple, cb) {
        destroyed.push(apple.id);
        process.nextTick(cb);
      }
    });
  });
  it('creates a few apples', function (done) {
    bigGood = apples.create({size: 'big', condition: 'good'});
    assert(bigGood.id);
    assert(bigGood.created.getTime());
    assert.equal(bigGood.rev, 0);
    assert.equal(bigGood.size, 'big');
    assert.equal(bigGood.condition, 'good');

    setTimeout(function () {
      smallBad = apples.create({size: 'small', condition: 'bad'}, function (err, savedSmallBad) {
        assert.ifError(err);
        assert(savedSmallBad.id);
        assert(savedSmallBad.created.getTime());
        assert.deepEqual(smallBad, savedSmallBad);
        assert.equal(savedSmallBad.rev, 1);
        assert.equal(savedSmallBad.size, 'small');
        assert.equal(savedSmallBad.condition, 'bad');

        apples.load(bigGood.id, function (err, savedBigGood) {
          assert.ifError(err);
          assert(!savedBigGood);
          apples.save(bigGood, done);
        });
      });
      assert.equal(smallBad.size, 'small');
      assert.equal(smallBad.condition, 'bad');
    }, 10);
  });
  it('loads', function (done) {
    apples.load(bigGood.id, function (err, savedBigGood) {
      assert.ifError(err);
      assert.deepEqual(savedBigGood, bigGood);
      assert.equal(savedBigGood.rev, 1);
      assert.equal(savedBigGood.size, 'big');
      assert.equal(savedBigGood.condition, 'good');
      
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
      done();
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
  it('lists', function (done) {
    apples.list(function (err, keys) {
      assert.ifError(err);
      assert.deepEqual(keys, [
        bigGood.id,
        smallBad.id
      ]);
      done();
    });
  });
  it('partial list', function (done) {
    apples.list({start: 1}, function (err, keys) {
      assert.ifError(err);
      assert.deepEqual(keys, [
        smallBad.id
      ]);
      done();
    });
  });
  it('another list', function (done) {
    apples.list({stop: 1}, function (err, keys) {
      assert.ifError(err);
      assert.deepEqual(keys, [
        bigGood.id
      ]);
      done();
    });
  });
  it('creates another', function (done) {
    notSureOk = apples.create({condition: 'ok'}, function (err) {
      assert.ifError(err);
      done();
    });
  });
  it('reverses', function (done) {
    apples.list({reverse: true}, function (err, keys) {
      assert.ifError(err);
      assert.deepEqual(keys, [
        notSureOk.id,
        smallBad.id,
        bigGood.id
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
    apples.list(function (err, keys) {
      assert.ifError(err);
      assert.deepEqual(keys, [
        bigGood.id,
        notSureOk.id
      ]);
      done();
    });
  });
});
