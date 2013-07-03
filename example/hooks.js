var modeler = require('../');

var apples = modeler({
  name: 'apples',
  // this code runs when apples.create() is called. modify apple by reference,
  // trigger events, or throw exceptions on bad input, etc.
  create: function (apple) {
    // set a default size
    apple.size || (apple.size = 'not sure');
  },
  // this code runs just before an object is passed to the store
  save: function (apple, cb) {
    // simple validator
    if (!apple.condition) return cb(new Error('condition is required'));
    if (!apple.size) return cb(new Error('size matters'));

    // transform the saved version
    process.nextTick(function () {
      var c = apples.copy(apple);
      // make condition an array for the hell of it
      if (!Array.isArray(c.condition)) c.condition = [c.condition];
      // properties prefixed with __ are "save-only": stripped when loaded
      c.__internal = true;
      // we're electing to alter the object, so pass it back to the callback
      cb(null, c);
    });
  },
  // this code runs right after an object is loaded from the store
  load: function (apple, cb) {
    // check the object's integrity
    if (!Array.isArray(apple.condition))
      return cb(new Error('apples need to be stored with a condition as an array. don\'t ask me why!'));
    if (!apple.condition.length) return cb(new Error(apple.size + ' has no condition'));
    if (!apple.__internal) return cb(new Error('apple should be internal right now'));
    // transform into a usable state
    process.nextTick(function () {
      // convert condition back from array
      apple.condition = apple.condition[0];
      // we're electing to alter the object, so pass it back to the callback
      cb(null, apple);
    });
  },
  // this code is called with the full object just before it's deleted in the store
  destroy: function (apple, cb) {
    // trigger event or something...
    process.nextTick(cb);
  }
});
