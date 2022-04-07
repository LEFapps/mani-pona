# Stripe integration

## Setup

### 1 Create an API Key

Populate the following fields:

```YML
STRIPE_PUBLIC_KEY # Publishable key
STRIPE_PRIVATE_KEY # Secret key
```

You can find the API keys in your Stripe dashboard under _Developers › API keys_

### 2 Create a webhook

In your Stripe dashboard, select _Webhooks_. Create a new webhook with the following details:

```YML
Endpoint URL: {{HttpApiUrl}}/{{stage}}/stripe
Description: Capture payments for Loreco ({{stage}})
```

And select the following events to listen to: `[√] Select all Checkout events`.

After creating the webhook, add the _Signing Secret_ to the .env file:

```YML
STRIPE_WEBHOOK_SECRET # webhook signing secret
```

### 3 Deploy the app

After deployment, the endpoint should be able to catch Stripe calls from the checkout page.
