// modeler is a function
var modeler = require('../');

// create a new collection
var people = modeler();

// create me
var me = {
  name: 'carlos',
  occupation: 'ninja',
  isCrazy: true,
  volume: 11,
  birthday: new Date(1983, 10, 17)
};
console.log('me', me);

// save me
people.save(me, function (err) {
  // i'm now saved
  console.log('saved me', me);
  people.load(me.id, function (err, loadedMe) {
    if (err) throw err;
    console.log('loaded me', loadedMe);
    loadedMe.name = 'DARTH VADER';
    // destroy me!
    people.destroy(me.id, function (err) {
      if (err) throw err;
      // poof.
      people.load(me.id, function (err, loadedMe) {
        if (err) throw err;
        console.log('poof', loadedMe);
      });
    });
  });
});

/**
Output:

me { name: 'carlos',
  occupation: 'ninja',
  isCrazy: true,
  volume: 11,
  birthday: Thu Nov 17 1983 00:00:00 GMT-0800 (PST) }
saved me { name: 'carlos',
  occupation: 'ninja',
  isCrazy: true,
  volume: 11,
  birthday: Thu Nov 17 1983 00:00:00 GMT-0800 (PST),
  id: 'vB91U-qKMeUIukFT18BTuA' }
loaded me { name: 'carlos',
  occupation: 'ninja',
  isCrazy: true,
  volume: 11,
  birthday: Thu Nov 17 1983 00:00:00 GMT-0800 (PST),
  id: 'vB91U-qKMeUIukFT18BTuA' }
poof null

**/
