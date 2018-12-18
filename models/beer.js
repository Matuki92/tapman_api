'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const ObjectId = Schema.Types.ObjectId;

const beerSchema = new Schema({
  name: String,
  style: String,
  abv: Number,
  brewery: String,
  country: String,
  price: Number,
  color: String
});

const Beer = mongoose.model('Beer', beerSchema);

module.exports = Beer;
