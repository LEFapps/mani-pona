import React from 'react'
import { Text } from 'react-native'
import { EvilIcons } from '@expo/vector-icons'
import { Popable } from 'react-native-popable'

export default function Tooltip (props) {
  return (
    <Popable
      style={{ minWidth: 200, maxWidth: 200 }}
      content={
        <Text
          style={{
            color: 'white',
            margin: 10,
            padding: 2
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
