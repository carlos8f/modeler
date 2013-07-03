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

// alternatively, you can create and save in one call by calling
// people.create(attrs, function (err, person) {})

/*
me { name: 'carlos',
  occupation: 'ninja',
  isCrazy: true,
  volume: 11,
  birthday: Thu Nov 17 1983 00:00:00 GMT-0800 (PST),
  id: 'NLbP7FD7xNMwPeIM',
  created: Wed Jul 03 2013 14:40:59 GMT-0700 (PDT),
  rev: 0 }
loaded me { name: 'carlos',
  occupation: 'ninja',
  isCrazy: true,
  volume: 11,
  birthday: Thu Nov 17 1983 00:00:00 GMT-0800 (PST),
  id: 'NLbP7FD7xNMwPeIM',
  created: Wed Jul 03 2013 14:40:59 GMT-0700 (PDT),
  rev: 1,
  updated: Wed Jul 03 2013 14:40:59 GMT-0700 (PDT) }
*/
