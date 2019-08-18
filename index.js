const { defaultFieldResolver } = require('graphql')

function wrapResolve (resolve, source, args, context, info) {
  return async () => {
    try {
      const result = await resolve(source, args, context, info)
      return result
    } catch (error) {
      /* istanbul ignore next */
      return Promise.reject(error)
    }
  }
}

function wrapResolveAdapter (resolve, nextResolver, source, args, context, info) {
  return async () => {
    try {
      const result = await resolve(nextResolver, source, args, context, info)
      return result
    } catch (error) {
      return Promise.reject(error)
    }
  }
}

function chainResolverAdapters (resolveAdapters, originalResolve, source, args, context, info) {
  const firstResolver = wrapResolve(originalResolve, source, args, context, info)
  return resolveAdapters.reduce((nextResolver, resolveAdapter) =>
    wrapResolveAdapter(resolveAdapter, nextResolver, source, args, context, info),
  firstResolver)
}

function createFieldResolver (resolveAdapters, originalResolve) {
  return (source, args, context, info) => {
    const resolve = chainResolverAdapters(
      resolveAdapters, originalResolve, source, args, context, info)
    return resolve()
  }
}

function adaptFieldResolver (field, resolveAdapters) {
  const originalResolve = field.resolve || defaultFieldResolver
  field.resolve = createFieldResolver(resolveAdapters, originalResolve)
}

module.exports = { adaptFieldResolver }
