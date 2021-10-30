import _ from 'lodash'
import ManiError from './helpers/error'
import mani from './shared/mani'

const frequencies = {
  DAGELIJKS: 'dagelijks',
  WEKELIJKS: 'wekelijks',
  MAANDELIJKS: 'maandelijks'
}

const mockStandingOrders = [
  {
    standingOrderId: 0,
    contactId: '',
    amount: mani(302.2),
    endDate: new Date('2021-03-13'),
    frequency: frequencies.MAANDELIJKS,
    msg: 'Een maandelijkse betalingsopdracht'
  },
  {
    standingOrderId: 1,
    contactId: 3,
    amount: mani(50),
    endDate: new Date('2021-10-24'),
    frequency: frequencies.WEKELIJKS,
    msg: 'Een maandelijkse betalingsopdracht'
  },
  {
    standingOrderId: 2,
    contactId: 0,
    amount: mani(100.99),
    endDate: new Date('2021-01-15'),
    frequency: frequencies.DAGELIJKS,
    msg: 'Een maandelijkse betalingsopdracht'
  }
]

const mockSystemConfiguration = {
  demurage: {
    totalDemurage: mani(-600),
    tiers: [
      {
        tierId: 0,
        start: mani(2000),
        end: mani(4000),
        percentage: 5,
        contribution: mani(100)
      },
      {
        tierId: 1,
        start: mani(4000),
        end: mani(6000),
        percentage: 10,
        contribution: mani(200)
      },
      {
        tierId: 2,
        start: mani(6000),
        end: mani(8000),
        percentage: 15,
        contribution: mani(300)
      }
    ]
  },
  incomePrediction: {
    currentPrediction: mani(2000),
    predictions: [
      { month: 1, income: mani(2020) },
      { month: 1, income: mani(1200) },
      { month: 1, income: mani(1040) },
      { month: 1, income: mani(2530) },
      { month: 1, income: mani(1420) },
      { month: 1, income: mani(2010) },
      { month: 1, income: mani(3010) },
      { month: 1, income: mani(1500) },
      { month: 1, income: mani(1340) },
      { month: 1, income: mani(2200) },
      { month: 1, income: mani(2100) },
      { month: 1, income: mani(3000) }
    ]
  }
}

const mockIssuedBuffers = [
  {
    issuedBufferId: 0,
    contactId: '',
    amount: mani(554),
    endDate: new Date('2021-01-15')
  },
  {
    issuedBufferId: 2,
    contactId: 0,
    beneficiary: 'Spar Lichtervelde',
    amount: mani(6431),
    endDate: new Date('2021-10-24')
  },
  {
    issuedBufferId: 3,
    contactId: 2,
    beneficiary: 'Spar Lichterveldel',
    amount: mani(31),
    endDate: new Date('2021-03-13')
  }
]

const mockDemurageHistory = [
  {
    demurageId: 0,
    amount: mani(-7.1),
    date: new Date('2020-11-03')
  },
  {
    demurageId: 1,
    amount: mani(-10),
    date: new Date('2020-12-03')
  }
]

const mockTransactions = [
  {
    transactionId: 0,
    contactId: '',
    msg: 'Account aangemaakt',
    amount: mani(100),
    date: new Date('04 Oct 2020 08:04:21 GMT')
  },
  {
    transactionId: 1,
    contactId: 2,
    msg: 'Koffie en een bagel',
    amount: mani(-4),
    date: new Date('07 Oct 2020 16:21:35 GMT'),
    peer: ''
  },
  {
    transactionId: 2,
    contactId: 1,
    msg: 'Yoga klas',
    amount: mani(-25),
    date: new Date('10 Oct 2020 19:01:53 GMT'),
    peer: ''
  },
  {
    transactionId: 3,
    contactId: 3,
    msg: 'Gemeenschapsbijdrage toegepast',
    amount: mani(-7.1),
    date: new Date('03 Nov 2020 10:07:38 GMT')
  },
  {
    transactionId: 4,
    contactId: 3,
    msg: 'Gemeenschapsbijdrage toegepast',
    amount: mani(-10),
    date: new Date('03 Dec 2020 10:07:38 GMT')
  },
  {
    transactionId: 5,
    contactId: 0,
    msg: 'Inkomen ontvangen',
    amount: mani(100),
    date: new Date('03 Nov 2020 10:07:38 GMT')
  }
]

const mockContacts = [
  {
    contactId: 0,
    name: 'Bram',
    peerId: 'test_D0C8F0D0032C95F667C46469D05C6EACD4461A3E6DC69C537379649C226'
  },
  {
    contactId: 1,
    name: 'Arno',
    peerId: 'test_D0C8F0D0032C95F667C46469D05C6EACD4461A3E6DC69C537379649C227'
  },
  {
    contactId: 2,
    name: 'Tom',
    peerId: 'test_D0C8F0D0032C95F667C46469D05C6EACD4461A3E6DC69C537379649C228'
  },
  {
    contactId: 3,
    name: 'LoREco',
    peerId: 'test_D0C8F0D0032C95F667C46469D05C6EACD4461A3E6DC69C537379649C229'
  }
]

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
    amount: mani(-7.1),
    date: new Date('2020-11-03 10:07:38'),
    confirm: _.noop
  },
  {
    type: 'demurrage',
    msg: 'Gemeenschapsbijdrage toegepast',
    amount: mani(-10),
    date: new Date('03 Dec 2020 10:07:38 GMT'),
    confirm: _.noop
  },
  {
    type: 'income',
    msg: 'Income received',
    amount: mani(100),
    date: new Date('2020-11-03 10:07:39'),
    confirm: _.noop
  }
]

class MockClient {
  constructor ({ fail }) {
    this.balance = mani(163.9)
    this._transactions = mockTransactions
    this._notifications = mockNotifications
    this._standingOrders = mockStandingOrders
    this._demurageHistory = mockDemurageHistory
    this._issuedBuffers = mockIssuedBuffers
    this._contacts = mockContacts
    this._systemConfiguration = mockSystemConfiguration

    this.fail = fail
    // this.timeout = 30 // ms

    // _.assign(this, options)
  }

  get demurageHistory () {
    return {
      all: () =>
        new Promise(resolve => {
          resolve(this._demurageHistory)
        })
    }
  }

  get contacts () {
    return {
      all: () =>
        new Promise(resolve => {
          resolve(this._contacts)
        })
    }
  }

  get standingOrders () {
    return {
      all: () =>
        new Promise(resolve => {
          resolve(this._standingOrders)
        })
    }
  }

  get issuedBuffers () {
    return {
      all: () =>
        new Promise(resolve => {
          resolve(this._issuedBuffers)
        })
    }
  }

  get systemConfiguration () {
    return {
      demurage: () =>
        new Promise(resolve => {
          resolve(this._systemConfiguration.demurage)
        }),
      incomePrediction: () =>
        new Promise(resolve => {
          resolve(this._systemConfiguration.incomePrediction)
        })
    }
  }

  get notifications () {
    return {
      all: () =>
        new Promise(resolve => {
          resolve(this._notifications)
        })
    }
  }

  get transactions () {
    return {
      all: () =>
        new Promise(resolve => {
          resolve(this._transactions)
        }),
      create: ({ peerId, amount }) =>
        new Promise((resolve, reject) => {
          if (this.fail === 'unknown_id') {
            reject(new ManiError(`Unknown peerId ${peerId}`))
          } else if (!_.isNumber(amount)) {
            reject(new ManiError('Unsupported: no amount specified'))
          } else if (this.fail === 'timeout') {
            reject(new ManiError('Transaction timed out'))
          } else {
            resolve({
              message: 'Transaction succesfull',
              amount: mani(amount)
            })
          }
        }),
      listen: () =>
        new Promise((resolve, reject) => {
          if (this.fail === 'timeout') {
            reject(new ManiError('Transaction timed out'))
          } else {
            resolve({
              message: 'Please confirm transaction',
              amount: mani(7.5)
            })
          }
        })
    }
  }
}

export default MockClient
