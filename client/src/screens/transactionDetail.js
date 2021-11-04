import React from 'react'
import { Text, ScrollView } from 'react-native'
import { globalStyles } from '../styles/global'
import Card from '../shared/card'
import { Contact } from '../shared/contact'

export default function TransactionHitstory ({ route }) {
  const { transaction = {} } = route.params
  const { destination, message, amount, income, demurrage, date } = transaction

  return (
    <ScrollView style={globalStyles.main}>
      <Card>
        <Text style={globalStyles.property}>Contact:</Text>
        <Contact style={globalStyles.price} ledger={destination} />
      </Card>
      <Card>
        <Text style={globalStyles.property}>Mededeling:</Text>
        <Text style={globalStyles.price}>{message || '-'}</Text>
      </Card>
      <Card>
        <Text style={globalStyles.property}>Bedrag:</Text>
        <Text style={globalStyles.price}>{amount.format()}</Text>
      </Card>
      {income && !income.zero() && (
        <Card>
          <Text style={globalStyles.property}>Inkomen:</Text>
          <Text style={globalStyles.price}>{income.format()}</Text>
        </Card>
      )}
      {demurrage && !demurrage.zero() && (
        <Card>
          <Text style={globalStyles.property}>Gemeenschapsbijdrage:</Text>
          <Text style={globalStyles.price}>{demurrage.format()}</Text>
        </Card>
      )}
      <Card>
        <Text style={globalStyles.property}>Datum:</Text>
        <Text style={globalStyles.price}>
          {new Date(date).toLocaleString('nl-BE')}
        </Text>
      </Card>
    </ScrollView>
  )
}
