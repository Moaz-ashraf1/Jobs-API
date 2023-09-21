const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const compression = require("compression");
const cors = require("cors");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const { rateLimit } = require("express-rate-limit");

const authRouter = require("./route/authRoute");
const jobsRouter = require("./route/jobRoute");

const { globalError } = require("./middleware/globalErrorHandler");
const { notFound } = require("./middleware/notFound");

const app = express();

// Enable other domains to access your application
app.use(cors());
app.options("*", cors());

// Compress all responses
app.use(compression());

// Parse JSON requests with a limit of 20kb
app.use(express.json({ limit: "20kb" }));

// Apply data sanitization to prevent NoSQL Injection attacks
app.use(mongoSanitize());

// Apply XSS (Cross-Site Scripting) protection
app.use(xss());

// Apply rate limiting to API requests
// Limit each IP to 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  message:
    "Too many accounts created from this IP, please try again after an hour",
});
app.use("/api/", apiLimiter);

// Define API routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/jobs", jobsRouter);

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});

// Connect to the MongoDB database
mongoose.connect(process.env.DATABASE_URI).then(() => {
  console.log("Database connection established");
});

// Handle global errors
app.use(globalError);

// Handle unmatched routes
app.use("*", notFound);
