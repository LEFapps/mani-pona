import React, { useState, useEffect, useContext } from 'react'
import { View, Text, StyleSheet, TextInput } from 'react-native'
import Modal from 'modal-react-native-web'

import mani from '../../../shared/mani'

import FlatButton from '../../shared/buttons/historyButton'
import CustomButton from '../../shared/buttons/button'

import { globalStyles } from '../../styles/global'
import { useNotifications } from '../../shared/notifications'

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

  const checkAction2 = () => !user.enabled
  const action2 = () => {
    if (!checkAction2()) return
    if (
      !confirm(
        `Ben je zeker dat je ${user.email || ''} definitief wil verijderen?`
      )
    )
      return
    maniClient.admin['deleteUser'](user.email)
      .then(() => onClose('Gebruiker verwijderd'))
      .catch(e => onClose(e && e.message))
  }
  return (
    <Container
      visible={visible}
      title={user.enabled ? 'Gebruiker blokkeren' : 'Gebruiker activeren'}
      onCancel={onClose}
    >
      <CustomButton
        onPress={action}
        style={{ marginVertical: 12 }}
        title={user.enabled ? 'Blokkeren' : 'Activeren'}
      />
      {!!checkAction2() && (
        <CustomButton
          onPress={action2}
          style={{ marginVertical: 12 }}
          title={'Gebruiker verwijderen'}
        />
      )}
    </Container>
  )
}

const type = ({ visible, user, onClose }) => {
  const { maniClient } = global
  const notification = useNotifications()
  const [newType, setType] = useState(user.type)
  const [userTypes, setTypes] = useState([])
  useEffect(() => {
    maniClient.system
      .accountTypes()
      .then(setTypes)
      .catch(e => {
        console.error('editor/accounttypes', e)
        notification.add({
          type: 'warning',
          message: e && e.message,
          title: 'editor/accounttypes'
        })
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

const pending = ({ visible, user, onClose }) => {
  const { maniClient } = global
  const [hasChallenge, setChallenge] = useState()

  useEffect(() => {
    maniClient.admin
      .pending(user.ledger)
      .then(pending => pending && setChallenge(pending.challenge))
  })

  const action = () => {
    const confirmed = confirm(
      'Weet u zeker dat u deze transactie wil afbreken?'
    )
    if (!confirmed) return
    maniClient.admin
      .cancel(hasChallenge, user.ledger)
      .then(() => {
        onClose(true)
        setChallenge(false)
      })
      .catch(e => onClose(e && e.message))
  }

  return hasChallenge ? (
    <Container
      visible={visible}
      title={'Openstaande transactie van ' + user.alias + '…'}
      onCancel={onClose}
    >
      <CustomButton
        onPress={action}
        style={{ marginVertical: 12 }}
        title={'Transactie afbreken'}
      />
    </Container>
  ) : null
}

const balance = ({ visible, user, onClose }) => {
  const { maniClient } = global
  const [amount, setAmount] = useState(0)
  const [sign, setSign] = useState(1)

  // Radio Options
  const signs = [
    {
      title: '… verminderen met …',
      active: () => sign < 0,
      onPress: () => setSign(-1)
    },
    {
      title: '… verhogen met …',
      active: () => sign > 0,
      onPress: () => setSign(1)
    }
  ]

  useEffect(() => {
    if (visible && user.pending)
      onClose('Deze gebruiker heeft al een openstaande transactie.')
  }, [visible, user.email])

  // submit action
  const action = () =>
    maniClient.admin
      .forceSystemPayment(user.ledger, mani(amount * sign))
      .then(() => {
        onClose(true)
        setAmount(0)
        setSign(1)
      })
      .catch(e => onClose(e && e.message))

  return (
    <Container
      visible={visible}
      title={'Rekeningstand van ' + user.alias + '…'}
      onCancel={onClose}
    >
      <FlatButton options={signs} />
      <TextInput
        onChangeText={a => setAmount(a.replace(',', '.'))}
        value={amount || 0}
        style={globalStyles.input}
      />
      <CustomButton
        onPress={action}
        style={{ marginVertical: 12 }}
        title={'Bevestigen'}
      />
    </Container>
  )
}

export default { enabled, type, balance, pending }

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
