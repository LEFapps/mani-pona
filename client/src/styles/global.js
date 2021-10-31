import { StyleSheet, Dimensions, StatusBar, Platform } from 'react-native'
import { colors } from '../helpers/helper'
const { DarkerBlue, ErrorRed, CurrencyColor, TransparentBlue } = colors

export const globalStyles = StyleSheet.create({
  text: {
    fontSize: 16,
    color: 'black',
    textAlign: 'center'
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  bigText: {
    fontSize: 22,
    color: DarkerBlue,
    textAlign: 'center'
  },
  errorText: {
    borderRadius: 6,
    color: ErrorRed,
    fontWeight: 'bold',
    marginVertical: 2,
    paddingVertical: 4,
    textAlign: 'center'
  },
  authTitle: {
    fontWeight: 'bold',
    paddingVertical: 10,
    textAlign: 'center',
    color: 'white',
    fontSize: 22,
    backgroundColor: DarkerBlue
  },
  paragraph: {
    marginVertical: 8,
    lineHeight: 20
  },
  container: {
    flex: 1,
    fontSize: 16,
    // marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 45,
    backgroundColor: 'white',
    width: '100vw',
    height: 'auto',
    minHeight:
      Dimensions.get('window').height - Platform.OS === 'android'
        ? StatusBar.currentHeight
        : 45
  },
  main: {
    flex: '0 1 100%',
    width: '100%',
    maxWidth: 768,
    marginTop: 5,
    marginHorizontal: 'auto',
    paddingHorizontal: 10
  },
  label: {
    fontSize: 22,
    color: DarkerBlue
  },

  input: {
    borderWidth: 1.5,
    borderColor: DarkerBlue,
    padding: 5,
    marginVertical: 5,
    fontSize: 18,
    borderRadius: 5
  },

  property: {
    fontWeight: 'bold',
    color: DarkerBlue,
    fontSize: 16
  },
  price: {
    fontWeight: 'bold',
    color: CurrencyColor,
    textAlignVertical: 'center',
    fontSize: 16
  },
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: DarkerBlue
  },
  amountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: DarkerBlue,
    marginVertical: 6,
    paddingVertical: 6
  },
  link: {
    marginVertical: 5,
    color: DarkerBlue,
    fontSize: 16,
    textDecorationLine: 'underline'
  },
  cardPropertys: {
    flex: 0.4
  },
  cardPropertyText: {
    paddingVertical: 5,
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: 16
  },
  cardValues: {
    flex: 0.6
  },
  cardValueText: {
    color: CurrencyColor,
    paddingVertical: 5,
    fontWeight: 'bold',
    textAlign: 'right',
    fontSize: 16
  },
  date: {
    color: CurrencyColor
  },
  camPlace: {
    backgroundColor: 'red',
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  screen: {
    height: '100%'
  },
  qrTextContainer: {
    position: 'absolute',
    width: '100%',
    top: 0
  },
  qrText: {
    paddingVertical: 10,
    backgroundColor: TransparentBlue,
    justifyContent: 'center',
    textAlign: 'center',
    color: 'white',
    fontSize: 20
  },
  centeredView: {
    width: '100%',
    flex: '1 1 100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 22
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5
  }
})
