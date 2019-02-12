const mongoose = require('mongoose');
const findOrCreate = require("mongoose-findorcreate");
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const User = new Schema({
    automaticId: String,
    firstName: String,
    lastName: String,
    email: String,
    accessToken: String,
    refreshToken: String
});

User.plugin(passportLocalMongoose);
User.plugin(findOrCreate);
module.exports = mongoose.model('User', User);