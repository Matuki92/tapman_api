'use strict';

const express = require('express');
const router = express.Router();

// dbs to use
const Venue = require('../models/venue');
const Beer = require('../models/beer');

// get list of current venue's active beers only
router.get(':venue/active', (req, res, next) => {

});

// get full list of current venue's beers
router.get(':venue/all', (req, res, next) => {

});

// add a new beer to current venue
router.post('/new', (req, res, next) => {
  if (!req.session.currentVenue) {
    return res.status(401).json({ code: 'unauthorized' });
  }

  const newBeer = new Beer({
    name: req.body.name,
    style: req.body.style,
    abv: req.body.abv,
    brewery: req.body.brewery,
    country: req.body.country,
    price: req.body.price,
    color: req.body.color
  });

  for (let item in newBeer) {
    if (!item) {
      return res.status(422).json({ code: 'validation' });
    }
  }

  newBeer.save()
    .then(beer => {
      Venue.findOneAndUpdate(
        { _id: req.session.currentVenue._id },
        { $addToSet: { beers: beer._id } },
        { new: true }
      )
        .populate({
          path: 'beers',
          model: 'Beer'
        })
        .then(venue => {
          res.json(venue);
        });
    })
    .catch(next);
});

// modify venue's current beer
router.put('/edit', (req, res, next) => {

});

module.exports = router;
