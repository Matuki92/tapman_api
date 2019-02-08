'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const ObjectId = Schema.Types.ObjectId;

const beerSchema = new Schema({
  name: String,
  style: String,
  abv: Number,
  ibu: Number,
  brewery: String,
  country: String,
  price: Number,
  color: {
    type: String,
    enum: ['#e7c61d', '#b95c1d', '#950000', '#67371A', '#251912']
  },
  active: Boolean
});

const Beer = mongoose.model('Beer', beerSchema);

module.exports = Beer;
