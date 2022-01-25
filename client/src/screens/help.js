import React, { useState } from 'react'
import { View, Text, ScrollView } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { globalStyles } from '../styles/global'
import Card from '../shared/card'

const iconProps = {
  size: 16,
  style: { marginRight: 4, marginTop: 1 }
}
const Icon = ({ open }) => (
  <MaterialCommunityIcons
    name={open ? 'arrow-down' : 'arrow-right'}
    {...iconProps}
  />
)
export default function Help () {
  const [toggle, setToggle] = useState(null)

  return (
    <ScrollView style={globalStyles.main}>
      <View style={{ marginBottom: 10 }}>
        <Card>
          <Text style={globalStyles.cardPropertyText}>Info:{'\n'}</Text>
          <Text style={globalStyles.paragraph}>
            Klavers is een project van "Digitale Klavers Lichtervelde", {'\n'}
            een samenwerking tussen Howest Netwerkeconomie en Lichtervelde
            Lokaal vzw (ON 0746.998.186){'\n'}
            {'\n'}
            Adres: Digitale Klavers Lichtervelde, Statiestraat 10, 8810
            Lichtervelde{'\n'}
            Contactpersoon: Jonas Van Lancker{'\n'}
            E-mail: jonas.van.lancker@howest.be {'\n'}
            Tel: +32 56 286 837
            {'\n'}
            {'\n'}
            <a href='https://loreco-assets.s3.eu-west-1.amazonaws.com/Algemene_voorwaarden_Klavers_Lichtervelde.docx.pdf'>
              Algemene voorwaarden
            </a>
            {'\n'}
            <a href='https://loreco-assets.s3.eu-west-1.amazonaws.com/Privacy_Klavers_Lichtervelde.docx.pdf'>
              Privacy
            </a>
          </Text>
        </Card>
        <Card>
          <Text style={globalStyles.cardPropertyText}>
            Contact opnemen met een administrator:{'\n'}
          </Text>
          {/* TODO: placeholder contact info */}
          <Text style={globalStyles.cardValueText}>
            Voor vragen, opmerkingen en andere zaken kan je terecht bij{' '}
            <a href='mailto:jonas.van.lancker@howest.be?subject=Ik%20heb%20een%20vraag'>
              jonas.van.lancker@howest.be
            </a>
          </Text>
        </Card>
        {/* FAQ */}
        {/* TODO: add relevant info as needed */}
        {/* Use this as your template, change toggle value: */}
        {/* <Card> */}
        <View>
          <Text style={globalStyles.cardPropertyText}>FAQ:</Text>
          <Text
            style={globalStyles.cardPropertyText}
            onPress={() => setToggle(toggle !== 1 ? 1 : null)}
          >
            <Icon open={toggle === 1} />
            Hoe kan ik mijn account blokkeren?
          </Text>
        </View>
        {toggle === 1 && (
          <View>
            <Text style={globalStyles.paragraph}>
              Om je rekening te blokkeren moet je contact opnemen met een
              administrator
            </Text>
          </View>
        )}
        {/* </Card> */}
      </View>
    </ScrollView>
  )
}
