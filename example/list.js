var modeler = require('../');

var musicians = modeler({
  name: 'musicians'
});

var bands = {
  'the beatles': ['john', 'paul', 'george', 'ringo'],
  'the doors': ['john', 'ray', 'jim']
};
var latch = Object.keys(bands).reduce(function (latch, band) {
  return latch + bands[band].length;
}, 0);

Object.keys(bands).forEach(function (band) {
  bands[band].forEach(function (name) {
    musicians.create({
      band: band,
      name: name
    }, function (err) {
      if (err) throw err;
      if (!--latch) listMusicians();
    });
  });
});

// iterate the whole collection
function listMusicians () {
  var list = [];
  function getChunk (err, chunk, next) {
    if (err) throw err;
    list = list.concat(chunk);
    if (chunk.length && next) next(); // just get the whole list
    else {
      list.forEach(function (musician) {
        console.log(musician.name + ' of ' + musician.band);
      });
    }
  }

  musicians.list({load: true}, getChunk);
}
