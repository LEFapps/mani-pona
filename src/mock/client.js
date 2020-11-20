import { _ } from 'lodash'
import ManiError from '../ManiError'

const mockNotifications = [
  {
    type: 'generic',
    msg: 'Ledger has been approved',
    confirm: _.noop
  },
  {
    type: 'income',
    msg: 'Income received',
    amount: 100,
    confirm: _.noop
  },
  {
    type: 'demurrage',
    msg: 'Demurrage aplied',
    amount: -12.5,
    confirm: _.noop
  }
]

class MockClient {
  constructor ({ fail }) {
    this.balance = 1000.0
    this._transactions = []
    this._notifications = mockNotifications
    this.fail = fail
    // this.timeout = 30 // ms

    // _.assign(this, options)
  }

  get notifications () {
    return {
      all: () => new Promise((resolve) => {
        resolve(this._notifications)
      })
    }
  }

  get transactions () {
    return {
      all: () => new Promise((resolve) => {
        resolve(this._transactions)
      }),
      create: ({ peerId, amount }) => new Promise((resolve, reject) => {
        if (peerId !== 'mock') {
          reject(new ManiError(`Unknown peerId ${peerId}`))
        } else if (!_.isNumber(amount)) {
          reject(new ManiError('Unsupported: no amount specified'))
        } else if (this.fail === 'timeout') {
          reject(new ManiError('Transaction timed out'))
        } else {
          resolve({
            message: 'Transaction succesfull',
            amount: amount
          })
        }
      }),
      listen: () => new Promise((resolve, reject) => {
        if (this.fail === 'timeout') {
          reject(new ManiError('Transaction timed out'))
        } else {
          resolve({
            message: 'Please confirm transaction',
            amount: 7.5
          })
        }
      })
    }
  }
}

export default MockClient
/*
mockClient ({ notifications }) {
  // const notif = _.filter(mock_notifications, (n) => { _.includes(notifications, n) })
  return new MockClient()
}
*/
