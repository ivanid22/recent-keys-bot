const RIOActions = require('../api/rio/RIOQuery');
const FirebaseActions = require('../api/firebase/firebaseActions');

const BOT_COMMANDS = {
  FIND_RUNS: '!find',
  ADD_CHARACTER_TO_LIST: '!listadd',
  FIND_LIST_RUNS: '!listfind'
}

formatRuns = (runs) => {
  return runs.reduce((previous, current) => (
    previous + `${current.dungeon}:\nTimestamp: ${current.completedAt.toString()}\nLevel: ${current.mythicLevel}\nTimed: ${current.timed ? 'Yes\n' : 'No\n'}\n`
  ), '');
}

const findRuns = async (message) => {
  const params = message.content.split(' ').filter(element => element != '');
  if (params.length != 4) {
    message.reply(`Wrong number of parameters (received ${params.length - 1}, expected 3)`);
    return;
  }

  const runsData = await RIOActions.findCharacterRecentRuns(params[1], params[2], params[3]);
  console.log(runsData)
  if (runsData.status === 'OK') {
    message.reply(formatRuns(runsData.runs));
  } else {
    message.reply('Error on data request: ' + runsData.message);
  };
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

const findRunsForList = async (message) => {
  const params = message.content.split(' ').filter(element => element != '');

  if (! await FirebaseActions.listExists(message.guildId, params[1])) {
    message.reply(`List ${params[1]} does not exist`);
    return;
  }

  const characters = await FirebaseActions.getCharacters(message.guildId, params[1]);
  console.log(characters)
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
    default:
      message.reply('Unrecognized command');
  };
}

module.exports = {
  parseMessage
};