import typeDefs from '../src/typeDefs'
import resolvers from '../src/resolvers'
import { ApolloServer } from 'apollo-server'
import { createTestClient } from 'apollo-server-testing'
import { doc as docClient } from '../src/dynamodb'
import { Chest } from '../src/crypto'
import { promises as fs, constants as fsConstants } from 'fs'

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    return {
      db: docClient,
      ledger: 'AAAA'
    }
  }
})

const { query, mutate } = createTestClient(server)

const keyFile = './tests/test.keys'

describe('GraphQL', () => {
  const chest = new Chest()
  // Registration mutation:
  const REGISTER = `
    mutation ($key: String!, $proof: String!) {
      register(key: $key, proof: $proof)
    }
  `
  // Challenge query:
  const CHALLENGE = `
    {
      challenge
    }
  `
  // Bugfix, see: https://github.com/openpgpjs/openpgpjs/issues/1036
  const oldTextEncoder = global.TextEncoder
  const oldTextDecoder = global.TextDecoder

  beforeAll(async () => {
    const textEncoding = require('text-encoding-utf-8')
    global.TextEncoder = textEncoding.TextEncoder
    global.TextDecoder = textEncoding.TextDecoder
    // read test keys file is it exists
    await fs.access(keyFile, fsConstants.R_OK).then(() => chest.loadKeysFromFile(keyFile))
    return chest.init({ name: 'Test', email: 'test@test.com' })
  })

  afterAll(() => {
    global.TextEncoder = oldTextEncoder
    global.TextDecoder = oldTextDecoder
    // write keys file if it doesn't exist yet
    return fs.access(keyFile, fsConstants.R_OK).catch(() => chest.writeKeysToFile(keyFile))
  })
  // end bugfix

  it('should say hello', async () => {
    const SAY_HELLO = `
  {
    hello
  }
  `
    expect.assertions(2)
    const result = await query({ query: SAY_HELLO })
    expect(result.errors).toBe(undefined)
    expect(result.data).toEqual({ 'hello': 'Hello, world!' })
  })

  it('should have loaded keys', async () => {
    expect.assertions(3)
    expect(chest.initialized).toBe(true)
    expect(chest.key).toBeDefined()
    expect(chest.key.publicKeyArmored).toBeDefined()
  })

  it('should reject bad proof during registration', async () => {
    expect.assertions(4)
    const BAD_KEY = await mutate({
      mutation: REGISTER,
      variables: {
        key: 'NOT A KEY',
        proof: 'foobar'
      }
    })
    expect(BAD_KEY.errors).toBeDefined()
    expect(BAD_KEY.errors[0].message).toEqual('Error: Misformed armored text')

    const BAD_PROOF = await mutate({
      mutation: REGISTER,
      variables: {
        key: chest.key.publicKeyArmored,
        proof: 'foobar'
      }
    })
    expect(BAD_PROOF.errors).toBeDefined()
    expect(BAD_PROOF.errors[0].message).toEqual('Error: Misformed armored text')
  })

  it('should register a public key as a new ledger', async () => {
    expect.assertions(3)
    const { data } = await query({ query: CHALLENGE })
    expect(data).toEqual({ 'challenge': 'This is my key, verify me' })
    const result = await mutate({
      mutation: REGISTER,
      variables: {
        key: chest.key.publicKeyArmored,
        proof: await chest.sign(data.challenge)
      }
    })
    expect(result.errors).toBe(undefined)
    expect(result.data).toEqual({ 'register': chest.fingerprint })
  })
})
