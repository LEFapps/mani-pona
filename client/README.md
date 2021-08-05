# LoREco Front-end Application

This is the Front-end application for the LoREco project. The project is made with  [React Native](https://reactnative.dev/) in combination with [Expo](https://expo.io/). For the Authentication [AWS Amplify](https://docs.amplify.aws/) is used.

 **This project is not finished and still under development.**

# Project setup

```
npm install
```
## Configure AWS Amplify

Before using the project you will have to sign up for an [AWS Account](https://portal.aws.amazon.com/billing/signup?nc2=h_ct&src=header_signup&redirect_url=https%3A%2F%2Faws.amazon.com%2Fregistration-confirmation#/start) and install and configure the Amplify CLI. [Documentation](https://docs.amplify.aws/start/getting-started/installation/q/integration/js#install-and-configure-the-amplify-cli).

Install Amplify CLI:
```
npm install -g @aws-amplify/cli
```
Configure amplify:
``` 
amplify configure
```
Follow the steps:
1. sign in to your Account
2. specify the AWS Region
3. create a new IAM user

Create Amplify in the React Native project:
```
amplify init
```
Follow the steps:
1. select or create environment
2. chose default editor
3. use AWS profile you created in previous step

## Start the project 
After you have correctly installed and configured the Amplify CLI, you can start the application with one of the following commands.

```
npm start
```
Or if Expo CLI is already installed
```
expo start
```

## To display our provided data
The app makes use of a mockClient. We made some changes to it so if the data is not displaying in the app it means that the mockClient is not updated yet. If you would like to use our data you can replace the content op the node_modules/mani-pona/src/client/mockClient.js file with the content of the [proposalMockClient.js](proposalMockClient.js). Then save the file and restart expo and the data should display.
