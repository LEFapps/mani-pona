#!/usr/bin/env node

const inquirer = require('inquirer')
const { ApolloClient } = require('@apollo/client/core')

/**
 * FOR DEMONSTRATION PURPOSES.
 */

inquirer.prompt([{
  type: 'input',
  name: 'uri',
  message: 'URI of mani pona endpoint',
  default: 'http://localhost:8080'
}])
  .then(answer => {
    console.log(answer.uri)
    const ManiClient = require('../client/ManiClient')
  })
