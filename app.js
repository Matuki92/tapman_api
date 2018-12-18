'use strict';

const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');

// declare routes
const auth = require('./routes/auth');
const venues = require('./routes/venues');
const beers = require('./routes/beers');

// db connect
mongoose.connect('mongodb://localhost/tapman', {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE
});

// cors
app.use(cors({
  credentials: true,
  // origin: [process.env.CLIENT_URL]
  origin: ['http://localhost:4200']
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// use routes
app.use('/auth', auth);
app.use('/venues', venues);
app.use('/beers', beers);

// catch 404 and forward to error handler
app.use((req, res, next) => {
  res.status(404).json({ code: 'not-found' });
});

app.use((err, req, res, next) => {
  // always log the error
  console.error('ERROR', req.method, req.path, err);

  // only render if the error ocurred before sending the response
  if (!res.headersSent) {
    res.status(500).json({ code: 'unexpected' });
  }
});

module.exports = app;
