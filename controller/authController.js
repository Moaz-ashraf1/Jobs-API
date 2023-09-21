const bcrypt = require("bcrypt");
const asyncHandler = require("express-async-handler");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../model/userModel");
const AppError = require("../utilis/appError");
const sendEmail = require("../utilis/sendEmail");
const { sentitizeUser } = require("../utilis/senitizeDate");
const generateToken = async (user) => {
  const token = await jwt.sign({ _id: user._id }, process.env.SECRET_KEY, {
    expiresIn: 90 * 24 * 60 * 60, // 90 days
  });

  return token;
};

const welcomeEmailHTML = (user) => {
  const welcomeEmail = `
  <html>
    <head>
      <style>
        /* Add your CSS styles here */
        body {
          font-family: Arial, sans-serif;
          background-color: #f0f0f0;
          margin: 0;
          padding: 0;
        }

        h1 {
          color: #333;
        }

        p {
          font-size: 16px;
          line-height: 1.6;
          color: #555;
        }

        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #fff;
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }

        /* Add more styles as needed */
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Welcome to Your Website!</h1>
        <p>Hello ${user.name},</p>
        <p>Welcome to Your Website! We're excited to have you as a new member of our community.</p>
        <!-- Add more HTML content here -->
        <p>Best regards,<br>Your Website Team</p>
      </div>
    </body>
  </html>
`;

  return welcomeEmail;
};

exports.signup = asyncHandler(async (req, res, next) => {
  const { name, email, password } = req.body;

  const user = await User.create({
    name,
    email,
    password,
  });

  const token = await generateToken(user);

  await sendEmail({
    to: user.email,
    subject: "Welcome to jobs website",
    text: "Welcome to jobs website! We're excited to have you as a new member of our community. Thank you for choosing us!",
    html: welcomeEmailHTML(user),
  });

  res.status(201).json({
    status: "success",
    data: sentitizeUser(user),
    token,
  });
});

exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(new AppError("Incorrecte email or password", 401));
  }

  const token = await generateToken(user);

  res.status(200).json({
    status: "success",
    data: sentitizeUser(user),
    token,
  });
});

exports.protect = asyncHandler(async (req, res, next) => {
  // 1) Check if token exist, if exist get it
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(
      new AppError(
        "You are not logged in, please login to get access to this route.",
        401
      )
    );
  }
  // 2) verify token
  const decoded = await jwt.verify(token, process.env.SECRET_KEY);

  // 3) check if user is exist
  const currentUser = await User.findById(decoded._id);

  if (!currentUser) {
    return next(
      new AppError("the user that belong to this token does not exist", 403)
    );
  }
  // 4) check if user changed his password after token created
  if (currentUser.changePasswordAt) {
    const changePasswordAt = parseInt(
      currentUser.changePasswordAt.getTime() / 1000,
      10
    );
    if (changePasswordAt > decoded.iat) {
      return next(
        new AppError("User changed password after token created"),
        401
      );
    }
  }
  if (!currentUser.active) {
    return next(new AppError("This account has been deactivated"), 401);
  }
  req.currentUser = currentUser;
  next();
});

exports.allowedTo = (...roles) => {
  if (!roles.includes(req.currentUser.role)) {
    return next(new AppError("You are not allowed to access this route", 401));
  }

  next();
};

exports.forgotPassword = asyncHandler(async (req, res, next) => {
  // 1) Get user by email
  const user = await User.findOne({ email: req.body.email });

  // 2) If user is already existing, generate random 6 digits and save it in db
  if (!user) {
    return next(
      new AppError(`There is no user with that email ${req.body.email}`, 404)
    );
  }
  const resetCode = JSON.stringify(Math.floor(100000 + Math.random() * 900000));

  // 3) save hased reset code,expiration time and password reset verified in db
  user.hashResetCode = crypto
    .createHash("sha256")
    .update(resetCode)
    .digest("hex");

  user.passwordResetExpTime = Date.now() + 10 * 60 * 1000;
  user.passwordResetVertified = false;

  await user.save();

  // 4) send reset code via email
  const message = `Hi ${user.name},\n we received a request to reset the password on your jop Account.\n ${resetCode}\n Enter this code to complete the reset.\n Thanks for helping us keep your account secure.\n`;
  try {
    await sendEmail({
      to: user.email,
      subject: "Your password reset code (vaild for 10 min",
      text: message,
    });
  } catch (error) {
    console.log(err);
    user.passwordResetCode = undefined;
    user.passwordExpTime = undefined;
    user.passwordResetVerified = undefined;
    await user.save();

    return next(new AppError("There is an error in sending email", 500));
  }
  res
    .status(200)
    .json({ status: "success", message: "Reset code sent to email" });
});

exports.verifyPassResetCode = asyncHandler(async (req, res, next) => {
  const hashResetCode = crypto
    .createHash("sha256")
    .update(req.body.resetCode)
    .digest("hex");

  const user = await User.findOne({
    hashResetCode,
    passwordResetExpTime: { $gt: Date.now() },
  });

  if (!user) {
    return next(new Error("invaild hash reset code"));
  }
  // 2) Reset code vaild
  user.passwordResetVertified = true;
  user.save();
  res.status(200).json({
    status: "success",
  });
});

exports.resetPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  if (!user) {
    return next(new AppError("user not found", 401));
  }

  if (!user.passwordResetVertified) {
    return next(new AppError("Reset code not verified"));
  }

  user.hashResetCode = undefined;
  user.passwordResetExpTime = undefined;
  user.passwordResetVertified = undefined;

  user.password = req.body.password;
  user.save();

  const token = await generateToken(user);
  res.status(200).json({ token });
});
