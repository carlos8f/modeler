var modeler = require('../')
  , assert = require('assert')

var apples = modeler({
  name: 'apples',
  biteSize: 10,
  hooks: {
    // this code runs just before an object is passed to the store
    save: function (apple, options, cb) {
      // "this" is the object we ran through modeler()
      assert(this.name, 'apples');
      // simple validator
      if (!apple.size) return cb(new Error('size matters'));
      if (options.isNew) {
        // the apple is about to be saved for the first time
        apple.bitesTaken = 0;
      }
      // simulate I/O
      process.nextTick(cb);
    },
    // this code runs just after an object is saved to the store
    afterSave: function (apple, options, cb) {
      cb();
    },
    // this code runs right after an object is loaded from the store
    load: function (apple, options, cb) {
      // simulate I/O
      process.nextTick(cb);
    },
    // this code is called with the full object just before it's deleted in the store
    destroy: function (apple, options, cb) {
      // trigger event or something...
      process.nextTick(cb);
    },
    // this code runs right after an object is destroyed
    afterDestroy: function (apple, options, cb) {
      cb();
    }
  },
  // this is a custom method
  takeBite: function (apple) {
    apple.bitesTaken += this.biteSize;
  }
});

// create apple
var apple = {
  size: 0
};
console.log('apple', apple);

// save apple
apples.save(apple, function (err) {
  assert.equal(err.message, 'size matters');
  apple.size = 'big';
  // try saving again
  apples.save(apple, function (err) {
    assert.ifError(err);
    console.log('saved', apple);
    apples.load(apple.id, function (err, loadedApple) {
      assert.ifError(err);
      console.log('loadedApple', loadedApple);
      // take a bite
      apples.takeBite(apple);
      // save again to see bitesTaken increase
      apples.save(apple, function (err) {
        assert.ifError(err);
        console.log('saved', apple);
        apples.destroy(apple.id, function (err) {
          assert.ifError(err);
          apples.load(apple.id, function (err, loadedApple) {
            if (err) throw err;
            console.log('poof', loadedApple);
          });
        });
      });
    });
  });
});

/**
Output:

apple { size: 0 }
saved { size: 'big', id: 'l6d9twwGbX5urMDu1FD88Q', bitesTaken: 0 }
loadedApple { size: 'big', id: 'l6d9twwGbX5urMDu1FD88Q', bitesTaken: 0 }
saved { size: 'big', id: 'l6d9twwGbX5urMDu1FD88Q', bitesTaken: 10 }
poof null

**/
