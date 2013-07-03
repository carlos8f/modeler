var modeler = require('../');

var numbers = modeler();
var numNumbers = 634;
var latch = numNumbers;

for (var i = 1; i <= numNumbers; i++) {
  numbers.create({
    id: i // specific key
  }, function (err) {
    if (err) throw err;
    if (!--latch) numbers.tail(10, function (err, chunk, next) {
      if (err) throw err;
      // just get the first chunk
      console.log(chunk);
    });
  });
}

/*
[ 634, 633, 632, 631, 630, 629, 628, 627, 626, 625 ]
*/
