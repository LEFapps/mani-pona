import React from 'react'
import { Text, ScrollView } from 'react-native'
import { globalStyles } from '../styles/global'
import Card from '../shared/card'
import { Contact } from '../shared/contact'

export default function TransactionHitstory ({ route }) {
  const { transaction } = route.params

  return (
    <ScrollView style={globalStyles.main}>
      <Card>
        <Text style={globalStyles.property}>Contact:</Text>
        <Contact style={globalStyles.price} ledger={transaction.destination} />
      </Card>
      <Card>
        <Text style={globalStyles.property}>Mededeling:</Text>
        <Text style={globalStyles.price}>{transaction.message}</Text>
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
    </ScrollView>
  )
}
