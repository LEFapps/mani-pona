# Stripe integration

## Setup

### 1 Create an API Key

Populate the following fields:

```YML
STRIPE_PUBLIC_KEY=pk_123ABC # Publishable key
STRIPE_PRIVATE_KEY=sk_123ABC # Secret key
```

You can find the API keys in your Stripe dashboard under _Developers › API keys_

### 2 Create a webhook

In your Stripe Developers dashboard, select _Webhooks_. Create a new webhook with the following details:

```YML
Endpoint URL: {{HttpApiUrl}}/{{stage}}/stripe
Description: Capture payments for Loreco ({{stage}})
```

And select the following events to listen to: `[√] Select all Checkout events`.

After creating the webhook, add the _Signing Secret_ to the .env file:

```YML
STRIPE_WEBHOOK_SECRET=whsec_123ABC # webhook signing secret
```

### 3 Create a product

Go to _Products_ in your Stripe dashboard and click on _+ Add product_. Fill in the following details:

```YML
Name: Klaver
Image: <logo>
Description: explain the exchange rate (e.g. 1 Klaver = € 1)
Pricing: standard pricing, one time
Price: fill the price for 1 klaver, e.g. € 1
```

After saving, click on the product in the list to see the details. Copy the _Pricing API ID_ (e.g. price_123ABC) and fill this in your .env file:

```YML
STRIPE_PRICE_ID=price_123ABC # pricing API ID
```

### 4 Deploy the app

After deployment, the endpoint should be able to catch Stripe calls from the checkout page.
