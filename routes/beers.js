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

});

// modify venue's current beer
router.put('/edit', (req, res, next) => {

});

module.exports = router;
