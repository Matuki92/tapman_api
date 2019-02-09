'use strict';
// imports ------------------------------------------
const express = require('express');
const router = express.Router();
// dbs to use
const Venue = require('../models/venue');
const Beer = require('../models/beer');
//  -------------------------------------------------

// gets client out of hostname
const getClientDns = hostname => {
  return hostname === 'localhost' ? 'dev' : hostname.substr(0, hostname.indexOf('.'));
};

// SOCKET CONNECTION AND EVENTS
// ----------------------------

// this function is called when a change is made in a venue's settings or beers
// it looks for all the clients matching the updated venue and sends the update
const updateContent = (hostname, io) => {
  const foundClients = io.connectedClients.filter(client => client.clientDNS === hostname);

  if (!foundClients) {
    return;
  }
  foundClients.forEach(client => {
    io.sockets.connected[client.socketId].emit('Update-Venue');
  });
};

// check a received beer's properties before storing them to the db
// this is the same code that runs on every input after submitting the data in the app's form
const checkInputValidity = input => {
  const isIbuField = input.name === 'ibu';
  const isNumber = typeof input.value === 'number';
  const isString = typeof input.value === 'string';
  const isBoolean = typeof input.value === 'boolean';
  const isEmpty = !input.value > 0;

  if (isIbuField && (isNumber || input.value === '')) { return true; }

  switch (input.name) {
  case 'abv' || 'price': if (isNumber && !isEmpty) { return true; };break;
  case 'active': if (isBoolean) { return true; };break;
  default: if (isString && !isEmpty) { return true; };break;
  }

  return false;
};

// TAPMAN VENUE CLIENT

// get a venue's beer search result
router.get('/:dns/:value', (req, res, next) => {
  Venue.findOne({ dns: req.params.dns })
    .populate({
      path: 'beers',
      model: 'Beer'
    })
    .then(result => {
      if (!result) {
        res.status(404).json({ code: 'not-found' });
      }
      const beers = result.beers.filter(beer => {
        return beer.name.includes(req.params.value);
      });

      const data = {
        beers
      };
      res.json(data);
    })
    .catch(next);
});

// add a new beer to current venue
router.post('/new', (req, res, next) => {
  const receivedBeer = req.body.beer;
  const hostname = getClientDns(req.hostname);

  if (!req.session.currentVenue) {
    return res.status(401).json({ code: 'unauthorized' });
  }

  const newBeer = new Beer({
    name: receivedBeer.name,
    style: receivedBeer.style,
    abv: receivedBeer.abv,
    ibu: receivedBeer.ibu,
    brewery: receivedBeer.brewery,
    country: receivedBeer.country,
    price: receivedBeer.price,
    color: receivedBeer.color,
    active: receivedBeer.active
  });

  for (let i in newBeer) {
    if (checkInputValidity(i)) {
      return res.status(422).json({ code: 'validation' });
    }
  }

  newBeer.save()
    .then(beer => {
      Venue.findOneAndUpdate(
        { _id: req.session.currentVenue._id },
        { $addToSet: { beers: beer._id } }
      )
        .populate({
          path: 'beers',
          model: 'Beer'
        })
        .then(() => {
          res.status(204).send();
          if (newBeer.active) {
            const io = req.app.get('io');
            updateContent(hostname, io);
          }
        });
    })
    .catch(next);
});

// modify venue's current beer
router.put('/edit', (req, res, next) => {
  const receivedBeer = req.body.beer;
  const hostname = getClientDns(req.hostname);

  if (!req.session.currentVenue ||
     req.body.dns !== hostname) {
    return res.status(401).json({ code: 'unauthorized' });
  }

  const modifiedBeer = {
    name: receivedBeer.name,
    style: receivedBeer.style,
    abv: receivedBeer.abv,
    ibu: receivedBeer.ibu,
    brewery: receivedBeer.brewery,
    country: receivedBeer.country,
    price: receivedBeer.price,
    color: receivedBeer.color,
    active: receivedBeer.active
  };

  for (let i in modifiedBeer) {
    if (checkInputValidity(i)) {
      return res.status(422).json({ code: 'validation' });
    }
  }

  Beer.findOneAndUpdate({ _id: req.body.beer._id }, modifiedBeer)
    .then(() => {
      res.status(204).send();
      if (modifiedBeer.active) {
        const io = req.app.get('io');
        updateContent(hostname, io);
      }
    })
    .catch(next);
});

router.delete('/delete', (req, res, next) => {
  const receivedBeerId = req.body.beerId;
  const isBeerActive = req.body.active;
  const hostname = getClientDns(req.hostname);

  if (!req.session.currentVenue ||
     req.body.dns !== hostname) {
    return res.status(401).json({ code: 'unauthorized' });
  }

  Venue.findOneAndUpdate(
    { _id: req.session.currentVenue._id },
    { $pull: { beers: receivedBeerId } }
  )
    .then(() => {
      res.status(204).send();
      if (isBeerActive) {
        const io = req.app.get('io');
        updateContent(hostname, io);
      }
    })
    .catch(next);
});

// get all beers in db
// -- NOT BEING USED BY THE APP --
router.get('/all', (req, res, next) => {
  Beer.find({})
    .then(result => {
      res.json(result);
    })
    .catch(next);
});

// get venue's on tap beers
// -- NOT BEING USED BY THE APP --
// (the app loads the beers stored in the venue's beers array on load)
router.get('/:dns/active', (req, res, next) => {
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
// -- NOT BEING USED BY THE APP --
router.get('/:dns/all', (req, res, next) => {
  Venue.findOne({ dns: req.params.dns })
    .populate({
      path: 'beers',
      model: 'Beer'
    })
    .then(result => {
      if (!result) {
        res.status(404).json({ code: 'not-found' });
      }

      const data = {
        beers: result.beers
      };
      res.json(data);
    })
    .catch(next);
});

module.exports = router;
