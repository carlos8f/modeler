describe('basic test', function () {
  var apples, oranges, destroyed = [], bigGood, smallBad;
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
});
