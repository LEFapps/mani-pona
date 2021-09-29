import React from 'react'
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native'
import { colors } from '../../helpers/helper'
const { ErrorRed, DarkerBlue } = colors

export default function FlatButton (props) {
  return (
    <View style={props.style || {}}>
      <TouchableOpacity onPress={props.onPress} style={styles.everything}>
        <View style={styles.button}>
          <Text style={styles.buttonText}>
            {props.active ? '✔ ' : ''}
            {props.text || props.title}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  everything: {
    width: '100%',
    borderRadius: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
    backgroundColor: DarkerBlue,
    elevation: 6,
    marginBottom: 5
  },
  buttonText: {
    marginVertical: 5,
    color: 'white',
    fontSize: 20
  },
  active: {
    backgroundColor: ErrorRed
  }
})
