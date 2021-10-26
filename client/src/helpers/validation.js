import isString from 'lodash/isString'

export function validateEmail (email) {
  if (!/^\w+([\+\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
    return 'Voer een geldig e-mailadres in!'
  } else return null
}

export function validatePasswordLogIn (password) {
  if (!password) {
    return 'Voer een geldig wachtwoord in!'
  } else return null
}

export function validatePasswordRepeat (password, password2) {
  if (!password || !password2) {
    return 'Voer een geldig wachtwoord in!'
  } else if (password !== password2) {
    return 'Je wachtwoorden komen niet overeen!'
  } else return null
}

export function validatePassword (password) {
  if (
    !/(?=(.*[0-9]))((?=.*[A-Za-z0-9])(?=.*[A-Z])(?=.*[a-z]))^.{8,}$/i.test(
      password
    )
  ) {
    return 'Wachtwoord moet minimaal 1 cijfer, 1 kleine letter, 1 hoofdletter en 1 speciaal karakter bevatten en minimaal 8 tekens lang zijn, probeer opnieuw'
  } else if (!password) {
    return 'Wachtwoord niet ingevuld!'
  } else return null
}

export function validateRegex (value, regex, required) {
  if (isString(regex)) {
    const regexPool = {
      date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/
    }
    const reg = regexPool[regex]
    if (reg) regex = reg
    else regex = new RegExp(regex)
  }
  if (!!value && !regex.test(value)) {
    return 'Je hebt niet het juiste formaat ingevuld!'
  } else if (!value && required) {
    return 'Je hebt niets ingevuld!'
  } else return null
}

export function validateVerificationCode (code) {
  if (!code || code.length !== 6) {
    return 'Voer een geldige verificatiecode in!'
  } else return null
}

export function validateNotEmpty (value) {
  if (!value) {
    return 'Dit veld is verplicht!'
  } else return null
}

export function validateCode (code) {
  if (!code) {
    return 'Voer een geldige code in!'
  } else return null
}
