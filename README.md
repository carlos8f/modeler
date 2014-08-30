modeler
=======

A simple and fun data API to rule them all

[![build status](https://secure.travis-ci.org/carlos8f/modeler.png)](http://travis-ci.org/carlos8f/modeler)

## Introducing modeler

In the old days, most apps used MySQL, and pretty much everyone wrote MySQL queries
in their code directly, which seemed fine at the time.

Now, we have all these crazy things like MongoDB, Redis, LevelDB, etc.
which each have their own quirks, APIs, and capabilities. We realized that writing
queries directly into our apps not only marries us to the DB implementation,
but tends to create ugly, hard-to-maintain code. We might write a one-off abstraction
layer for this or that, but then we have more headaches when it comes time to
unify and reuse.

Modeler is intended to make data fun again, by uniting all the backends under
one elegant API.

Also, if you're using some new database no one has heard about yet, don't dispair --
implementing a driver is as simple as writing 4 functions!

### Features

- Database agnostic!
- CRUD (Create, Read, Update, Delete) and iteration!
- Ultra simple! Not much to remember!
- No object-oriented crap!
- Streaming!
- `tail` and `head` your collection, just like unix!
- User-defined hooks!
- Ready-to-use adapters for Redis, LevelDB, and others!

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

A "model" or "entity" in modelerspeak is simply an object literal. No prototypes,
no getters, no setters, nothing out of the ordinary.

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
pattern `[a-zA-Z0-9-_]{16}`. This behavior can be overridden (please see the options
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
    id: 'MMUMInV-6nNVw3I3oUmjTw'  <--- auto generated
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

## API

`modeler([options])`:

Returns: collection object

Options:

- `idAttribute` - string
- `newId` - function
- `hooks` - object

---

`collection.save([attrs], [options], [cb])`



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
