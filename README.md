modeler
=======

simple entity system using a functional approach

[![build status](https://secure.travis-ci.org/carlos8f/modeler.png)](http://travis-ci.org/carlos8f/modeler)

## Idea

Some "object-relational mapping systems" try to do everything, and in doing
so become a huge steaming pile of shit that no one can figure out. They typically
encourage the developer to become lazy and wasteful by baiting them with magically
automatic cascading loaders made possible by a hidden entourage of expensive hooks
and subqueries. They force the developer to create grotesque schema definitions
for databases that are supposed to be schemaless. "getters" and "setters" abound,
obfuscating and polluting the data structure and making it difficult to just find
out what an object holds. And increasingly, ORMs are focused on a single database
technology (SQL-only or MongoDB-only) and therefore make your code unportable by
association.

A `modeler` model, on the other hand, is simply an object literal. Its companion
is a "collection" object, another object literal containing a set of functions
which load, save, list, and destroy models of a given type. Collections are very
easily extendible to work with any data store or external API, by simply overriding
the collection functions.

`modeler` might be for you if:

- you need a quick, database-agnostic, schema-less way of storing id/object,
  relational, time series, or configuration data
- you'd prefer the portability and clarity of object literals over prototype-based
  instances
- you'd like to use an external API such as Twitter as a data store, and want
  a unified API to work with said data
- you'd like to load an object from one store and save it in another
- you want an ORM for some new trendy database, but can't find one. Implement
  a few backend functions and `modeler` core will do the rest.

## Features

- simple, extensible core
- "tailable" collections - easily fetch the latest data
- continuable lists - call `next()` when/if you need more data
- instant [string-based IDs](https://github.com/carlos8f/node-idgen), available
  before saving
- create, save, load, and destroy hooks
- hooks let you trigger your own events, provide defaults, alter models, and
  perform validation

## CRUD example

Modeler comes out of the box with a memory-based store, which while not being
appropriate for production use, demonstrates the "CRUD" API in its most basic form:

```js
var modeler = require('modeler');
// create a named collection
var people = modeler({
  name: 'people' // optional for memory store, but required for most others
});

// create an object
var me = people.create({
  name: 'carlos',
  occupation: 'ninja',
  isCrazy: true,
  volume: 11,
  birthday: new Date(1983, 10, 17)
});
// create() adds some stuff like `id`, `created` date, etc.
console.log('me', me);

// save the object
people.save(me, function (err) {
  // i'm now saved! (for memory store this is not really persistent though)
  people.load(me.id, function (err, loadedMe) {
    // `rev` is incremented, and `updated` date is set
    console.log('loaded me', loadedMe);
    // destroy me! (callbacks are optional except for load(), btw)
    people.destroy(me);
  });
});
```

## Listing

Keys or full objects can be listed using several styles.

### Sorting

Insertion order is maintained as strictly as possible for a given store. For
stores that aren't able to track insertion order, an approximation is used instead.

Note that insertion order is not necessarily equivalent to `created` date sorting,
due to the fact that dates must have granularity (usually a millisecond).

To sort by a specific property or function, you could:

- create an `id,sort_value` table/collection/sorted set in your database of choice,
  and sort on `sort_value` using an index.
- create a store which can take a `sort` option and implement your own sorting
  (see below for how to create a store).

### Options for all list methods

- `load` (Boolean, default `false`), `true` lists full objects, `false` lists
  keys only.

### list([options,] cb)

List keys or objects

#### Options

- `reverse` (Boolean, default `false`) `true` to list in reverse insertion order
- `offset` (Integer, default `0`) Start listing at the given zero-based offset
- `limit` (Integer, default `undefined`) Max size for a chunk. A store may return
  a list of a shorter length, and pass you a `next` function to call when you're
  ready for the next chunk.

#### Callback

List callbacks are passed 2-3 arguments:

1. `err`, an error object if generated
2. `chunk`, an array of keys or objects (depending on `options.load`)
3. `next`, (some stores may not support this) a function to call which will trigger
   the `cb` again with the next chunk

#### Example

```js
var modeler = require('modeler');

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
```

### head([limit,] [options,] cb)

List in order of insertion. Proxy for `list({limit: <limit>})`

### tail([limit,] [options,] cb)

List in reverse order of insertion. Proxy for `list({reverse: true, limit: <limit>})`

#### Example

List 10 numbers starting from 634, in descending order:

```js
var modeler = require('modeler');

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
```

### slice(offset, [limit,] [options,] cb)

List starting at a given offset. Proxy for `list({offset: <offset>, limit: <limit>})`

## Hooks

When constructing a collection, you may pass custom functions with code to be
injected into the CRUD process:

```js
var modeler = require('modeler')
  , assert = require('assert')

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

    // the first time it's being saved, apple.rev === 1
    if (apple.rev === 1)
    else {
      // if there is a previous version of the apple, it will be exposed on .__old.
      // NOTE: the .__old property should be considered read-only and just used for reference.
      assert(apple.__old.rev === apple.rev - 1);
    }

    // transform the saved version
    process.nextTick(function () {
      var c = apples.copy(apple);
      // make condition an array for the hell of it
      if (!Array.isArray(c.condition)) c.condition = [c.condition];
      // properties prefixed with __ are "save-only": stripped when loaded
      c.__internal = true;
      // we're electing to alter the object, so pass it back to the callback.
      // NOTE: if you don't intend on altering the object, just call cb()
      cb(null, c);
    });
  },
  // this code runs right after an object is saved, synced up, and had save-only properties removed
  afterSave: function (apple, cb) {
    // maybe add a reference to this model in a related model
    process.nextTick(cb);
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
  },
  // this code is called with the full object right after it's deleted in the store
  afterDestroy: function (apple, cb) {
    // maybe cleanup related models...
    process.nextTick(cb);
  }
});
```

## Stores

A store is really just a wrapper function which returns a modified version of
what `require('modeler')` returns:

```js
var modeler = require('modeler');

function myStore (_opts) {
  var api = modeler(_opts);
  // api.options contains parsed options
  // override api's functions, or extend with your own...
  return api;
}
```

The key functions to override are:

- `_head(offset, limit, cb)` list the objects in insertion order
- `_tail(offset, limit, cb)` list the objects in reverse insertion order
- `_save(saveEntity, cb)` save an object to the store
- `_load(id, cb)` load an object
- `_destroy(id, cb)` destroy an object

For an example store, see the
[built-in memory store](https://github.com/carlos8f/modeler/blob/master/memory.js)

### Stores on npm

- [Redis](https://github.com/carlos8f/modeler-redis)
- [LevelDB](https://github.com/carlos8f/modeler-leveldb)
- [MySQL](https://github.com/carlos8f/modeler-mysql)
- [Twitter](https://github.com/carlos8f/modeler-twitter)

### Stores planned

- MongoDB
- Riak
- ElasticSearch
- Github (gist)
- Stocks (ticks, OHLC)
- Facebook

If you write a store and put it on npm, please let me know!

- - -

### Developed by [Terra Eclipse](http://www.terraeclipse.com)
Terra Eclipse, Inc. is a nationally recognized political technology and
strategy firm located in Aptos, CA and Washington, D.C.

- - -

### License: MIT

- Copyright (C) 2013 Carlos Rodriguez (http://s8f.org/)
- Copyright (C) 2013 Terra Eclipse, Inc. (http://www.terraeclipse.com/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the &quot;Software&quot;), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED &quot;AS IS&quot;, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
