const { json } = require('express/lib/response');
const RIOActions = require('../api/rio/RIOQuery');

const BOT_COMMANDS = {
    FIND_RUNS: '!find'
}

formatRuns = (runs) => {
  return runs.reduce((previous, current) => (
    previous + `${current.dungeon}:\nTimestamp: ${current.completedAt.toString()}\nLevel: ${current.mythicLevel}\nTimed: ${current.timed ? 'Yes\n' : 'No\n'}\n`
  ), '');
}

const findRuns = async (message) => {
  const params = message.content.split(' ').filter(element => element != '');
  if (params.length != 4) {
    message.reply(`Wrong number of parameters (received ${params.length - 1}, expected 3`);
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

const parseMessage = (message) => {
    const params = message.content.split(' ');
    if (params[0][0] != '!') return;

    switch (params[0]) {
      case BOT_COMMANDS.FIND_RUNS:
        findRuns(message);
        break;
      default:
        message.reply('Unrecognized command');
    };
}

module.exports = {
  parseMessage
};