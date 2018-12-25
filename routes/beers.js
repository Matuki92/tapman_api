'use strict';

const express = require('express');
const router = express.Router();

// dbs to use
const Venue = require('../models/venue');
const Beer = require('../models/beer');

// TAPMAN MAIN CLIENT //
// get list of current venue's active beers only
router.get('/active/:dns', (req, res, next) => {
  Venue.findOne({ dns: req.params.dns })
    .populate({
      path: 'beers',
      model: 'Beer'
    })
    .then(result => {
      if (!result) {
        res.status(404).json({ code: 'not-found' });
      }
      const activeBeers = result.beers.filter(beer => {
        return beer.active;
      });

      const data = {
        beers: activeBeers
      };
      res.json(data);
    })
    .catch(next);
});

// get full list of current venue's beers
router.get('/all', (req, res, next) => {
  Beer.find({})
    .then(result => {
      if (!result) {
        res.status(404).json({ code: 'not-found' });
      }
      const data = {
        beers: result
      };
      res.json(data);
    })
    .catch(next);
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
    ibu: req.body.ibu,
    brewery: req.body.brewery,
    country: req.body.country,
    price: req.body.price,
    color: req.body.color,
    active: req.body.active
  });

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
  if (!req.session.currentVenue) {
    return res.status(401).json({ code: 'unauthorized' });
  }

  const modifiedBeer = {
    name: req.body.name,
    style: req.body.style,
    abv: req.body.abv,
    ibu: req.body.ibu,
    brewery: req.body.brewery,
    country: req.body.country,
    price: req.body.price,
    color: req.body.color,
    active: req.body.active
  };

  Beer.findOneAndUpdate({ _id: req.body._id }, modifiedBeer, { new: true })
    .then(beer => {
      res.json(beer);
    })
    .catch(next);
});

module.exports = router;
