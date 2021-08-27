import React from 'react'
import { StyleSheet, View } from 'react-native'
import IconButton from './buttons/iconButton'
import { colors } from '../helpers/helper'
const { TransparentBlueCard } = colors

export default function Card ({
  children,
  onPressDelete,
  onPressEdit,
  onPressCancel,
  onPressConfirm
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardValues}>{props.children}</View>
      <View style={styles.buttonContainer}>
        {onPressCancel && (
          <View style={styles.button}>
            <IconButton
              iconName='close'
              iconColor='white'
              onPress={onPressCancel}
            />
          </View>
        )}
        {onPressConfirm && (
          <View style={styles.button}>
            <IconButton
              iconName='check'
              iconColor='white'
              onPress={onPressConfirm}
            />
          </View>
        )}
        {onPressEdit && (
          <View style={styles.button}>
            <IconButton
              iconName='edit'
              iconColor='white'
              onPress={onPressEdit}
            />
          </View>
        )}
        {onPressDelete && (
          <View style={styles.button}>
            <IconButton
              iconName='delete'
              iconColor='white'
              onPress={onPressDelete}
            />
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: TransparentBlueCard,
    marginBottom: 5
  },
  cardValues: {
    fontSize: 23,
    marginBottom: 8,
    marginHorizontal: 8
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  button: {
    width: '49%'
  }
})
