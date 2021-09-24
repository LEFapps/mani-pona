import React from 'react'
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native'
import { colors } from '../../helpers/helper'
const { DarkerBlue } = colors

export default ({ options = [], ...props }) => {
  return (
    <View style={styles.everything}>
      {options.map(({ active, onPress, title, ...option }, index) => {
        const isActive = active()
        return (
          <TouchableOpacity
            onPress={onPress}
            style={styles.touchable}
            key={index}
          >
            <View
              style={{
                // marginHorizontal: 0,
                paddingVertical: 4,
                paddingHorizontal: 12,
                borderRadius: 4,
                color: isActive ? DarkerBlue : 'white',
                backgroundColor: isActive ? 'white' : 'transparent',
                fontWeight: isActive ? 'bold' : 'normal'
              }}
            >
              <Text style={styles.buttonText}>{title}</Text>
            </View>
          </TouchableOpacity>
        )
      })}
    </View>
  )
}

export const HistoryButton = props => {
  return (
    <View style={styles.everything}>
      <TouchableOpacity onPress={props.onPressAll} style={styles.touchable}>
        <View
          style={{
            backgroundColor: props.allBackground,
            borderRadius: 4,
            paddingVertical: 4
          }}
        >
          <Text style={styles.buttonText}>Alle</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={props.onPressPayd} style={styles.touchable}>
        <View
          style={{
            backgroundColor: props.paydBackground,
            borderRadius: 4,
            paddingVertical: 4
          }}
        >
          <Text style={styles.buttonText}>Betaald</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        onPress={props.onPressReceived}
        style={styles.touchable}
      >
        <View
          style={{
            backgroundColor: props.receivedBackground,
            borderRadius: 4,
            paddingVertical: 4
          }}
        >
          <Text style={styles.buttonText}>Ontvangen</Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  everything: {
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DarkerBlue,
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginVertical: 8
  },
  touchable: {
    flex: '1 1 33.33%',
    // fontSize: 25,
    textAlign: 'center',
    whiteSpace: 'nowrap'
    // paddingHorizontal: 12,
    // paddingVertical: 4,
    // marginHorizontal: 8
  },
  buttonText: {
    // borderRadius: 4,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'inherit',
    color: 'inherit'
  }
})
