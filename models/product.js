const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSchema = new Schema({
  title : String,
  price : Number,
  qty : Number,
  imageUrl : String,
  desc : String,
  shop : String
});

module.exports = mongoose.model('product',productSchema);
