import React, { useState } from 'react'
import { View, Text, ScrollView, Image } from 'react-native'
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
        <View style={globalStyles.main}>
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
        {/* HOWTO: QR */}
        <View style={globalStyles.main}>
          <Text
            style={globalStyles.cardPropertyText}
            onPress={() => setToggle(toggle !== 2 ? 2 : null)}
          >
            <Icon open={toggle === 2} />
            Hoe kan ik mijn rekening overzetten op bijkomend apparaat via QR
            Code?
          </Text>
        </View>
        {toggle === 2 && (
          <View style={globalStyles.main}>
            <Text style={globalStyles.paragraph}>
              Activeer je rekening door hierboven je alias in te geven. Voer
              nadien deze stappen uit:
            </Text>
            <Text style={globalStyles.paragraph}>Op dit apparaat</Text>
            <Text style={globalStyles.paragraph}>
              - Klik op de knop om naar jouw account te gaan
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/1.png'
              }}
              style={{ height: 60, width: 'auto' }}
              resizeMode='contain'
            />
            <Text style={globalStyles.paragraph}>
              - Klik op de knop 'Exporteer mijn sleutels'
            </Text>
            <Text style={globalStyles.paragraph}>
              Je ziet nu een scherm met een QR-code, en een menu-balk met de
              optie 'QR-Code 2', deze codes ga je inscannen op je nieuwe
              apparaat.
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/2.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
            <Text style={globalStyles.paragraph}>Op het nieuwe apparaat</Text>
            <Text style={globalStyles.paragraph}>
              - Klik op het startscherm op de optie 'Bestaand account
              toevoegen.'
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/4.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
            <Text style={globalStyles.paragraph}>
              - Scan de eerste QR code, wanneer dit gelukt is zie je de knop
              'Volgende stap'
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/7.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
            <Text style={globalStyles.paragraph}>
              - Navigeer op je ander apparaat naar het scherm met de tweede
              code. Scan de tweede QR code.
            </Text>
            <Text style={globalStyles.paragraph}>
              Wanneer dit gelukt is kan je je op dit apparaat aanmelden.
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/8.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
          </View>
        )}
        {/* HOWTO: manual */}
        <View style={globalStyles.main}>
          <Text
            style={globalStyles.cardPropertyText}
            onPress={() => setToggle(toggle !== 3 ? 3 : null)}
          >
            <Icon open={toggle === 3} />
            Hoe kan ik mijn rekening manueel overzetten op bijkomend apparaat?
          </Text>
        </View>
        {toggle === 3 && (
          <View style={globalStyles.main}>
            <Text style={globalStyles.paragraph}>
              Activeer je rekening door hierboven je alias in te geven. Voer
              nadien deze stappen uit:
            </Text>
            <Text style={globalStyles.paragraph}>Op dit apparaat:</Text>
            <Text style={globalStyles.paragraph}>
              - Klik op de knop om naar jouw account te gaan
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/1.png'
              }}
              style={{ height: 60, width: 'auto' }}
              resizeMode='contain'
            />
            <Text style={globalStyles.paragraph}>
              - Klik op de knop 'Exporteer mijn sleutels'
            </Text>

            <Text style={globalStyles.paragraph}>
              - Klik op de knop 'Kopiëren'
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/3.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
            <Text style={globalStyles.paragraph}>
              Je ziet nu een scherm met jouw unieke sleutel. Deze sleutel ga je
              ingeven op je nieuwe apparaat.
            </Text>
            <Text style={globalStyles.paragraph}>
              - Kopieer de sleutel zodat je deze gemakkelijk kunt ingeven op je
              nieuwe apparaat, bijvoorbeeld door deze naar jezelf te mailen.
            </Text>
            <Text style={globalStyles.paragraph}>Op het nieuwe apparaat:</Text>
            <Text style={globalStyles.paragraph}>
              - Klik op het startscherm op de optie 'Bestaand account
              toevoegen.'
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/4.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
            <Text style={globalStyles.paragraph}>- Klik op 'Plakken'</Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/6.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
            <Text>
              Plak je geheime sleutel in het invulveld. Wanneer dit gelukt is
              zie je de knop 'Volgende stap'
            </Text>
            <Text style={globalStyles.paragraph}>
              Wanneer dit gelukt is kan je je op dit apparaat aanmelden.
            </Text>
            <Image
              source={{
                uri:
                  'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/8.png'
              }}
              style={{ height: 200, width: 'auto' }}
              resizeMode='contain'
            />
          </View>
        )}
      </View>
    </ScrollView>
  )
}
