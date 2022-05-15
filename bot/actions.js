const RIOActions = require('../api/rio/RIOQuery');
const FirebaseActions = require('../api/firebase/firebaseActions');
const { whoNeedsAKey, findRunsWithinWeek } = require('../api/actions');
const { MessageEmbed } = require('discord.js');
const moment = require('moment');

const BOT_COMMANDS = {
  FIND_RUNS: '!find',
  HELP: '!help',
  ADD_CHARACTER_TO_LIST: '!listaddcharacter',
  REMOVE_CHARACTER_FROM_LIST: '!listremovecharacter',
  FIND_LIST_RUNS: '!listfind',
  WHO_NEEDS_A_KEY: '!whoneedsakey',
  FIND_CHARACTER_RECENT_RUNS: '!findrunsthisweek'
};

const formatRunsEmbed = (runs, character) => { 
  const { name, realm } = character;
  const response = new MessageEmbed();
  response.setColor('#0099ff')
          .setTitle(`${name} - ${realm}`)
          .setDescription('Recent Mythic+ runs')
          .addFields(
            runs.map(run => ({
              name: `${run.dungeon} +${run.mythicLevel}`,
              value: `${moment(run.completedAt).format('MM/DD/YYYY HH:MI:SS')} \n ${run.timed ? 'Timed' : 'Not timed'}`,
              url: run.url,
              inline: true
            }))
          )
          .setTimestamp();
  return response;
}

const formatRuns = (runs) => {
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
    message.reply({
      content: 'Recent runs:',
      embeds: [
        formatRunsEmbed(runsData.runs, { name: params[1], realm: params[2] })
      ]
    });
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
    console.log(formatWhoNeedsAKeyEmbed(report))
    message.reply({
      content: `Characters missing a run >= ${params[1]} this week`,
      embeds: [formatWhoNeedsAKeyEmbed(report)]
    });
  } catch(e) {
    console.log(`ERROR - dispatchWhoNeedsAKey: ${e}`);
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

const formatWhoNeedsAKeyEmbed = (report) => {
  const response = new MessageEmbed();
  response.setTitle('Characters missing runs this week')
          .setDescription(`For lists registered on this discord server`);
  report.forEach(page => {
    const characterNames = page.characters.map(character => character.name);
    response.addField(`${page.list}'s characters`,
      characterNames.length > 0 ? characterNames.reduce((previous, current) => `${previous}\n${current}`) : `No characters missing their run`,
      true
    );
  });

  return response;
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

const dispatchRemoveCharacterFromList = async (message) => {
  const params = message.content.split(' ').filter(element => element != '');
  if (params.length != 3) {
    message.reply(`Error: expected 2 parameters, received ${params.length - 1}`);
    return;
  };

  const result = await FirebaseActions.removeCharacterFromList(message.guildId, params[1], params[2]);
  message.reply(result.status === 'ERROR' ? result.message : 'Character removed from list!');
}

const displayHelp = async (message) => {
  const replyEmbed = new MessageEmbed();
  replyEmbed.setTitle('recent-keys-bot help')
            .setDescription('available commands')
            .addFields([
              {
                name: '!find [character] [realm] [region]',
                value: 'finds the 10 most recent runs for a character'
              },
              {
                name: '!findrunsthisweek [character] [realm] [region]',
                value: 'finds the 10 most recent runs for a character that happened within the current week'
              },
              {
                name: '!listaddcharacter [list] [character] [realm] [region]',
                value: 'adds a character to a list. if the list doesn\'t exist, it will be created'
              },
              {
                name: '!listremovecharacter [list] [character] [realm] [region]',
                value: 'removes a character from a list'
              },
              {
                name: '!listfind [list]',
                value: 'finds recent runs for all characters on a list'
              },
              {
                name: '!listremovecharacter [list] [character] [realm] [region]',
                value: 'removes a character from a list'
              },
              {
                name: '!whoneedsakey [level]',
                value: 'finds all characters on all lists that haven\'t completed a run at the specified level whithin the current week'
              }
            ]);

  message.reply({
    content: 'Available commands',
    embeds: [replyEmbed]
  });
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
    case BOT_COMMANDS.REMOVE_CHARACTER_FROM_LIST:
      dispatchRemoveCharacterFromList(message);
      break;
    case BOT_COMMANDS.HELP:
      displayHelp(message);
      break;
    default:
      message.reply('Unrecognized command');
  };
}

module.exports = {
  parseMessage
};