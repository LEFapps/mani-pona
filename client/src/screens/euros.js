import React, { useState, useEffect, useContext } from 'react'
import { View, Text, StyleSheet, TextInput } from 'react-native'
import Modal from 'modal-react-native-web'

// import mani from '../../../shared/mani'

// import FlatButton from '../../shared/buttons/historyButton'
import CustomButton from '../shared/buttons/button'
import IconButton from '../shared/buttons/iconButton'

import { globalStyles } from '../styles/global'
// import { useNotifications } from '../../shared/notifications'

const Container = ({ visible, title, onCancel, children }) => {
  return (
    <Modal visible={!!visible} transparent ariaHideApp={false}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={globalStyles.bigText}>{title}</Text>
          {children}
          <CustomButton
            style={{ marginVertical: 12 }}
            onPress={() => onCancel()}
            title={'Sluiten'}
          />
        </View>
      </View>
    </Modal>
  )
}

export const Euros = ({ style }) => {
  const [isOpen, setOpen] = useState(false)
  const [amount, setAmount] = useState(10)
  const { maniClient } = global

  const amountInput = a => {
    a = a.replace(',', '.')
    a = parseFloat(a)
    if (a < 0) setAmount(0)
    setAmount(a)
  }

  const action = () => {
    maniClient.stripe
      .startPayment(amount.toString())
      .then(redirect => (window.location.href = redirect))
  }

  return (
    <View>
      <View style={style}>
        <IconButton iconName={'euro-symbol'} onPress={() => setOpen(!isOpen)} />
      </View>
      <Container visible={!!isOpen} title={'Koop Klavers (₭)'}>
        <TextInput
          style={globalStyles.input}
          onChangeText={amountInput}
          value={amount || 0}
        />
        <CustomButton
          onPress={action}
          style={{ marginVertical: 12 }}
          title={'Bevestigen'}
        />
      </Container>
    </View>
  )
}

export default Euros

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'center',
    alignItems: 'center',
    margin: '8%',
    backgroundColor: 'white'
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
  },
  modalView: {
    marginVertical: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    textAlign: 'center'
  },
  qr: {
    marginBottom: 30,
    marginTop: 30,
    display: 'flex',
    alignItems: 'center'
  }
})
