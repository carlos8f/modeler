var modeler = require('../');
var people = modeler({
  name: 'people' // optional for memory store, but required for most others
});

// create me
var me = people.create({
  name: 'carlos',
  occupation: 'ninja',
  isCrazy: true,
  volume: 11,
  birthday: new Date(1983, 10, 17)
});
console.log('me', me);

// save me
people.save(me, function (err) {
  // i'm now saved
  people.load(me.id, function (err, loadedMe) {
    console.log('loaded me', loadedMe);
    // destroy me! (callbacks are optional except for load(), btw)
    people.destroy(people);
  });
});
