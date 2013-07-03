modeler
=======

simple entity system using a functional approach

[![build status](https://secure.travis-ci.org/carlos8f/modeler.png)](http://travis-ci.org/carlos8f/modeler)

## Idea

Some "object-relational mapping systems" and try to do everything, and in doing
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
    people.destroy(people);
  });
});
```

## Listing

Keys or full objects can be listed using several styles.

### Sorting

Insertion order is maintained as strictly as possible for a given store, which
does not necessarily correlate to `created` date.

To sort by a field or function, you could:

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
  a list of a shorter length, and pass you a `next` function for when you're ready
  for the next chunk.

#### Callback

List callbacks are passed 2-3 arguments:

1. `err`, an error object if generated
2. `chunk`, an array of keys or objects (depending on `options.load`)
3. `next`, (some stores may not support this) a function to call which will trigger
   the `cb` again with the next chunk

### head([limit,] [options,] cb)

List in order of insertion. Proxy for `list({limit: <limit>})`

### tail([limit,] [options,] cb)

List in reverse order of insertion. Proxy for `list({reverse: true, limit: <limit>})`

### slice(offset, [limit,] [options,] cb)

List starting at a given offset. Proxy for `list({offset: <offset>, limit: <limit>})`

## Hooks

## Stores

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
