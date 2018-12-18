'use strict';

const express = require('express');
const router = express.Router();

// dbs to use
const Venue = require('../models/venue');
const User = require('../models/user');

// get venues that belong to session userId
router.get('/own', (req, res, next) => {

});

// create new venue and add to current user's venues
router.post('/new', (req, res, next) => {

});

// check if entered password match with current venue's adminpwd
router.post('/login', (req, res, next) => {

});

// modify user's selected venue
router.put('/edit', (req, res, next) => {

});
module.exports = router;
