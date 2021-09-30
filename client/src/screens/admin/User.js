import React, { useState, useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Modal from 'modal-react-native-web'

import FlatButton from '../../shared/buttons/historyButton'
import CustomButton from '../../shared/buttons/button'

import { globalStyles } from '../../styles/global'

const Container = ({ visible, title, onClose, children }) => {
  return (
    <Modal visible={!!visible} transparent ariaHideApp={false}>
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={globalStyles.bigText}>{title}?</Text>
          {children}
          <CustomButton
            style={{ marginVertical: 12 }}
            onPress={() => onClose()}
            title={'Sluiten'}
          />
        </View>
      </View>
    </Modal>
  )
}

const editable = {
  enabled: ({ visible, user, onClose }) => {
    const { maniClient } = global
    const action = () =>
      maniClient.admin[user.enabled ? 'disableUser' : 'enableUser'](user.email)
        .then(() => onClose(true))
        .catch(e => onClose(e))
    return (
      <Container
        visible={visible}
        title={user.enabled ? 'Rekening blokkeren' : 'Rekening activeren'}
      >
        <CustomButton
          onPress={action}
          style={{ marginVertical: 12 }}
          title={user.enabled ? 'Blokkeren' : 'Activeren'}
        />
      </Container>
    )
  },
  type: ({ visible, user, onClose }) => {
    const { maniClient } = global
    const [newType, setType] = useState(user.type)
    const [userTypes, setTypes] = useState([])
    useEffect(() => {
      maniClient.system
        .accountTypes()
        .then(setTypes)
        .catch(console.error)
    }, [])
    const types = userTypes.map(({ type }) => ({
      active: () => type === newType,
      onPress: () => setType(type),
      title: type
    }))
    const action = () =>
      maniClient.admin
        .changeAccountType(user.email, newType)
        .then(() => onClose(true))
        .catch(e => onClose(e))
    return (
      <Container visible={visible} title={'Accounttype wijzigen'}>
        <FlatButton options={types} />
        <CustomButton
          onPress={action}
          style={{ marginVertical: 12 }}
          title={'Bevestigen'}
        />
      </Container>
    )
  }
}

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

export default editable
