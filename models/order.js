const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
 item : String,
 qty : Number,
 userId : {
     type : Schema.Types.ObjectId,
     ref : 'user'
 } ,
 cost : Number,
 from : String,
 to : String
});

module.exports = mongoose.model('order',orderSchema);
