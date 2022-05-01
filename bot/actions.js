const RIOActions = require('../api/rio/RIOQuery');
const FirebaseActions = require('../api/firebase/firebaseActions');
const { whoNeedsAKey, findRunsWithinWeek } = require('../api/actions');
const moment = require('moment');

const BOT_COMMANDS = {
  FIND_RUNS: '!find',
  ADD_CHARACTER_TO_LIST: '!listaddcharacter',
  FIND_LIST_RUNS: '!listfind',
  WHO_NEEDS_A_KEY: '!whoneedsakey',
  FIND_CHARACTER_RECENT_RUNS: '!findrunsthisweek'
};

formatRuns = (runs) => {
  return runs.reduce((previous, current) => (
    previous + `${current.dungeon}:\nTimestamp: ${moment(current.completedAt).format('MM/DD/YYYY HH:MI:SS')}\nLevel: ${current.mythicLevel}\nTimed: ${current.timed ? 'Yes\n' : 'No\n'}\n`
  ), '');
}

const findRuns = async (message) => {
  const params = message.content.split(' ').filter(element => element != '');
  if (params.length != 4) {
    message.reply(`Wrong number of parameters (received ${params.length - 1}, expected 3)`);
    return;
  }

  const runsData = await RIOActions.findCharacterRecentRuns(params[1], params[2], params[3]);
  if (runsData.status === 'OK') {
    message.reply(formatRuns(runsData.runs));
  } else {
    message.reply('Error on data request: ' + runsData.message);
  };
}

const dispatchWhoNeedsAKey = async (message) => {
  const params = message.content.split(' ').filter(element => element != '');
  if (params.length != 2) {
    message.reply(`Wrong number of parameters (received ${params.length - 1}, expected 1)`);  
    return;
  }
  try {
    const report = await whoNeedsAKey(message.guildId, parseInt(params[1]));
    message.reply(formatWhoNeedsAKeyReport(report));
  } catch(e) {
    console.log(`ERROR - dispatchWhoNeedsAKey: ${e.message}`);
  }
}

const dispatchFindRunsThisWeek = async (message) => {
  const params = message.content.split(' ').filter(element => element != '');
  if (params.length != 4) {
    message.reply(`Wrong number of parameters (received ${params.length - 1}, expected 3)`);  
    return;
  }

  try {
    const runs = await findRunsWithinWeek(params[1], params[2], params[3]);
    message.reply(formatRuns(runs));
  } catch(e) {
    console.log(`ERROR - dispatchFindRecentRuns: ${e.message}`);
  }
}

const addCharacterToList = async (message) => {
  const params = message.content.split(' ').filter(element => element != '');
  if (params.length != 5) {
    message.reply(`Wrong number of parameters (received ${params.length - 1}, expected 4)`)
    return;
  }

  if (! await RIOActions.characterExists(params[2], params[3], params[4])) {
    message.reply('Character does not exist');
    return;
  }

  await FirebaseActions.addCharacterToList(message.guildId, params[1], {
    name: params[2],
    realm: params[3],
    region: params[4]
  });
  
  message.reply('Character added to list!');
}

const formatWhoNeedsAKeyReport = (report) => {
  let formattedReport = '';
  report.forEach((page) => {
    formattedReport += `${page.list}'s characters that haven't completed at least one key at the requested level:\n`;
    page.characters.forEach(character => {
      formattedReport += `${character.name}, ${character.realm}, ${character.region}\n`;
    });
    formattedReport += page.characters.length === 0 ? `all of ${page.list}'s characters have completed a key this week!\n` : '';
  });
  return report.length === 0 ? `No lists have been added on this server\n` : formattedReport
}

const findRunsForList = async (message) => {
  const params = message.content.split(' ').filter(element => element != '');

  if (! await FirebaseActions.listExists(message.guildId, params[1])) {
    message.reply(`List ${params[1]} does not exist`);
    return;
  }

  const characters = await FirebaseActions.getCharacters(message.guildId, params[1]);
  let runsOutput = ' ';

  for (chr of characters.characters) {
    const { name, realm, region } = chr.character;
    console.log(`${name} ${realm} ${region}`)
    const runsData = await RIOActions.findCharacterRecentRuns(name, realm, region);
    runsOutput += `Character: ${name}, realm: ${realm}\n` + (runsData.runs.length > 0 ? formatRuns(runsData.runs) : 'No recent runs for this character\n') + '\n';
    console.log(runsData)
  };

  message.reply(runsOutput);
}

const parseMessage = (message) => {
  const params = message.content.split(' ');
  if (params[0][0] != '!') return;

  switch (params[0]) {
    case BOT_COMMANDS.FIND_RUNS:
      findRuns(message);
      break;
    case BOT_COMMANDS.ADD_CHARACTER_TO_LIST:
      addCharacterToList(message);
      break;
    case BOT_COMMANDS.FIND_LIST_RUNS:
      findRunsForList(message);
      break;
    case BOT_COMMANDS.WHO_NEEDS_A_KEY:
      dispatchWhoNeedsAKey(message);
      break;
    case BOT_COMMANDS.FIND_CHARACTER_RECENT_RUNS:
      dispatchFindRunsThisWeek(message);
      break;
    default:
      message.reply('Unrecognized command');
  };
}

module.exports = {
  parseMessage
};