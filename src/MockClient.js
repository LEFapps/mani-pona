import { _ } from 'lodash'
import ManiError from './ManiError'
import MANI from './currency'

const mockNotifications = [
  {
    type: 'generic',
    msg: 'Ledger has been approved',
    confirm: _.noop,
    date: new Date('2020-10-14 08:05:17')
  },
  {
    type: 'demurrage',
    msg: 'Demurrage aplied',
    amount: MANI(-7.1),
    date: new Date('2020-11-03 10:07:38'),
    confirm: _.noop
  },
  {
    type: 'income',
    msg: 'Income received',
    amount: MANI(100),
    date: new Date('2020-11-03 10:07:39'),
    confirm: _.noop
  }
]

const mockTransactions = [
  {
    msg: 'Account created',
    amount: MANI(100),
    date: new Date('2020-10-04 08:04:21')
  },
  {
    msg: 'Coffee and a bagel',
    amount: MANI(-4),
    date: new Date('2020-10-07 16:21:35'),
    peer: ''
  },
  {
    msg: 'Yoga class',
    amount: MANI(-25),
    date: new Date('2020-10-10 19:01:53'),
    peer: ''
  },
  {
    msg: 'Demurrage applied',
    amount: MANI(-7.1),
    date: new Date('2020-11-03 10:07:38')
  },
  {
    msg: 'Income received',
    amount: MANI(100),
    date: new Date('2020-11-03 10:07:39')
  }
]

class MockClient {
  constructor ({ fail }) {
    this.balance = MANI(163.9)
    this._transactions = mockTransactions
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
        if (this.fail === 'unknown_id') {
          reject(new ManiError(`Unknown peerId ${peerId}`))
        } else if (!_.isNumber(amount)) {
          reject(new ManiError('Unsupported: no amount specified'))
        } else if (this.fail === 'timeout') {
          reject(new ManiError('Transaction timed out'))
        } else {
          resolve({
            message: 'Transaction succesfull',
            amount: MANI(amount)
          })
        }
      }),
      listen: () => new Promise((resolve, reject) => {
        if (this.fail === 'timeout') {
          reject(new ManiError('Transaction timed out'))
        } else {
          resolve({
            message: 'Please confirm transaction',
            amount: MANI(7.5)
          })
        }
      })
    }
  }
}

export default MockClient
