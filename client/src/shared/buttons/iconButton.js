import React from 'react'
import { StyleSheet, TouchableOpacity, Text, View } from 'react-native'
import { MaterialIcons, Octicons } from '@expo/vector-icons'
import { colors } from '../../helpers/helper'
const { DarkerBlue } = colors

export default function FlatButton (props) {
  return (
    <TouchableOpacity onPress={props.onPress} style={styles.touchable}>
      <View style={styles.button}>
        {!props.fromAltSet ? (
          <MaterialIcons
            name={props.iconName}
            size={28}
            style={{
              textAlign: 'center',
              color: props.iconColor
            }}
          />
        ) : (
          <Octicons
            name={props.iconName}
            size={28}
            style={{
              textAlign: 'center',
              color: props.iconColor
            }}
          />
        )}
        {!!props.children && props.children}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  touchable: {
    borderRadius: 4,
    alignItems: 'center',
    backgroundColor: DarkerBlue,
    padding: 6
  }
})
