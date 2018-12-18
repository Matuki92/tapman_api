'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// dbs to use
const Venue = require('../models/venue');
const User = require('../models/user');

router.get('/me', (req, res, next) => {
  if (req.session.currentVenue) {
    res.json(req.session.currentVenue);
  } else {
    res.status(404).json({ code: 'not-found' });
  }
});

// get venues that belong to session userId
router.get('/own', (req, res, next) => {

});

// create new venue and add to current user's venues
router.post('/new', (req, res, next) => {
  if (!req.session.currentUser) {
    return res.status(401).json({ code: 'unauthorized' });
  }

  const dns = req.body.dns;
  const name = req.body.name;
  const adminpwd = req.body.adminpwd;

  if (!dns || !name || !adminpwd) {
    return res.status(422).json({ code: 'validation' });
  }

  Venue.findOne({ dns }, 'dns')
    .then((venueExists) => {
      if (venueExists) {
        return res.status(422).json({ code: 'dns-not-unique' });
      }

      const salt = bcrypt.genSaltSync(11);
      const hashPass = bcrypt.hashSync(adminpwd, salt);

      const newVenue = Venue({
        dns,
        name,
        adminpwd: hashPass
      });

      newVenue.save()
        .then((venue) => {
          User.findOneAndUpdate(
            { _id: req.session.currentUser._id },
            { $addToSet: { venues: venue._id } },
            { new: true }
          )
            .populate({
              path: 'venues',
              model: 'Venue'
            })
            .then((user) => {
              res.json(user);
            });
        });
    })
    .catch(next);
});

// check if entered password match with current venue's adminpwd
router.post('/login', (req, res, next) => {
  if (req.session.currentVenue) {
    return res.status(401).json({ code: 'unauthorized' });
  }

  const adminpwd = req.body.adminpwd;
  const dns = req.body.dns;

  if (!dns || !adminpwd) {
    return res.status(422).json({ code: 'validation' });
  }

  Venue.findOne({ dns })
    .then((venue) => {
      if (!venue) {
        return res.status(404).json({ code: 'not-found' });
      }
      if (bcrypt.compareSync(adminpwd, venue.adminpwd)) {
        req.session.currentVenue = venue;
        return res.json(venue);
      } else {
        return res.status(404).json({ code: 'not-found' });
      }
    })
    .catch(next);
});

// modify user's selected venue
router.put('/edit', (req, res, next) => {

});
module.exports = router;
