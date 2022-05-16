const e = require('express');
const firebase = require('./setup');

const isCharacterOnList = async (guild, list, character) => {
  try {
    const chr = await firebase.doc(`guilds/${guild}/${list}/${character.name}`).get();
    if (chr.exists) {
      return true;
    }
    return false;
  } catch(e) {
    return false; 
  }
};

const removeList = async (guild, list) => {
  try {
    const docs = await firebase.collection(`guilds/${guild}/${list}`).listDocuments();

    for (let document of docs) {
      await document.delete();
    };

    return true;

  } catch (e) {
    console.log('Error - removeList: ' + e.message);
    return false;
  };
};

const removeCharacterFromList = async (guild, list, character) => {
  try {
    if(! await isCharacterOnList(guild, list, { name: character })) {
      return {
        status: 'ERROR',
        message: 'Character is not on the list'
      };
    };

    return firebase.doc(`guilds/${guild}/${list}/${character}`).delete();
  } catch (e) {
    console.log('ERROR - removeCharacterFromList: ' + e.message);
  }
}

const addCharacterToList = async (guild, list, character) => {
  try {
    if (await isCharacterOnList(guild, list, character)) {
      return {
        status: 'ok',
        message: 'character already on list'
      }
    };

    await firebase.doc(`guilds/${guild}/${list}/${character.name}`).set({
      character
    });

    return {
      status: 'ok',
      message: 'character added to list'
    };
  } catch(e) {
    return {
      status: 'error',
      message: e.message
    };
  };
};

const getCharacters = async (guild, list) => {
  try {
    const fetchedCharacters = [];
    const characters = await firebase.collection(`guilds/${guild}/${list}`).listDocuments();
    
    for (characterReference of characters) {
      const fetchedCharacter = await characterReference.get();
      fetchedCharacters.push(fetchedCharacter.data());
    };

    return {
      status: 'ok',
      characters: fetchedCharacters
    };
  }
  catch (e) {
    return {
      status: 'error',
      message: e.message
    };
  };
};



const findLists = async (guild) => {
  try {
    const lists = await firebase.doc(`guilds/${guild}`).listCollections();
    return lists.map(list => list.id);
  } 
  catch (e) {
    console.log(e.message)
  }
};

const listExists = async (guild, list) => {
  return ((await firebase.collection(`guilds/${guild}/${list}`).listDocuments()).length > 0)
}

module.exports = {
  isCharacterOnList,
  addCharacterToList,
  getCharacters,
  listExists,
  findLists,
  removeCharacterFromList,
  removeList
};
