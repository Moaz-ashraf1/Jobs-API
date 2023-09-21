const { check } = require("express-validator");

const bcrypt = require("bcrypt");
const vaildatorMiddleware = require("../../middleware/vaildatorMiddleware");

const User = require("../../model/userModel");

exports.signupVaildator = [
  check("name")
    .notEmpty()
    .withMessage("name must be provided")
    .isLength({ min: 3 })
    .withMessage("To short name"),

  check("email")
    .notEmpty()
    .withMessage("email must be provided")
    .isEmail()
    .withMessage("invalid email address format")
    .custom(async (val, { req }) => {
      const user = await User.findOne({ email: val });
      if (user) {
        throw new Error("email is already exists");
      }
    }),
  vaildatorMiddleware,
];

exports.loginValidator = [
  check("email")
    .notEmpty()
    .withMessage("Email must be provided")
    .custom(async (val, { req }) => {
      const user = await User.findOne({ email: val });
      if (!user) {
        throw new Error("Email not found");
      }
      return true;
    }),

  check("password")
    .notEmpty()
    .withMessage("Your password must be provided")
    .custom(async (val, { req }) => {
      const user = await User.findOne({ email: req.body.email });
      if (!user) {
        throw new Error("Incorrect email or password");
      }

      const isPasswordValid = await bcrypt.compare(val, user.password);
      if (!isPasswordValid) {
        throw new Error("Incorrect email or password");
      }

      return true;
    }),

  vaildatorMiddleware,
];

exports.resetPasswordVaildator = [
  check("confirmPassword").custom((val, { req }) => {
    if (val !== req.body.password) {
      throw new Error("password confirm should be same as password");
    }
    return true;
  }),

  vaildatorMiddleware,
];
