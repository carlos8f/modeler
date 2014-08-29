var modeler = require('../');
var users = modeler();

var data = [
  {
    name: 'John',
    instrument: 'rhythm guitar'
  },
  {
    name: 'Paul',
    instrument: 'bass guitar'
  },
  {
    name: 'George',
    instrument: 'lead guitar'
  },
  {
    name: 'Ringo',
    instrument: 'He\'s got an inferiority complex. That\'s why he plays the drums.'
  }
];

var latch = data.length;
data.forEach(function (member) {
  users.save(member, function (err) {
    if (err) throw err;
    if (!--latch) users.tail().on('data', console.log);
  });
});