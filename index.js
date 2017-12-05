require('dotenv').config();
const express = require('express');

const app = express();
const bodyParser = require('body-parser');
const fetch = require('isomorphic-fetch');
const parrot = require('./lib/parrot');

const GROUPME_URL = 'https://api.groupme.com/v3/bots/post';

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// root route
app.get('/', (req, res) => {
  res.send('Hello world');
});

// callback route for Groupme Bot - this is
// called every time a message is sent in the group
app.post('/parrot', (req, res) => {
  const botId = process.env.BOT_ID;
  const payload = parrot.squawk(req.body.text, botId);

  fetch(GROUPME_URL, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: payload,
  })
    .then((data) => {
      res.send(data);
    })
    .catch((err) => {
      res.err(new Error(err));
    });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {});
