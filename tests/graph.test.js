import typeDefs from '../src/typeDefs'
import resolvers from '../src/resolvers'
import { ApolloServer } from 'apollo-server'
import { createTestClient } from 'apollo-server-testing'
import { DynamoPlus } from 'dynamo-plus'
import { KeyLoader, KeyGenerator } from '../src/crypto'
import { promises as fs, constants as fsConstants } from 'fs'

const keyFile = './tests/test.keys'

describe('GraphQL', () => {
  const keys = KeyLoader('./tests/test.keys')

  let server, query, mutate
  // Registration mutation:
  const REGISTER = `
    mutation ($registration: LedgerRegistration!) {
      register(registration: $registration) {
        ledger
        alias
      }
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

  beforeAll(() => {
    server = new ApolloServer({
      typeDefs,
      resolvers,
      context: async ({ req }) => {
        return {
          db: DynamoPlus({
            region: 'localhost',
            endpoint: 'http://localhost:8000'
          }),
          ledger: 'AAAA'
        }
      }
    });
    ({ query, mutate } = createTestClient(server))
    const textEncoding = require('text-encoding-utf-8')
    global.TextEncoder = textEncoding.TextEncoder
    global.TextDecoder = textEncoding.TextDecoder
    // read test keys file is it exists
    // await fs.access(keyFile, fsConstants.R_OK).then(() => chest.loadKeysFromFile(keyFile))
    // return chest.init({ name: 'Test', email: 'test@test.com' })
  })

  afterAll(() => {
    global.TextEncoder = oldTextEncoder
    global.TextDecoder = oldTextDecoder
    // write keys file if it doesn't exist yet
    // return fs.access(keyFile, fsConstants.R_OK).catch(() => chest.writeKeysToFile(keyFile))
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

  it('should reject bad proof during registration', async () => {
    expect.assertions(4)
    const BAD_KEY = await mutate({
      mutation: REGISTER,
      variables: {
        registration: {
          publicKey: 'NOT A KEY',
          alias: 'Oops',
          proof: 'foobar'
        }
      }
    })
    expect(BAD_KEY.errors).toBeDefined()
    expect(BAD_KEY.errors[0].message).toEqual('Error: Misformed armored text')

    const BAD_PROOF = await mutate({
      mutation: REGISTER,
      variables: {
        registration: {
          publicKey: keys.publicKeyArmored,
          alias: 'Sorry',
          proof: 'foobar'
        }
      }
    })
    expect(BAD_PROOF.errors).toBeDefined()
    expect(BAD_PROOF.errors[0].message).toEqual('Error: Misformed armored text')
  })

  it('should register a public key as a new ledger', async () => {
    const newKeys = await KeyGenerator().generate()
    const fingerprint = await newKeys.publicKey.fingerprint()
    const alias = 'Firstname Lastname'
    expect.assertions(5)
    const { data } = await query({ query: CHALLENGE })
    expect(data).toEqual({ 'challenge': 'This is my key, verify me' })
    const result = await mutate({
      mutation: REGISTER,
      variables: {
        registration: {
          publicKey: newKeys.publicKeyArmored,
          alias,
          proof: await newKeys.privateKey.sign(data.challenge)
        }
      }
    })
    expect(result.errors).toBe(undefined)
    expect(result.data).toEqual({ 'register': {
      ledger: fingerprint,
      alias
    } })

    const verification = await query({
      query: `
        query findkey ($id: String!) {
          findkey(id: $id) {
            alias
            publicKey
          }
        }
      `,
      variables: { id: fingerprint } })
    expect(verification.errors).toBe(undefined)
    expect(verification.data).toEqual({ 'findkey': {
      alias,
      publicKey: newKeys.publicKeyArmored
    } })
  })
})
