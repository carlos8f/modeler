modeler
=======

simple entity system using a functional approach

[![build status](https://secure.travis-ci.org/carlos8f/modeler.png)](http://travis-ci.org/carlos8f/modeler)

## Idea

Some "object-relational mapping systems" and try to do everything, and in doing
so become a huge steaming heap of shit that no one can figure out. They typically
encourage the developer to become lazy and wasteful by baiting them with magically
automatic cascading loaders weighed down by a hidden army of expensive hooks and subqueries.
"getters" and "setters" abound, obfuscating and polluting the data structure and making it
difficult to just find out what a model holds. And increasingly, ORMs are focused
on a single database technology (SQL-only or MongoDB-only) and therefore make
your code unportable by association.

A `modeler` model, on the other hand, is simply an object literal. Its companion
is a "collection" object, another object literal containing a set of functions
which load, save, list, and destroy models. Collections are very easily
extendible to work with any data store or external API, by simply overriding
these functions.

`modeler` might be for you if:

- you need a quick, schema-less way of storing relational, time series, or
  configuration data
- you'd prefer the portability and debuggability of object literals over
  prototype-based instances
- you'd like to use an external API such as Twitter as a data store
- you'd like to load a model from one store and save it in another
- you want an ORM for some new trendy database, but can't find one. Implement
  4 functions and `modeler` core will do the rest.

## Features

- simple, extensible core
- "tailable" collections - easily fetch the latest data
- instant [string-based IDs](https://github.com/carlos8f/node-idgen), available
  before saving
- create, save, load, and destroy hooks
- hooks let you trigger your own events, provide defaults, alter models, and
  perform validation

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
