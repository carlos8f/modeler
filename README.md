modeler
=======

A simple and fun data API to rule them all

[![build status](https://secure.travis-ci.org/carlos8f/modeler.png)](http://travis-ci.org/carlos8f/modeler)

## Object Literal (TM) technology!

A "model" in modeler is simply a JavaScript object which can be JSON-stringified. No prototypes,
no getters or setters. Use modeler to generate a "collection" object, which holds the methods and
options to work with said data.

## Features

- Database agnostic! Use all the DB's!
- Stream models in or out!
- `tail()` and `head()` your collection, just like unix!
- User-defined hooks!

## Database agnostic?

The `modeler` module, "out of the box", only provides a "memory only" store for development, with no
persistence. "Engine" modules, which extend modeler core, are expected to implement the actual persistence.

To use your database of choice and achieve persistence, find a suitable modeler engine on npm and
replace `var modeler = require('modeler')` with this (for example, to use LevelDB):

```js
var modeler = require('modeler-leveldb');

var collection = modeler({
  name: 'my_collection',
  db: require('level')('/path/to/db') // <-- engine-specific option, a LevelDB db
});
```

---

# Guide: modeler in 5 steps

## Step 1: Create a collection

First call `modeler()` to create a collection object:

```js
var modeler = require('modeler');

// create a new collection
var people = modeler({
  name: 'people'
});
```

The `people` object now has the methods (more on those later):

- `people.save([model], [options], [cb])`
- `people.load(id, [options], cb)`
- `people.destroy(id, [options], cb)`
- `people.tail([options], [cb])`
- `people.head([options], [cb])`

## Step 2: Save a model

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
pattern `[a-zA-Z0-9-_]{22}`. This behavior can be overridden (please see the API
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
```

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

---

## API

### Collection creation

`collection = modeler([options])`:

Returns: collection object

Options:

- `name` - string - uniquely identifies this collection to the engine (can be a prefix, bucket or
  table name in the data store)
- `idAttribute` - string - default: `id` - use a custom name for the ID property
- `newId` - function - takes a model, returns a new ID for that model (default: 22 psuedorandom base64url-encoded characters)
- `hooks` - object
    - `save` - function - takes `(model, cb)` and runs before model is saved
    - `afterSave` - function - takes `(model, cb)` and runs after a model is saved
    - `load` - function - takes `(model, cb)` and runs after a model is loaded
    - `destroy` - function - takes `(model, cb)` and runs after a model is destroyed

### CRUD methods

`collection.save([model], [options], [cb])`

Save a model.

Arguments:

- `model` - object - the data to save
- `options` - object - options to pass to the hooks/engine
    - `isNew` - boolean - signal to the engine that this is a new model (if omitted,
      modeler will auto-detect newness if the `id` property is undefined)
- `cb` - function - call the function with `(err)` when done

`collection.load(id, [options], cb)`

Load a model.

Arguments:

- `id` - string - the id of the model to fetch.
- `options` - object - options to pass to the engine and hooks
- `cb` - function - called with `(err, model)` when done

`collection.destroy(id, [options], cb)`

Destroy a model.

Arguments:

- `id` - string - the id of the model to destroy.
- `options` - object - options to pass to the engine and hooks
- `cb` - function - called with `(err, model)` when done

---

### Iteration Methods

`collection.tail([options], [cb])`

Tail the collection, fetching the latest models first.

Arguments:

- `options` - object - options to pass to the engine and hooks
    - `offset` - number - skip `offset` number of models
    - `limit` - number - limit to this number of models
- `cb` - function (optional) - called with `(err, chunk, next)`. NOTE: If omitted, `tail()`
  will return a readable stream.

`collection.head([options], [cb])`

Head the collection, fetching the earliest models first.

Arguments:

- `options` - object - options to pass to the engine and hooks
    - `offset` - number - skip `offset` number of models
    - `limit` - number - limit to this number of models
- `cb` - function (optional) - called with `(err, chunk, next)`. NOTE: If omitted, `head()`
  will return a readable stream.

---

# Upgrading from modeler 0.x

The modeler 1.x API is NOT backwards compatible with 0.x. Please be advised of the
following changes when upgrading to the 1.x API:

- `created` / `updated` dates no longer maintained
- `rev` no longer maintained or tracked
- `create()` no longer necessary to call
- Insertion order is no longer guaranteed
- User-defined hooks are now defined in 'hooks' key of collection options
- Removed `list()` method from API
- Engine plugin API has changed - see `memory.js` in core for an example
- User can now pass options directly to engine for all methods
- `.list({load: true})` no longer needed (full object always returned)
- `head()` and `tail()` arguments only consist of options now (no more limit as first arg)
- save-only and engine-only properties no longer supported

## New features in 1.x:

- streaming for all methods
- the options that you pass to modeler now *become* the collection object, and can
  override core or engine or add new methods
- `id` attribute now configurable
- custom ids through `newId` function
- "is new" detection can be manually overridden per save using `isNew` option
- user-defined hook methods now accessible on `collection.hooks.{hook}`
- new ids default to 16 bytes of psuedo-random base64url-encoded data (22 characters)
- planned - password-based encryption

- - -

### Developed by [Terra Eclipse](http://www.terraeclipse.com)
Terra Eclipse, Inc. is a nationally recognized political technology and
strategy firm located in Aptos, CA and Washington, D.C.

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
