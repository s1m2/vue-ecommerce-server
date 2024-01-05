require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const bodyParser = require("body-parser");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const PORT = process.env.PORT || 4242;
const domain = process.env.ENVIRONMENT === "development" ? process.env.LOCAL_DOMAIN : process.env.PRODUCTION_DOMAIN ;

const corsOptions = {
  origin: domain,
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  methods: 'POST',
  credentials: true,
}

const stripePaymentConfig = {
  currency: "gbp",
  automatic_payment_methods: {
    enabled: true
  }
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

app.post("/create-payment-intent", async (req, res) => {
  const { amount } = req.body;

  try {
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      ...stripePaymentConfig
    });

    return res.status(200).send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    return res.status(error.statusCode).json({ message: error.message });
  }
});

app.listen(PORT, () => console.log(`Running on port ${PORT}`));
