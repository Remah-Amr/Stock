const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const pvtMsgSchema = new Schema({
  personName:String,
  personImageUrl:String,
  message: String,
  Date:{
    type:String
  },
  users : Array,
  type : String
});

module.exports = mongoose.model('pvtMsg',pvtMsgSchema);
