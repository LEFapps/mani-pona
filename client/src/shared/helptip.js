import React from 'react'
import { Tooltip } from 'react-native-elements'
import Modal from 'modal-react-native-web'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { colors } from '../helpers/helper'

export const HelpTip = ({ children }) => {
  return (
    <Tooltip
      popover={children}
      backgroundColor={colors.LoREcoBlue}
      withOverlay={false}
      skipAndroidStatusBar={true}
    >
      <MaterialCommunityIcons
        name={'help-box'}
        size={20}
        style={{ marginHorizontal: 8, alignSelf: 'center' }}
        color={colors.DarkerBlue}
      />
    </Tooltip>
  )
}
