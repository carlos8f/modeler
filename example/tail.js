var modeler = require('../')
  , assert = require('assert')

var numbers = modeler();
var numNumbers = 634;
var latch = numNumbers;

for (var i = 1; i <= numNumbers; i++) {
  numbers.save({ id: i }, function (err) {
    assert.ifError(err);
    if (!--latch) tail();
  });
}

function tail () {
  numbers.tail({limit: 10}, function (err, chunk, next) {
    assert.ifError(err);
    // just get the first chunk
    console.log(chunk);
  });
}

/**
Output:

[ { id: 634 },
  { id: 633 },
  { id: 632 },
  { id: 631 },
  { id: 630 },
  { id: 629 },
  { id: 628 },
  { id: 627 },
  { id: 626 },
  { id: 625 } ]

**/
