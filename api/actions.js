const { findCharacterRecentRuns } = require('./rio/RIOQuery');
const moment = require('moment');

const findRunsWithinWeek = async (character, realm, region) => {
  // Weekly reset is tuesdays on US servers and wednesdays on EU
  try {
    const dateFrom = moment().day(region === 'us' ? 2 : 3);
    const characterRuns = await findCharacterRecentRuns(character, realm, region);
    return characterRuns.runs.filter(run => moment(run.completedAt).valueOf() > dateFrom.valueOf());
  } catch(e) {
    console.log(e.message);
  }
}

findRunsWithinWeek('darremi', 'kelthuzad', 'us').then(runs => console.log(runs));

