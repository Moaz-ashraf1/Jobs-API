const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "name of user is required"],
    },

    email: {
      type: String,
      required: [true, "email of user is required"],
    },

    password: {
      type: String,
      required: [true, "password of user is required"],
    },

    changePasswordAt: Date,

    active: {
      type: Boolean,
      default: true,
    },

    role: {
      type: String,
      enum: ["admin", "manager", "employee"],
    },
    hashResetCode: String,
    passwordResetExpTime: Date,
    passwordResetVertified: Boolean,
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  next();
});

module.exports = mongoose.model("User", userSchema);
// $2b$12$JZB7woZLoLfW8BRUImLhruoVcxP/MjekGZIHHoGtb9Y.cRqcDtGT2
