require('dotenv').config({ path: '../' });
require('es6-promise').polyfill();
const fs = require('fs');
const fetch = require('isomorphic-fetch');
const path = require('path');

const groupmeBaseUrl = 'https://api.groupme.com/v3/groups';
const groupId = process.env.GROUPME_GROUP_ID;
const token = process.env.GROUPME_API_TOKEN;
const groupmeUrl = `${groupmeBaseUrl}/${groupId}?token=${token}`;

const readGroupsFromFile = () => {
  const groups = fs.readFileSync(path.resolve(__dirname, '../', 'data', 'groups.json'), 'utf8');
  return JSON.parse(groups);
};

const syncMembersWithGroupme = () => (
  new Promise((resolve, reject) => {
    fetch(groupmeUrl)
      .then((data) => {
        data.json()
          .then((json) => {
            resolve(json.response.members);
          });
      })
      .catch((err) => {
        reject(new Error(err));
      });
  })
);

module.exports = {
  readGroupsFromFile,
  syncMembersWithGroupme,
};
