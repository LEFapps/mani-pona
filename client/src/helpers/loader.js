import React, { useState, useEffect } from 'react'
import { View } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'
import { colors } from './helper'

const shifter = speed => {
  const gears = {
    lazy: 1,
    slow: 3,
    medium: 6,
    fast: 9,
    swift: 12
  }
  return gears[speed] || speed
}

const Spinner = ({ speed = 6, ...props }) => {
  const [rotation, setRotation] = useState(0)
  speed = shifter(speed)
  useEffect(() => {
    setTimeout(
      () => setRotation(rotation > 360 - speed ? 0 : rotation + speed),
      17 // ~60 fps
    )
  }, [rotation])
  return (
    <View style={{ transform: `rotate(${rotation}deg)` }}>
      <MaterialCommunityIcons
        color={'#FFF'}
        size={24}
        {...props}
        name='loading'
      />
    </View>
  )
}

const DarkSpinner = props => <Spinner color={colors.DarkerBlue} {...props} />

export { Spinner, DarkSpinner }
export default Spinner
