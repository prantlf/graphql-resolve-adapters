# graphql-resolve-adapters

[![NPM version](https://badge.fury.io/js/graphql-resolve-adapters.png)](http://badge.fury.io/js/graphql-resolve-adapters)
[![Build Status](https://travis-ci.org/prantlf/graphql-resolve-adapters.png)](https://travis-ci.org/prantlf/graphql-resolve-adapters)
[![Coverage Status](https://coveralls.io/repos/github/prantlf/graphql-resolve-adapters/badge.svg?branch=master)](https://coveralls.io/github/prantlf/graphql-resolve-adapters?branch=master)
[![Maintainability](https://api.codeclimate.com/v1/badges/1e5c6e1dd2aa0533d8c6/maintainability)](https://codeclimate.com/github/prantlf/graphql-resolve-adapters/maintainability)
[![codebeat badge](https://codebeat.co/badges/06b7a3d1-3a39-4204-b829-e682169f2e98)](https://codebeat.co/projects/github-com-prantlf-graphql-resolve-adapters-master)
[![devDependency Status](https://david-dm.org/prantlf/graphql-resolve-adapters/dev-status.svg)](https://david-dm.org/prantlf/graphql-resolve-adapters#info=devDependencies)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

[![NPM Downloads](https://nodei.co/npm/graphql-resolve-adapters.png?downloads=true&stars=true)](https://www.npmjs.com/package/graphql-resolve-adapters)

Hooks into GraphQL field execution like Express middleware in a chained way. It can be used for validation or transformation of the resulting field values.

## Synopsis

```js
const { adaptFieldResolver } = require('graphql-resolve-adapters')

// Stores durations of each field execution in milliseconds.
const durations = {}
function computeDurations(resolve, source, args, context, info) {
  const start = process.hrtime()
  const result = await resolve()
  const duration = process.hrtime(start)
  durations[info.fieldName] = duration[0] * 1000 + duration[1] / 1000000
  return result
}

// A GraphQL schema computing durations of each field execution.
const schema = ...
const resolveAdapters = [computeDurations]
visitFields(schema, field => adaptFieldResolver(field, resolveAdapters))

// Run the query and print the results with field execution durations.
const response = graphql(schema, '{ ... }')
console.log(response, durations)
```

## Installation

This module can be installed in your project using [NPM] or [Yarn]. Make sure, that you use [Node.js] version 8 or newer.

```sh
$ npm i graphql-resolve-adapters -S
```

```sh
$ yarn add graphql-resolve-adapters
```

## Description

### Field Resolve Adapter

A field resolve adapter is a function with almost the same prototype as the usual `resolve` method, only with an additional first parameter - the next resolver to perform or not:

    fieldResolveAdapter(resolve, source, args, context, info)

The `resolve` parameter allows calling the next resolver in chain to inspect or modify its result. The last resolver in the chain is the original field `resolve` method or the default one.

```js
function validate(resolve, source, args, context, info) {
  const result = await resolve()
  if (!result) {
    throw new Error(`The field "${info.fieldName}" was not truthy.`)
  }
  return result
}

function toLowerCase(resolve, source, args, context, info) {
  const result = await resolve()
  return result.toLowerCase()
}
```

### adaptFieldResolver(field, schema)

Enables hooking into the field execution by a a chain of `resolve` method adapters for the specified field.

* `field` has to be a field configuration object
* `schema` has to be an object instance of the type `GraphQLSchema`

Field configurations are usually obtained from a schema by a field visitor like [graphql-field-visitor], for example.

```js
const { adaptFieldResolver } = require('graphql-resolve-adapters')
const { visitFields } = require('graphql-field-visitor')

const schema =  ...
const resolveAdapters = [validate, toLowerCase]
visitFields(schema, field => adaptFieldResolver(field, schema))
```

If multiple resolve adapters are provided, they will be chained. The last one will be called and its value will be set to the field. The others in the chain may be called depending on their implementations. The first one in the chain is the original field `resolve` method.

## Contributing

In lieu of a formal styleguide, take care to maintain the existing coding style.  Add unit tests for any new or changed functionality. Lint and test your code using Grunt.

## Release History

* 2019-08-18   v0.0.1   Initial release

## License

Copyright (c) 2019 Ferdinand Prantl

Licensed under the MIT license.

[Node.js]: http://nodejs.org/
[NPM]: https://www.npmjs.com/
[Yarn]: https://yarnpkg.com/
[graphql-field-visitor]: https://github.com/prantlf/graphql-field-visitor
