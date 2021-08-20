import { ApolloError } from 'apollo-server'
import { getLogger } from 'server-log'

const log = getLogger('graphql:resolvers')

/**
 * Since Apollo Server has its own ideas about error logging, we intercept them early.
 * This function wraps an asynchronous function that might throw an error.
 */
const wrap = (fn) => {
  return async (...args) => {
    try {
      return await fn(...args)
    } catch (err) {
      log.error('Error while executing async fn')
      log.error(err)
      log.error(JSON.stringify(err, null, 2))
      throw new ApolloError(err)
    }
  }
}

const wrapSync = (fn) => {
  return (...args) => {
    try {
      return fn(...args)
    } catch (err) {
      log.error('Error while executing fn', err)
      throw new ApolloError(err)
    }
  }
}

export { wrap, wrapSync }
