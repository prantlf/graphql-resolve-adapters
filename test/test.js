const { graphql, GraphQLSchema, GraphQLObjectType, GraphQLBoolean } = require('graphql')
const { visitFields } = require('graphql-field-visitor')
const { adaptFieldResolver } = require('..')
const test = require('ava')

const falsy = { type: GraphQLBoolean }

const truthy = {
  type: GraphQLBoolean,
  resolve: () => true
}

async function isFalsy (resolve) {
  const result = await resolve()
  if (result) {
    throw new Error('failure')
  }
  return result
}

async function isTruthy (resolve) {
  const result = await resolve()
  if (!result) {
    throw new Error('failure')
  }
  return result
}

async function negate (resolve) {
  const result = await resolve()
  return !result
}

function createSchema (fields) {
  const schema = new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: () => fields
    })
  })
  return schema
}

function adaptFieldResolvers (schema, resolveAdapters) {
  visitFields(schema, field => adaptFieldResolver(field, resolveAdapters))
}

function collectFields (schema) {
  const fields = []
  visitFields(schema, field => fields.push(field))
  return fields
}

test('adaptFieldResolver is a function', test =>
  test.is(typeof adaptFieldResolver, 'function'))

test('adaptFieldResolver sets field resolvers', test => {
  const schema = createSchema({ truthy })
  adaptFieldResolvers(schema, [isTruthy])
  const fields = collectFields(schema)
  fields.forEach(field => test.is(typeof field.resolve, 'function'))
})

test('adapters can change the field execution result', async test => {
  const schema = createSchema({ truthy })
  adaptFieldResolvers(schema, [negate])
  const { data, errors } = await graphql(schema, '{ truthy }')
  test.is(typeof errors, 'undefined')
  test.is(data.truthy, false)
})

test('adapters can be chained computing the final result', async test => {
  const schema = createSchema({ truthy })
  adaptFieldResolvers(schema, [isTruthy, negate])
  const { data, errors } = await graphql(schema, '{ truthy }')
  test.is(typeof errors, 'undefined')
  test.is(data.truthy, false)
})

test('adapters throwing an error fail the field execution', async test => {
  const schema = createSchema({ falsy })
  adaptFieldResolvers(schema, [isTruthy])
  const { errors } = await graphql(schema, '{ falsy }')
  test.is(typeof errors, 'object')
  test.is(errors.length, 1)
  test.is(errors[0].message, 'failure')
})

test('adapters can be added to fields without resolvers', async test => {
  const schema = createSchema({ falsy })
  adaptFieldResolvers(schema, [isFalsy])
  const { data, errors } = await graphql(schema, '{ falsy }')
  test.is(typeof errors, 'undefined')
  test.is(data.falsy, null)
})
