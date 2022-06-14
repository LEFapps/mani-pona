import React from 'react'
import { View, Text, ScrollView } from 'react-native'

import { globalStyles } from '../styles/global'
import Card from '../shared/card'

import Faq from './help/faq'

export default function Help () {
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
            {/* E-mail: jonas.van.lancker@howest.be {'\n'} */}
            Tel: +32 56 286 837
            {'\n'}
            {'\n'}
            {/* <a href='https://loreco-assets.s3.eu-west-1.amazonaws.com/Algemene_voorwaarden_Klavers_Lichtervelde.docx.pdf'>
              Algemene voorwaarden
            </a>
            {'\n'}
            <a href='https://loreco-assets.s3.eu-west-1.amazonaws.com/Privacy_Klavers_Lichtervelde.docx.pdf'>
              Privacy
            </a> */}
          </Text>
        </Card>
        <Card>
          <Text style={globalStyles.cardPropertyText}>
            Contact opnemen met een administrator:{'\n'}
          </Text>
          {/* TODO: placeholder contact info */}
          <Text style={globalStyles.cardValueText}>
            Voor vragen, opmerkingen en andere zaken kan je terecht bij{' '}
            {/* <a href='mailto:jonas.van.lancker@howest.be?subject=Ik%20heb%20een%20vraag'>
              jonas.van.lancker@howest.be
            </a> */}
            een administrator
          </Text>
        </Card>
        {/* FAQ */}
        <Faq />
      </View>
    </ScrollView>
  )
}
