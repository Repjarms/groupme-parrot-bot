"use strict";

require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const request = require('request');
const parrot = require('./lib/parrot');

const GROUPME_URL = 'https://api.groupme.com/v3/bots/post';

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// root route
app.get('/', function(req, res) {
  res.send('Hello world');
});

// callback route for Groupme Bot - this is
// called every time a message is sent in the group
app.post('/parrot', function(req, res) {
  let bot_id = process.env.BOT_ID;
  let payload = parrot.squawk(req.body.text, bot_id);

  request.post(GROUPME_URL).form(payload);
  res.send(payload);
});

const port = process.env.PORT || 3000;

app.listen(port, function() {
  console.log('Parrot bot listening on port %s', port);
});
