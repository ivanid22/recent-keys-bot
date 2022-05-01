const { findCharacterRecentRuns } = require('./rio/RIOQuery');
const { findLists, getCharacters } = require('./firebase/firebaseActions');
const moment = require('moment');

const findRunsWithinWeek = async (character, realm, region) => {
  try {
    const today = moment().day();
    const dateFrom = moment().day(today < 2 ? -5-today : 2);
    const characterRuns = await findCharacterRecentRuns(character, realm, region);
    return characterRuns.runs.filter(run => (moment(run.completedAt).valueOf() > dateFrom.valueOf()));
  } catch(e) {
    console.log(`ERROR - findRunsWithinWeek: ${e.message}`);
  }
}

const charactersMissingWeeklyRun = async (guild, list, minKeyLevel) => {
  let charactersMissingKey = [];
  try {
    const characters = await (await getCharacters(guild, list)).characters;
    for (character of characters) {
      const characterRunsThisWeek = await findRunsWithinWeek(character.character.name, character.character.realm, character.character.region);
      const runsOverLevel = characterRunsThisWeek.filter(run => run.mythicLevel >= minKeyLevel);
      charactersMissingKey = runsOverLevel.length === 0 ? [...charactersMissingKey, character.character] : charactersMissingKey;
    };
    return charactersMissingKey;
  } catch(e) {
    console.log(`ERROR - charactersMissingWeeklyRun: ${e.message}`);
  }
}

const whoNeedsAKey = async (guild, minKeyLevel) => {
  const listReport = []
  try {
    const lists = await findLists(guild);
    for (list of lists) {
      const charactersMissingRun = await charactersMissingWeeklyRun(guild, list, minKeyLevel);
      listReport.push({
        list,
        characters: charactersMissingRun
      });
    };
    return listReport;
  } catch(e) {
    console.log(`ERROR - whoNeedsAKey: ${e.message}`);
  }
};

module.exports = {
  findRunsWithinWeek,
  charactersMissingWeeklyRun,
  whoNeedsAKey
};
