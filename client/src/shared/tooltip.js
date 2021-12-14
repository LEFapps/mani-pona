import React from 'react'
import { Text } from 'react-native'
import { EvilIcons } from '@expo/vector-icons'
import { Popable } from 'react-native-popable'

export default function Tooltip (props) {
  return (
    <Popable
      style={{ minWidth: 400 }}
      content={
        <Text
          style={{
            color: 'white',
            margin: 10
          }}
        >
          {props.content}
        </Text>
      }
    >
      <EvilIcons name={'question'} size={24} />
    </Popable>
  )
}