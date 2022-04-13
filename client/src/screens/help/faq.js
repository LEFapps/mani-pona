import React, { useState } from 'react'
import { View, Text, Image } from 'react-native'
import { MaterialCommunityIcons } from '@expo/vector-icons'

import { globalStyles } from '../../styles/global'
import Card from '../../shared/card'

// Currently covered by the FAQ (in this order)
// 1. How to Log out
// 2. How to create a new transaction
// 3. How to handle a transaction request
// 4. How to see your ledger's balance
// 5. How to see your ledger's history and export
// 6. How to see your ledger's predictions
// 7. How to block your account
// 8. How to import account using QR
// 9. How to import account using text
// 10. How to purchase mani using other currencies

// Boilerplate for a new FAQ item, make sure to update the toggle reference so it's unique:
{
  /* 
  <View>
        <Text
          style={globalStyles.cardPropertyText}
          onPress={() => setToggle(toggle !== 1 ? 1 : null)}
        >
          <Icon open={toggle === 1} />
          Hoe kan ik mijn account blokkeren?
        </Text>
      {toggle === 1 && (
        <View>
          <Text style={globalStyles.paragraph}>
            Om je rekening te blokkeren moet je contact opnemen met een
            administrator
          </Text>
        </View>
      )}
      </View>
      */
}

const Faq = () => {
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

  const [toggle, setToggle] = useState(null)

  return (
    <View>
      <View style={globalStyles.main}>
        <Text style={globalStyles.cardPropertyText}>FAQ:</Text>
        <Text
          style={globalStyles.cardPropertyText}
          onPress={() => setToggle(toggle !== 1 ? 1 : null)}
        >
          <Icon open={toggle === 1} />
          Hoe kan ik uitloggen?
        </Text>
      </View>
      {toggle === 1 && (
        <View>
          <Text style={globalStyles.paragraph}>
            Om je uit te loggen klik je in de taakbalk onderaan de applicatie op
            de knop 'Account'
          </Text>
          <Image
            source={{
              uri:
                'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/account.png'
            }}
            style={{ height: 40, width: 'auto' }}
            resizeMode='contain'
          />
          <Text style={globalStyles.paragraph}>
            Klik daarna op de knop 'Afmelden'
          </Text>
          <Image
            source={{
              uri:
                'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/account-view.png'
            }}
            style={{ height: 220, width: 'auto' }}
            resizeMode='contain'
          />
        </View>
      )}
      {/* _______________________ */}
      <View style={globalStyles.main}>
        <Text
          style={globalStyles.cardPropertyText}
          onPress={() => setToggle(toggle !== 2 ? 2 : null)}
        >
          <Icon open={toggle === 2} />
          Hoe kan ik een nieuwe transactie aanmaken?
        </Text>
      </View>
      {toggle === 2 && (
        <View>
          <Text style={globalStyles.paragraph}>
            Om Klavers te ontvangen of te betalen kan je de volgende stappen
            volgen:
          </Text>
          <Text style={globalStyles.paragraph}>
            - Klik op 'QR Maken' in de taakbalk bovenaan, of op de knop 'Maak
            een QR-code' op het Startscherm
          </Text>
          <Image
            source={{
              uri:
                'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/QR-view.png'
            }}
            style={{ height: 200, width: 'auto' }}
            resizeMode='contain'
          />
          <Text style={globalStyles.paragraph}>
            - Vul het bedrag in, een optioneel bericht en of je Klavers wilt
            ontvangen of betalen
          </Text>
          <Text style={globalStyles.paragraph}>
            - Klik op 'Aanmaken'. Het systeem maakt een QR-code voor je
            transactie aan.
          </Text>
          <Image
            source={{
              uri:
                'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/QR-create.png'
            }}
            style={{ height: 220, width: 'auto' }}
            resizeMode='contain'
          />
          <Text style={globalStyles.paragraph}>
            - Laat deze QR-code scannen door de tegenpartij. Zij kunnen deze
            transactie goedkeuren of annuleren.
          </Text>
          <Text style={globalStyles.paragraph}>
            Je kan de transactie ook zelf annuleren door op 'Terug' te klikken,
            zolang de tegenpartij de transactie niet heeft
            goedgekeurd/afgekeurd.
          </Text>
          <Text style={globalStyles.paragraph}>
            - Als de tegenpartij de transactie heeft goedgekeurd krijg jij hier
            een melding van
          </Text>
          <Image
            source={{
              uri:
                'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/QR-notif.png'
            }}
            style={{ height: 320, width: 'auto' }}
            resizeMode='contain'
          />
          <Text>
            - Klik in de notificatie op 'Bekijken' om de transactie af te
            handelen, of navigeer later naar het tabblad 'Openstaande
            Betalingen'
          </Text>
          <Text>
            - Je ziet een laatste keer een overzicht van de transactie. Klik op
            het 'Vink' icoon om de transactie af te ronden en het gevraagde
            bedrag te betalen/ontvangen, of klik op het 'Kruis' icoon om de
            transactie te annuleren.
          </Text>
          <Image
            source={{
              uri:
                'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/transaction-final.png'
            }}
            style={{ height: 220, width: 'auto' }}
            resizeMode='contain'
          />
        </View>
      )}
      {/* _______________________ */}
      <View style={globalStyles.main}>
        <Text
          style={globalStyles.cardPropertyText}
          onPress={() => setToggle(toggle !== 3 ? 3 : null)}
        >
          <Icon open={toggle === 3} />
          Hoe kan ik een transactie goedkeuren/afkeuren
        </Text>
      </View>
      {toggle === 3 && (
        <View>
          <Text style={globalStyles.paragraph}>
            Wanneer een tegenpartij een transactie met jou gaat opstarten maken
            zij een QR code aan die jij kan scannen om de transactie goed te
            keuren.
          </Text>
          <Text style={globalStyles.paragraph}>
            - Klik op 'QR Scannen' in de taakbalk bovenaan, of op de knop 'Scan
            een QR-code' op het Startscherm
          </Text>
          <Text style={globalStyles.paragraph}>
            - Scan de QR-code van de tegenpartij
          </Text>
          <Text style={globalStyles.paragraph}>
            - Je krijgt nu een scherm te zien met de details van de aangevraagde
            transactie. Bekijk de info en klik op het 'Vink' icoon om de
            transactie af te ronden en het gevraagde bedrag te
            betalen/ontvangen, of klik op het 'Kruis' icoon om de transactie te
            annuleren.
          </Text>
          {/* TBC */}
        </View>
      )}
      {/* _______________________ */}
      <View style={globalStyles.main}>
        <Text
          style={globalStyles.cardPropertyText}
          onPress={() => setToggle(toggle !== 3 ? 3 : null)}
        >
          <Icon open={toggle === 3} />
          Hoe
        </Text>
      </View>
      {toggle === 3 && (
        <View>
          <Text style={globalStyles.paragraph}></Text>
        </View>
      )}
      {/* _______________________ */}
      <View style={globalStyles.main}>
        <Text
          style={globalStyles.cardPropertyText}
          onPress={() => setToggle(toggle !== 4 ? 4 : null)}
        >
          <Icon open={toggle === 4} />
          Hoe
        </Text>
      </View>
      {toggle === 4 && (
        <View>
          <Text style={globalStyles.paragraph}></Text>
        </View>
      )}
      {/* _______________________ */}
      <View style={globalStyles.main}>
        <Text
          style={globalStyles.cardPropertyText}
          onPress={() => setToggle(toggle !== 5 ? 5 : null)}
        >
          <Icon open={toggle === 5} />
          Hoe
        </Text>
      </View>
      {toggle === 5 && (
        <View>
          <Text style={globalStyles.paragraph}></Text>
        </View>
      )}
      {/* _______________________ */}
      <View style={globalStyles.main}>
        <Text
          style={globalStyles.cardPropertyText}
          onPress={() => setToggle(toggle !== 6 ? 6 : null)}
        >
          <Icon open={toggle === 6} />
          Hoe
        </Text>
      </View>
      {toggle === 6 && (
        <View>
          <Text style={globalStyles.paragraph}></Text>
        </View>
      )}
      {/* _______________________ */}
      <View style={globalStyles.main}>
        <Text
          style={globalStyles.cardPropertyText}
          onPress={() => setToggle(toggle !== 7 ? 7 : null)}
        >
          <Icon open={toggle === 7} />
          Hoe kan ik mijn account blokkeren?
        </Text>
      </View>
      {toggle === 7 && (
        <View>
          <Text style={globalStyles.paragraph}>
            Om je rekening te blokkeren moet je contact opnemen met een
            administrator
          </Text>
        </View>
      )}
      {/* _______________________ */}
      <View style={globalStyles.main}>
        <Text
          style={globalStyles.cardPropertyText}
          onPress={() => setToggle(toggle !== 8 ? 8 : null)}
        >
          <Icon open={toggle === 8} />
          Hoe kan ik mijn rekening overzetten op een bijkomend apparaat via QR
          Code?
        </Text>
      </View>
      {toggle === 8 && (
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
              uri: 'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/1.png'
            }}
            style={{ height: 60, width: 'auto' }}
            resizeMode='contain'
          />
          <Text style={globalStyles.paragraph}>
            - Klik op de knop 'Exporteer mijn sleutels'
          </Text>
          <Text style={globalStyles.paragraph}>
            Je ziet nu een scherm met een QR-code, en een menu-balk met de optie
            'QR-Code 2', deze codes ga je inscannen op je nieuwe apparaat.
          </Text>
          <Image
            source={{
              uri: 'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/2.png'
            }}
            style={{ height: 200, width: 'auto' }}
            resizeMode='contain'
          />
          <Text style={globalStyles.paragraph}>Op het nieuwe apparaat</Text>
          <Text style={globalStyles.paragraph}>
            - Klik op het startscherm op de optie 'Bestaand account toevoegen.'
          </Text>
          <Image
            source={{
              uri: 'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/4.png'
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
              uri: 'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/7.png'
            }}
            style={{ height: 200, width: 'auto' }}
            resizeMode='contain'
          />
          <Text style={globalStyles.paragraph}>
            - Navigeer op je ander apparaat naar het scherm met de tweede code.
            Scan de tweede QR code.
          </Text>
          <Text style={globalStyles.paragraph}>
            Wanneer dit gelukt is kan je je op dit apparaat aanmelden.
          </Text>
          <Image
            source={{
              uri: 'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/8.png'
            }}
            style={{ height: 200, width: 'auto' }}
            resizeMode='contain'
          />
        </View>
      )}
      {/* _______________________ */}
      <View style={globalStyles.main}>
        <Text
          style={globalStyles.cardPropertyText}
          onPress={() => setToggle(toggle !== 9 ? 9 : null)}
        >
          <Icon open={toggle === 9} />
          Hoe kan ik mijn rekening manueel overzetten op een bijkomend apparaat?
        </Text>
      </View>
      {toggle === 9 && (
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
              uri: 'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/1.png'
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
              uri: 'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/3.png'
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
            - Klik op het startscherm op de optie 'Bestaand account toevoegen.'
          </Text>
          <Image
            source={{
              uri: 'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/4.png'
            }}
            style={{ height: 200, width: 'auto' }}
            resizeMode='contain'
          />
          <Text style={globalStyles.paragraph}>- Klik op 'Plakken'</Text>
          <Image
            source={{
              uri: 'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/6.png'
            }}
            style={{ height: 200, width: 'auto' }}
            resizeMode='contain'
          />
          <Text>
            Plak je geheime sleutel in het invulveld. Wanneer dit gelukt is zie
            je de knop 'Volgende stap'
          </Text>
          <Text style={globalStyles.paragraph}>
            Wanneer dit gelukt is kan je je op dit apparaat aanmelden.
          </Text>
          <Image
            source={{
              uri: 'https://loreco-assets.s3.eu-west-1.amazonaws.com/faq/8.png'
            }}
            style={{ height: 200, width: 'auto' }}
            resizeMode='contain'
          />
        </View>
      )}
      {/* _______________________ */}
      <View style={globalStyles.main}>
        <Text
          style={globalStyles.cardPropertyText}
          onPress={() => setToggle(toggle !== 10 ? 10 : null)}
        >
          <Icon open={toggle === 10} />
          Hoe
        </Text>
      </View>
      {toggle === 10 && (
        <View>
          <Text style={globalStyles.paragraph}></Text>
        </View>
      )}
      {/* _______________________ */}
    </View>
  )
}

export default Faq