import React from 'react'
import {
  Text,
  View,
  StyleSheet,
  FlatList,
  Alert,
  ScrollView
} from 'react-native'
import { globalStyles } from '../styles/global'
import InfoButton from '../shared/buttons/infoButton'
import mani from '../../shared/mani'
import { colors } from '../helpers/helper'
const { DarkerBlue, CurrencyColor } = colors

export default function ContributionPrediction ({ route }) {
  const { demurrage, current } = route.params

  function selectText (number) {
    const numbers = [
      'eerst',
      'tweede',
      'derde',
      'vierde',
      'vijfde',
      'zesde',
      'zevende',
      'achtste',
      'negende',
      'tiende'
    ]
    return numbers[number]
  }

  return (
    <ScrollView style={globalStyles.main}>
      <View style={globalStyles.amountHeader}>
        <Text style={globalStyles.property}>Totaal voorspelde bijdrage:</Text>
        <Text style={globalStyles.price}>
          {current.balance.multiply(demurrage / 100).format()}
        </Text>
      </View>

      {/*<FlatList
        keyExtractor={item => item.tierId.toString()}
        data={tiers}
        renderItem={({ item }) => (
          <View style={styles.part}>
            <Text style={styles.title}>
              Bijdrage op {selectText(item.tierId)} deel
            </Text>

            <Text style={styles.amount}>{item.contribution.format()}</Text>
            <View style={styles.icon}>
              <InfoButton
                logoName='info-outline'
                size={28}
                onPress={() =>
                  Alert.alert(
                    selectText(item.tierId) + ' deel',
                    'Op het ' +
                      selectText(item.tierId) +
                      ' deel tussen ' +
                      mani(item.start).format() +
                      ' en ' +
                      mani(item.end).format() +
                      ' betaalt u ' +
                      item.percentage +
                      '% bijdrage.'
                  )
                }
              />
            </View>
          </View>
        )}
              />*/}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  icon: {
    width: '30%',
    position: 'absolute',
    right: -20,
    top: 16
  },
  amountPlusInfo: {
    justifyContent: 'center',
    paddingVertical: 20,
    flexDirection: 'row'
  },
  part: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: DarkerBlue
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 8,
    marginBottom: 6
  },
  amount: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: CurrencyColor
  },
  info: {
    fontSize: 16,
    textAlign: 'center'
  }
})
