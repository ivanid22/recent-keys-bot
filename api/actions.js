const { findCharacterRecentRuns } = require('./rio/RIOQuery');
const { findLists, getCharacters } = require('./firebase/firebaseActions');
const moment = require('moment');

const findRunsWithinWeek = async (character, realm, region, minKeyLevel) => {
  try {
    // Weekly reset is tuesdays on US servers and wednesdays on EU
    const dateFrom = moment().day(region === 'us' ? 2 : 3);
    const characterRuns = await findCharacterRecentRuns(character, realm, region);
    return characterRuns.runs.filter(run => (moment(run.completedAt).valueOf() > dateFrom.valueOf()) && run.mythicLevel >= minKeyLevel);
  } catch(e) {
    console.log(`ERROR - findRunsWithinWeek: ${e.message}`);
  }
}

const charactersMissingWeeklyRun = async (guild, list, minKeyLevel) => {
  let charactersMissingKey = [];
  try {
    const characters = await (await getCharacters(guild, list)).characters;
    for (character of characters) {
      const characterRunsThisWeek = await findRunsWithinWeek(character.character.name, character.character.realm, character.character.region, 15);
      const runsOverLevel = characterRunsThisWeek.filter(run => run.mythicLevel >= minKeyLevel);
      charactersMissingKey = runsOverLevel.length === 0 ? [...charactersMissingKey, character.character] : charactersMissingKey;
    };
    return charactersMissingKey;
  } catch(e) {
    console.log(`ERROR - charactersMissingWeeklyRun: ${e.message}`);
  }
}

const whoNeedsAKey = async (guild) => {
  try {
    const lists = await findLists(guild);

  } catch(e) {
    console.log(`ERROR - whoNeedsAKey: ${e.message}`);
  }
};

