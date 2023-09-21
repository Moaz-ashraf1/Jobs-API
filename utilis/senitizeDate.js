exports.sentitizeUser = function (user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
  };
};
