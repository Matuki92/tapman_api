'use strict';
// imports ------------------------------------------
const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
// dbs to use
const Venue = require('../models/venue');
// --------------------------------------------------

// get client dns out of hostname
const getClientDns = hostname => {
  return hostname === 'localhost' ? 'dev' : hostname.substr(0, hostname.indexOf('.'));
};

// TAPMAN VENUE CLIENT

// check if dns exists to let client load with venue settings
router.get('/:dns', (req, res, next) => {
  const io = req.app.get('io');
  if (getClientDns(req.hostname) !== req.params.dns) {
    return res.status(401).json({ code: 'unauthorized' });
  }
  Venue.findOne({ dns: req.params.dns })
    .populate({
      path: 'beers',
      model: 'Beer'
    })
    .then(venue => {
      if (!venue) {
        return res.status(404).json({ code: 'not-found' });
      }

      const activeBeers = venue.beers.filter(beer => {
        return beer.active;
      });

      const data = {
        name: venue.name,
        beers: activeBeers,
        logged: !!req.session.currentVenue,
        // !!!!!!!!!!! EXPERIMENTAL !!!!!!!!!!!!
        // custom layout settings, should be imported among the rest of the venue info on load
        settings: {
          maxBeers: 15,
          logoUrl: 'http://guma.tapman.beer/images/full-logo.png',
          logoHeight: 150
        // font ?
        // background: (color for body background, or url for image)
        // card-background: (choose between custom beer card color or use default variable color)
        // split-screen: (split beer card layout in two rows or use default single row)
        // !!!!!!!!!!! EXPERIMENTAL !!!!!!!!!!!!
        }
      };
      res.json(data);
    })
    .catch(next);
});

// check if entered password match with current venue's adminpwd
router.post('/login', (req, res, next) => {
  const adminpwd = req.body.adminpwd;
  const dns = req.body.dns;

  if (req.session.currentVenue ||
    getClientDns(req.hostname) !== dns) {
    return res.status(401).json({ code: 'unauthorized' });
  }

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

        return res.status(204).send();
      } else {
        return res.status(401).json({ code: 'wrong-password' });
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

// TAPMAN MAIN CLIENT //

// ----------------- TO DO -------------------
// get venues that belong to session userId

// router.get('/own', (req, res, next) => {
//   if (!req.session.currentUser) {
//     return res.status(401).json({ code: 'unauthorized' });
//   }

//   const userId = req.session.currentUser._id;

//   User.findOne({ _id: userId })
//     .populate({
//       path: 'venues',
//       model: 'Venue'
//     })
//     .then(user => {
//       const data = {
//         venues: user.venues
//       };

//       res.json(data);
//     })
//     .catch(next);
// });

// ----------------- TO DO -------------------
// create new venue and add to current user's venues

// router.post('/new', (req, res, next) => {
//   if (!req.session.currentUser) {
//     return res.status(401).json({ code: 'unauthorized' });
//   }

//   const dns = req.body.dns;
//   const name = req.body.name;
//   const adminpwd = req.body.adminpwd;

//   if (!dns || !name || !adminpwd) {
//     return res.status(422).json({ code: 'validation' });
//   }

//   Venue.findOne({ dns }, 'dns')
//     .then((venueExists) => {
//       if (venueExists) {
//         return res.status(422).json({ code: 'dns-not-unique' });
//       }

//       const salt = bcrypt.genSaltSync(11);
//       const hashPass = bcrypt.hashSync(adminpwd, salt);

//       const newVenue = new Venue({
//         dns,
//         name,
//         adminpwd: hashPass
//       });

//       newVenue.save()
//         .then((venue) => {
//           User.findOneAndUpdate(
//             { _id: req.session.currentUser._id },
//             { $addToSet: { venues: venue._id } },
//             { new: true }
//           )
//             .populate({
//               path: 'venues',
//               model: 'Venue'
//             })
//             .then((user) => {
//               res.json(user);
//             });
//         });
//     })
//     .catch(next);
// });

module.exports = router;
