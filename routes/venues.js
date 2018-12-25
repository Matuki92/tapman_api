'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();

// dbs to use
const Venue = require('../models/venue');
const User = require('../models/user');

// TAPMAN MAIN CLIENT //
// get venues that belong to session userId
router.get('/own', (req, res, next) => {
  if (!req.session.currentUser) {
    return res.status(401).json({ code: 'unauthorized' });
  }

  const userId = req.session.currentUser._id;

  User.findOne({ _id: userId })
    .populate({
      path: 'venues',
      model: 'Venue'
    })
    .then(user => {
      const data = {
        venues: user.venues
      };

      res.json(data);
    })
    .catch(next);
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

      const newVenue = new Venue({
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

// modify user's selected venue
router.put('/edit', (req, res, next) => {

});

// TAPMAN VENUE CLIENT //
router.get('/me', (req, res, next) => {
  if (req.session.currentVenue) {
    res.json(req.session.currentVenue);
  } else {
    res.status(404).json({ code: 'not-found' });
  }
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

router.post('/logout', (req, res) => {
  if (req.body.dns === req.session.currentVenue.dns) {
    req.session.currentVenue = null;
    return res.status(204).send();
  } else {
    return res.status(404).json({ code: 'not-found' });
  }
});

// check if dns exists to let client load the venue
router.get('/:dns', (req, res, next) => {
  Venue.findOne({ dns: req.params.dns })
    .then(venue => {
      if (!venue) {
        return res.status(404).json({ code: 'not-found' });
      }
      res.json(venue);
    })
    .catch(next);
});

module.exports = router;
