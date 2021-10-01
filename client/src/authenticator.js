import React, { useState } from 'react'
import { View } from 'react-native'
import { Authenticator, VerifyContact } from 'aws-amplify-react-native'
import { Auth } from 'aws-amplify'

import SignIn from '../src/screens/auth/signIn'
import SignUp from '../src/screens/auth/signUp'
import ConfirmSignUp from '../src/screens/auth/confirmSignUp'
import KeyPrompt from '../src/screens/auth/keyPrompt'
import Navigation from '../src/routes/main'

export const UserContext = React.createContext(false)

export default () => {
  const { maniClient } = global

  // Keys present?
  const [isNew, setNew] = useState(!maniClient.id)
  const [hasKeys, setKeys] = useState(maniClient.id)
  const [user, setUser] = useState(false)

  if (!hasKeys)
    return (
      <KeyPrompt
        onResolve={keys => {
          if (keys === 'pasted') setNew(false)
          setKeys(keys)
        }}
      />
    )
  return (
    <UserContext.Provider value={user}>
      <Authenticator
        container={({ children }) => {
          return <View style={styles.container}>{children}</View>
        }}
        hideDefault
        authState={isNew ? 'signUp' : 'signIn'}
        onStateChange={async authState => {
          if (authState === 'signedIn')
            setUser(await Auth.currentAuthenticatedUser())
          if (['signIn', 'signUp'].includes(authState))
            setKeys(global.maniClient.id)
          if (authState === 'verifyContact') return 'signedIn'
          return authState
        }}
      >
        <Navigation />
        <SignIn override={'SignIn'} />
        <SignUp override={'SignUp'} />
        <ConfirmSignUp override={'confirmSignUp'} />
        <VerifyContact />
      </Authenticator>
    </UserContext.Provider>
  )
}

const styles = {
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#2B8AA0'
  }
}
