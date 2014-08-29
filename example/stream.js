var modeler = require('../');
var es = require('event-stream');
var data = require('./beatles.json');
var users = modeler();

es.readArray(data)
  .pipe(users.save())
  .once('end', function () {
    users.tail().on('data', console.log);
  })

/**
Output:

{ name: 'Ringo',
  instrument: 'He\'s got an inferiority complex. That\'s why he plays the drums.',
  id: '@ru_mod_or_rocka' }
{ name: 'George',
  instrument: 'lead guitar',
  id: '@mystic_sitar' }
{ name: 'Paul', instrument: 'bass guitar', id: '@tha_walrus' }
{ name: 'John', instrument: 'rhythm guitar', id: '@sb_fields' }

**/
