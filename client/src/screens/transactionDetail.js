import React from 'react'
import { View, Text } from 'react-native'
import mani from '../../shared/mani'
import { globalStyles } from '../styles/global'
import Card from '../shared/card'
import { Contact } from '../shared/contact'

export default function TransactionHitstory ({ route }) {
  const { transaction } = route.params

  return (
    <View style={globalStyles.main}>
      <Card>
        <Text style={globalStyles.property}>Contact:</Text>
        <Contact style={globalStyles.price} ledger={transaction.destination} />
      </Card>
      <Card>
        <Text style={globalStyles.property}>Mededeling:</Text>
        <Text style={globalStyles.price}>{transaction.msg}</Text>
      </Card>
      <Card>
        <Text style={globalStyles.property}>Bedrag:</Text>
        <Text style={globalStyles.price}>{transaction.amount.format()}</Text>
      </Card>
      <Card>
        <Text style={globalStyles.property}>Datum:</Text>
        <Text style={globalStyles.price}>
          {new Date(transaction.date).toLocaleString()}
        </Text>
      </Card>
    </View>
  )
}
