import config from './sls-output.json'

export default {
  Auth: {
    mandatorySignIn: false,
    region: config.Region,
    userPoolId: config.UserPoolId,
    identityPoolId: config.IdentityPoolId,
    userPoolWebClientId: config.UserPoolClientId
  },
  API: {
    graphql_endpoint: config.ServiceEndpoint,
    graphql_endpoint_iam_region: config.Region
  },
  Storage: {
    AWSS3: {
      bucket: config.ClientBucket,
      region: config.Region
    }
  }
}
