modeler
=======

A simple and fun data API to rule them all

[![build status](https://secure.travis-ci.org/carlos8f/modeler.png)](http://travis-ci.org/carlos8f/modeler)

## Introducing modeler

In the old days, most apps used some type of SQL, and pretty much everyone wrote SQL queries
in their code directly, which seemed fine at the time.

Now, we have all these crazy things like MongoDB, Redis, LevelDB, etc.
which each have their own quirks, APIs, and capabilities. We realized that writing
queries directly into our apps not only marries us to the DB implementation,
but tends to create ugly, hard-to-maintain code. We might write a one-off abstraction
layer for this or that, but then we have more headaches when it comes time to
unify and reuse.

Modeler is intended to make working with data fun again, by uniting all the backends under
one elegant API. Write the app now, and choose the storage engine later. Unlike most ORM
modules, modeler does not have a preference for SQL or NoSQL, key/value or table. 

Also, if you're using some new database no one has heard about yet, don't dispair --
implementing a modeler driver is straightforward.

## Features

- Database agnostic! Use all the DB's!
- CRUD (Create, Read, Update, Delete) and iteration!
- Ultra simple! Not much to remember!
- No object-oriented crap! Object Literal (TM) technology!
- Streaming!
- `tail` and `head` your collection, just like unix!
- User-defined hooks!
- Ready-to-use drivers for LevelDB, Redis, and others!

## API

`collection = modeler([options])`:

Returns: collection object

Options:

- `idAttribute` - string - default: `id` - use a custom name for the ID property
- `newId` - function - takes an entity, returns a new ID for that entity
- `hooks` - object
    - `save` - function - takes `(entity, cb)` and runs before entity is saved
    - `afterSave` - function - takes `(entity, cb)` and runs after an entity is saved
    - `load` - function - takes `(entity, cb)` and runs after an entity is loaded
    - `destroy` - function - takes `(entity, cb)` and runs after an entity is destroyed

---

`collection.save([entity], [options], [cb])`

Save an entity.

Arguments:

- `entity` - object - the data to save
- `options` - object - options to pass to the hooks/engine
    - `isNew` - boolean - signal to the engine that this is a new record
- `cb` - function - call the function with `(err)` when done

---

`collection.load(id, [options], cb)`

Load an entity.

Arguments:

- `id` - string - the id of the entity to fetch.
- `options` - object - options to pass to the engine and hooks
- `cb` - function - called with `(err, entity)` when done

---

`collection.destroy(id, [options], cb)`

Destroy an entity.

Arguments:

- `id` - string - the id of the entity to destroy.
- `options` - object - options to pass to the engine and hooks
- `cb` - function - called with `(err, entity)` when done

---

`collection.tail([options], [cb])`

Tail the collection, fetching the latest records first.

Arguments:

- `options` - object - options to pass to the engine and hooks
    - `offset` - number - skip `offset` number of records
    - `limit` - number - limit to this number of records
- `cb` - function (optional) - called with `(err, chunk, next)`. NOTE: If omitted, `tail()`
  will return a readable stream.

`collection.head([options], [cb])`

Head the collection, fetching the earliest records first.

Arguments:

- `options` - object - options to pass to the engine and hooks
    - `offset` - number - skip `offset` number of records
    - `limit` - number - limit to this number of records
- `cb` - function (optional) - called with `(err, chunk, next)`. NOTE: If omitted, `head()`
  will return a readable stream.

# Guide: modeler in 5 steps

## Step 1: Create a collection

First call `modeler()` to create a collection object:

```js
var modeler = require('modeler');

// create a new collection
var people = modeler();
```

The `people` object now has the methods (more on those later):

- `people.save`
- `people.load`
- `people.tail`
- `people.head`
- `people.destroy`

## Step 2: Save a model

A "model" or "entity" in modeler is simply an object literal. No prototypes,
no getters, no setters.

```js
var me = {
  name: 'carlos',
  occupation: 'ninja',
  isCrazy: true,
  volume: 11,
  birthday: new Date(1983, 10, 17)
};

people.save(me, function (err) {
  // success or error logic

  /**
  me = {
    name: 'carlos',
    occupation: 'ninja',
    isCrazy: true,
    volume: 11,
    birthday: Thu Nov 17 1983 00:00:00 GMT-0800 (PST),
    id: 'MMUMInV-6nNVw3I3oUmjTw'  <--- auto generated
  }
  **/
});
```

Note that when you save a model that doesn't already have an `id` property,
modeler thinks this is a "new" record, and generates an `id` matching the
pattern `[a-zA-Z0-9-_]{16}`. This behavior can be overridden (please see the API
section).

## Step 3: Load the model

Getting the model back is pretty easy. Just pass the `id` to the `load` method:

```js
people.load('MMUMInV-6nNVw3I3oUmjTw', function (err, me) {
  // success or error logic

  /**
  me = {
    name: 'carlos',
    occupation: 'ninja',
    isCrazy: true,
    volume: 11,
    birthday: Thu Nov 17 1983 00:00:00 GMT-0800 (PST),
    id: 'MMUMInV-6nNVw3I3oUmjTw'
  }
  **/
});

## Step 4: Heads and tails

`tail` and `head` methods are provided to iterate the saved records, sorted by
insertion order. `tail`, as you may have guessed, returns the newest records first.

There are two styles to call these functions: manual and streaming.

### Streaming tail

Streaming is the simpler of the two, and is compatible with other Node.js stream
interfaces. Simply call `tail` with no callback to return a stream:

```js
require('event-stream')
  .readArray(data)
  .pipe(people.save())
  .once('end', function () {
    people
      .tail()
      .on('data', console.log)
  })
```

### Manual tail

The "manual" interface requires an iteration callback which explicitly requests
more results if they are needed.

```js
var results = [];
people.tail(function (err, chunk, next) {
  if (err) throw err;
  // chunk is an array of models, of arbitrary length.
  results = results.concat(chunk);
  if (needMoreResults && next) next();
  else {
    // now we have the full results
  }
});
```

## Step 5: Destroy them all...

Destroy the microfilm before it's too late:

```js
people.destroy('MMUMInV-6nNVw3I3oUmjTw', function (err, me) {
  // success or error logic, get a copy of me, for old times' sake
});
```

### Developed by [Terra Eclipse](http://www.terraeclipse.com)
Terra Eclipse, Inc. is a nationally recognized political technology and
strategy firm located in Aptos, CA and Washington, D.C.

- - -

### License: MIT

- Copyright (C) 2014 Carlos Rodriguez (http://s8f.org/)
- Copyright (C) 2014 Terra Eclipse, Inc. (http://www.terraeclipse.com/)

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
