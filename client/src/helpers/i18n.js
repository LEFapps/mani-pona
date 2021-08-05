import i18n from 'i18n-js';
// Set the key-value pairs for the different languages you want to support.
i18n.translations = {
	'nl-BE': {
		NotAuthorizedException: 'Foute gebruikersnaam of wachtwoord.',
		UserNotFoundException: 'Gebruiker bestaat niet.'
	},
	'en-BE': {
		NotAuthorizedException: 'Incorrect username or password!',
		UserNotFoundException: 'User does not exist.'
	}
};

i18n.fallbacks = true;

//err from aws
//err sign in Object {
//  "code": "NotAuthorizedException",
//  "message": "Incorrect username or password.",
//  "name": "NotAuthorizedException",
//}

//err sign in Object {
//  "code": "UserNotFoundException",
//  "message": "User does not exist.",
//  "name": "UserNotFoundException",
//}
