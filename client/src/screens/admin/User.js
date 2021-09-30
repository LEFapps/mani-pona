import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet, TextInput } from 'react-native'
import Modal from 'modal-react-native-web'

import FlatButton from '../../shared/buttons/historyButton'
import CustomButton from '../../shared/buttons/button'
import Alert from '../../shared/alert'

import { globalStyles } from '../../styles/global'

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

const enabled = ({ visible, user, onClose }) => {
  const { maniClient } = global

  // Submit Action
  const action = () =>
    maniClient.admin[user.enabled ? 'disableUser' : 'enableUser'](user.email)
      .then(() => onClose(true))
      .catch(e => onClose(e && e.message))
  return (
    <Container
      visible={visible}
      title={user.enabled ? 'Rekening blokkeren' : 'Rekening activeren'}
      onCancel={onClose}
    >
      <CustomButton
        onPress={action}
        style={{ marginVertical: 12 }}
        title={user.enabled ? 'Blokkeren' : 'Activeren'}
      />
    </Container>
  )
}

const type = ({ visible, user, onClose }) => {
  const { maniClient } = global
  const [newType, setType] = useState(user.type)
  const [userTypes, setTypes] = useState([])
  useEffect(() => {
    maniClient.system
      .accountTypes()
      .then(setTypes)
      .catch(e => {
        console.error('editor/accounttypes', e)
        e && Alert.alert(e.message)
      })
  }, [])

  // Radio Options
  const types = userTypes.map(({ type }) => ({
    active: () => type === newType,
    onPress: () => setType(type),
    title: type
  }))

  // Submit Action
  const action = () =>
    maniClient.admin
      .changeAccountType(user.email, newType)
      .then(() => onClose(true))
      .catch(e => onClose(e && e.message))

  return (
    <Container
      visible={visible}
      title={'Accounttype wijzigen'}
      onCancel={onClose}
    >
      <FlatButton options={types} />
      <CustomButton
        onPress={action}
        style={{ marginVertical: 12 }}
        title={'Bevestigen'}
      />
    </Container>
  )
}

const balance = ({ visible, user, onClose }) => {
  const { maniClient } = global
  const [amount, setAmount] = useState(0)
  const [sign, setSign] = useState(1)

  // Radio Options
  const signs = [
    {
      title: '… verminderen met …',
      active: () => sign > 0,
      onPress: () => setSign(1)
    },
    {
      title: '… verhogen met …',
      active: () => sign < 0,
      onPress: () => setSign(-1)
    }
  ]

  // submit action
  const action = () =>
    maniClient.admin
      .forceSystemPayment(user.ledger, amount * sign)
      .then(() => onClose(true))
      .catch(e => onClose(e && e.message))

  return (
    <Container
      visible={visible}
      title={'Rekeningstand van ' + user.alias + '…'}
      onCancel={onClose}
    >
      <FlatButton options={signs} />
      <TextInput
        onChangeText={a => setAmount(Math.abs(Number(a)))}
        value={amount || 0}
      />
      <CustomButton
        onPress={action}
        style={{ marginVertical: 12 }}
        title={'Bevestigen'}
      />
    </Container>
  )
}

export default { enabled, type, balance }

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
