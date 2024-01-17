require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const bodyParser = require("body-parser");
const rateLimit = require("express-rate-limit");
const winston = require("winston");
const expressWinston = require("express-winston");
const responseTime = require("response-time");
const helmet = require("helmet");

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();
const PORT = process.env.PORT || 4242;
const domain = process.env.ENVIRONMENT === "production" ? process.env.PRODUCTION_DOMAIN : process.env.LOCAL_DOMAIN;

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

app.use(
  rateLimit({
    windowMs: 15* 60 * 1000,
    max: 5, // 5 requests,
    validate: {xForwardedForHeader: false}
  })
);
app.use(helmet());
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(responseTime());
app.use(
  expressWinston.logger({
    transports: [new winston.transports.Console()],
    format: winston.format.json(),
    statusLevels: true,
    meta: false,
    msg: "HTTP {{req.method}} {{req.url}} {{res.statusCode}} {{res.responseTime}}ms",
    expressFormat: true,
    ignoreRoute() {
      return false;
    }
  })
);

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
