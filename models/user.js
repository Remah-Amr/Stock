const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: String,
  name: String,
  password: String,
  imageUrl:String,
  isAdmin : {
      type : Boolean,
      default : false
  },
  shop : String
});

module.exports = mongoose.model('user',userSchema);
