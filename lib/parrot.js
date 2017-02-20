"use strict";

require('dotenv').config({path: '../'});
const fs = require('fs');
const request = require('request');

// Number of milliseconds in thirty minutes (used by member polling function)
const THIRTY_MINUTES_IN_MS = 1800000;

// Read Group ID and API token from environment variables
const GROUPME_URL = 'https://api.groupme.com/v3/groups';
const GROUPME_GROUP_ID = process.env.GROUPME_GROUP_ID;
const GROUPME_API_TOKEN = process.env.GROUPME_API_TOKEN;
const GROUPME_REQUEST_PATH = `${GROUPME_URL}/${GROUPME_GROUP_ID}?token=${GROUPME_API_TOKEN}`;

// Read custom Groupme groups from local JSON file
var groups = fs.readFileSync('./data/groups.json', 'utf8');
groups = JSON.parse(groups);


// Initialize member list on startup
var members = [];

// Get members from /groups endpoint on GroupmeAPI
request(GROUPME_REQUEST_PATH, function(err, res, body) {
  if (!err && res.statusCode == 200) {
    var response = JSON.parse(body);
    members = response['response']['members'];
  }
});

// Update member list and nicknames once every 30 minutes
setInterval(function() {
  request(GROUPME_REQUEST_PATH, function(err, res, body) {
    if (!err && res.statusCode == 200) {
      var response = JSON.parse(body);
      members = response['response']['members'];
    }
  });
}, THIRTY_MINUTES_IN_MS);

module.exports = {

  squawk: function(text, bot_id) {
    let mentionedIds = checkTextForKeywords(text);
    let mentionedMembers = findMemberById(mentionedIds);
    let finalString = constructResponseString(mentionedMembers);
    let lociArray = getMentionLoci(finalString, mentionedMembers);

    return constructResponseObject(mentionedIds, lociArray, finalString, bot_id);
  }
};

// Search custom @ groups for mention in text
function checkTextForKeywords(text) {
  for (let item in groups) {
    if (text.toLowerCase().includes('@' + groups[item].name)) {
      return groups[item].ids;
    }
  }
}

// Link user ids within a group to their nicknames
function findMemberById(ids) {
  let mentionedMembers = [];

  for (let id in ids) {
    for (let member in members) {
      if (ids[id] == members[member].user_id) {
        mentionedMembers.push(members[member].nickname);
      }
    }
  }
  return mentionedMembers;
}

// Concat a string with the @ mentions of all associated members
function constructResponseString(mentionedMembers) {
  let finalString = '';

  for (let member in mentionedMembers) {
    finalString += `@${mentionedMembers[member]} `;
  }
  return finalString;
}

// Return and array of location coordinates
// [x, y] where x = index location of @ symbol
// and y = length of the mentionMember's name + @ symbol
function getMentionLoci (finalString, mentionedMembers) {
  let counter = 0;
  let x = 0;
  let loci = [];

  for (let letter in finalString) {
    if (finalString[letter] == '@') {

      // Set loci coordinates
      let startingPosition = counter;
      let memberLength = mentionedMembers[x].length + 1; // + 1 to account for @ symbol

      // Push coordinates as an array within the loci array
      let array = [startingPosition, memberLength];
      loci.push(array);

      // Move to the next mentionedMember
      x += 1;
    }
    // Move the next char in the string
    counter += 1;
  }
  return loci;
}

// Build final object to be POST'ed to the bot endpoint
function constructResponseObject(mentionedIds, lociArray, finalString, bot_id) {
  let finalResponseObject = {
    bot_id: bot_id,
    text: finalString,
    attachments: [
      {
        type: "mentions",
        user_ids: mentionedIds,
        loci: lociArray
      }
    ]
  };

  // Bot endpoint requires a string
  finalResponseObject = JSON.stringify(finalResponseObject);

  return finalResponseObject;
}
