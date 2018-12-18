'use strict';

const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;

const venueSchema = new Schema({
  dns: String,
  name: String,
  beers: {
    type: [ObjectId],
    ref: 'Beer'
  },
  adminpwd: String
});

const Venue = mongoose.model('Venue', venueSchema);

module.exports = Venue;
