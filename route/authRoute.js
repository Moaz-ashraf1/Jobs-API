const express = require("express");

const router = express.Router();
const {
  signupVaildator,
  resetPasswordVaildator,
  loginValidator,
} = require("../utilis/vaildators/authVaildator");
const {
  signup,
  login,
  forgotPassword,
  verifyPassResetCode,
  resetPassword,
} = require("../controller/authController");

router.route("/signup").post(signupVaildator, signup);
router.route("/login").post(loginValidator, login);
router.route("/forgotPassword").post(forgotPassword);
router.route("/verifyPassResetCode").post(verifyPassResetCode);
router.route("/resetPassword").post(resetPasswordVaildator, resetPassword);
module.exports = router;
