#!/usr/bin/env node

import inquirer from 'inquirer'
import log from 'loglevel'
import { ApolloClient, InMemoryCache } from '@apollo/client/core'
import { ManiClient } from '../client/ManiClient'
import KeyStorage from './keystorage'
import { mani } from '../mani'

global.fetch = require('node-fetch')

log.setLevel('info')

/**
 * FOR DEMONSTRATION PURPOSES ONLY.
 */
console.log('FOR DEMONSTRATION PURPOSES ONLY. WILL NOT WORK WITH (SECURED) SUMSY ENDPOINTS, ONLY WITH OFFLINE (LOCALHOST) INSTANCES.')

async function cli () {
  const { uri } = await inquirer.prompt([{
    type: 'input',
    name: 'uri',
    message: 'URI of mani pona endpoint',
    default: 'http://localhost:3000/dev/graphql'
  }])
  const keyStore = KeyStorage()
  const context = (() => {
    let ledger = ''
    return {
      setLedger (l) {
        ledger = l
      },
      provider () {
        return {
          headers: {
            'x-claims': JSON.stringify({ sub: ledger, verified: true, admin: true })
          }
        }
      }
    }
  })()
  const graphqlClient = new ApolloClient({ uri, cache: new InMemoryCache() })
  const client = await ManiClient({ graphqlClient, keyStore, contextProvider: context.provider })
  context.setLedger(client.id)
  log.info(`Initialized with ledger ${client.id}`)
  const alias = await client.find(client.id)
  const parameters = await client.system.parameters()
  if (parameters) {
    console.log(`SuMSy running with income of ${parameters.income.format()} and ${parameters.demurrage}% demurrage.`)
  } else {
    console.log(`Initializing SuMSy`)
    const init = await client.admin.init()
    console.log(init)
  }
  async function pendingLoop () {
    const pending = await client.transactions.pending()
    if (pending) {
      // log.info(`Pending transaction: ${JSON.stringify(pending)}`)
      if (pending.destination === 'system') {
        // these can't be cancelled
        log.info(`A Jubilee occurred: ${pending.demurrage.format()} demurrage and ${pending.income.format()} income is automatically confirmed`)
        await client.transactions.confirm(pending.challenge)
      } else {
        // log.info(`Pending transaction: ${JSON.stringify(pending, null, 2)}`)
        if (pending.toSign) {
          const { confirmation } = await inquirer.prompt({
            type: 'confirm',
            name: 'confirmation',
            message: `A transaction of ${pending.amount.format()} was initiated by ledger ${pending.destination}, do you accept?`,
            default: true
          })
          if (confirmation) {
            await client.transactions.confirm(pending.challenge)
          } else {
            await client.transactions.cancel(pending.challenge)
          }
          return true
        } else {
          const { cancel } = await inquirer.prompt({
            type: 'confirm',
            name: 'cancel',
            message: `You have a transaction pending (${pending.amount.format()}), waiting for confirmation by ledger ${pending.destination}, do you wish to cancel?`,
            default: false
          })
          if (cancel) {
            await client.transactions.cancel(pending.challenge)
            return true
          } else {
            return false
          }
        }
      }
    } else {
      log.info('No pending transactions')
      return true
    }
  }
  async function createTransaction () {
    const { destination } = await inquirer.prompt({ type: 'input', message: 'Please provide the destination ledger:', name: 'destination' })
    if (destination) {
      let { amount } = await inquirer.prompt({ type: 'number', message: 'Please provide an amount:', name: 'amount' })
      if (amount) {
        amount = mani(amount)
        const challenge = await client.transactions.challenge(destination, amount)
        await client.transactions.create(challenge)
        log.info(`Transaction is pending`)
      }
    }
  }
  async function promptLoop () {
    const { command } = await inquirer.prompt([{
      type: 'list',
      name: 'command',
      message: 'What would you like to do next?',
      choices: [
        { name: 'Create new transaction (n)', value: 'new', short: 'n' },
        { name: 'Check pending transactions (p)', value: 'pending', short: 'p' },
        { name: 'Current account balance (c)', value: 'current', short: 'c' },
        { name: 'Execute jubilee (j)', value: 'jubilee', short: 'j' },
        { name: 'Exit (x)', value: 'exit', short: 'x' }
      ]
    }])
    switch (command) {
      case 'new':
        const nopending = await pendingLoop()
        if (nopending) await createTransaction()
        break
      case 'pending':
        await pendingLoop()
        break
      case 'current':
        await pendingLoop()
        const current = await client.transactions.current()
        console.log(`Your current account balance is ${current.balance.format()} (last updated: ${current.date.toLocaleString('nl-BE')})`)
        break
      case 'jubilee':
        const possible = await pendingLoop()
        if (possible) {
          const jubilee = await client.admin.jubilee()
          console.log(`Deducted ${jubilee.demurrage.format()} demurrage and added ${jubilee.income.format()} total to ${jubilee.ledgers} ledgers`)
        }
        break
      case 'exit':
        log.info('Exiting the client, goodbye')
        process.exit()
    }
    return promptLoop()
  }
  if (alias) {
    console.log(`Welcome back, ${alias}`)
    await promptLoop()
  } else {
    const { alias } = await inquirer.prompt({
      type: 'input',
      name: 'alias',
      default: 'Mr. Robot',
      message: 'Please provide an alias' })
    const fingerprint = await client.register(alias)
    log.info(`Succesfully registered ledger ${fingerprint}`)
    await promptLoop()
  }
}

cli().catch(console.error)
