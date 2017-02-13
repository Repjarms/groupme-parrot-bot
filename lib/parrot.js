"use strict";

const fs = require('fs');

var members = fs.readFileSync('./data/members.json', 'utf8');
var groups = fs.readFileSync('./data/groups.json', 'utf8');

members = JSON.parse(members);
groups = JSON.parse(groups);

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

  finalResponseObject = JSON.stringify(finalResponseObject);

  return finalResponseObject;
}
