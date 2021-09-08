import React from 'react'
import { StyleSheet, Text, View, Dimensions } from 'react-native'
// import { MaterialIcons } from '@expo/vector-icons';
// import { useNavigation } from '@react-navigation/native';

export default function Header (props) {
  // const navigation = useNavigation();

  // const openMenu = () => {
  // 	navigation.openDrawer();
  // };
  return (
    <View style={styles.header}>
      {/* <MaterialIcons name={props.icon} size={28} onPress={openMenu} style={styles.icon} /> */}
      <View>
        <Text style={styles.headerText}>{props.title}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    width: Dimensions.get('window').width,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerText: {
    fontWeight: 'bold',
    fontSize: 20,
    color: 'white'
  },
  icon: {
    position: 'absolute',
    left: 10,
    color: 'white'
  }
})
