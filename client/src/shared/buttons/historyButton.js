import React from 'react'
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native'
import { colors } from '../../helpers/helper'
const { DarkerBlue } = colors

export const FlatButton = ({ options = [], ...props }) => {
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

export default FlatButton

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
    flexBasis: 'auto',
    flexGrow: 1,
    flexShrink: 0,
    textAlign: 'center',
    whiteSpace: 'nowrap'
  },
  buttonText: {
    // borderRadius: 4,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: 'inherit',
    color: 'inherit',
    whiteSpace: 'nowrap'
  }
})
