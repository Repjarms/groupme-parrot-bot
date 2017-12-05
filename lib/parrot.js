const utils = require('./utils');

const THIRTY_MINUTES_IN_MS = 1800000;

const groups = utils.readGroupsFromFile();
let members = [];

utils.syncMembersWithGroupme()
  .then((data) => {
    members = data;
  });

setInterval(() => {
  utils.syncMembersWithGroupme()
    .then((data) => {
      members = data;
    });
}, THIRTY_MINUTES_IN_MS);

const checkTextForKeywords = (text) => {
  const userMessage = text.toLowerCase();
  let selectedIds = [];

  groups.forEach((group) => {
    const groupMentioned = userMessage.includes(`@${group.name}`);
    if (groupMentioned === true) {
      selectedIds = [...group.ids];
    }
  });
  return selectedIds;
};

const mapIdsToNames = ids => (
  ids.map((id) => {
    let mentionedMember;

    members.forEach((member) => {
      if (Number(member.user_id) === id) {
        mentionedMember = member;
      }
    });
    return mentionedMember;
  }));

const mapArrayToString = (mentionedMembers) => {
  let finalString = '';

  mentionedMembers.forEach((member) => {
    finalString += `@${member.nickname} `;
  });
  return finalString;
};

const constructMentionLoci = (finalString, memberArray) => {
  const loci = [];
  let atOccurences = 0;

  [...finalString].forEach((char, i) => {
    if (char === '@') {
      loci.push([i, memberArray[atOccurences].nickname.length + 1]);
      atOccurences += 1;
    }
  });
  return loci;
};

const constructResponseObject = (botId, text, mentionedIds, lociArray) => (
  JSON.stringify({
    bot_id: botId,
    text,
    attachments: [
      {
        type: 'mentions',
        user_ids: mentionedIds,
        loci: lociArray,
      },
    ],
  })
);

const messageHandler = (text, botId) => {
  const mentionedIds = checkTextForKeywords(text);
  const mentionedMembers = mapIdsToNames(mentionedIds);
  const finalString = mapArrayToString(mentionedMembers);
  const lociArray = constructMentionLoci(finalString, mentionedMembers);

  return constructResponseObject(botId, finalString, mentionedIds, lociArray);
};

module.exports = {
  squawk: messageHandler,
};
