require('dotenv').config();
const axios = require('axios');;

const findCharacterRecentRuns = async (name, realm, region) => {
    try {
        const res = await axios.get(process.env.RIO_ENDPOINT_URL, {
            params: {
                region,
                realm,
                name,
                fields: 'mythic_plus_recent_runs'
            }
          });
        return {
            status: 'OK',
            runs: res.data.mythic_plus_recent_runs.map(run => ({
                dungeon: run.dungeon,
                mythicLevel: run.mythic_level,
                timed: (run.num_keystone_upgrades > 0),
                completedAt: new Date(run.completed_at),
                url: run.url
            })).sort((a, b) => b.completedAt - a.completedAt)
        }
    } catch(e) {
        console.log(e)
        return {
          status: 'ERROR',
          message: e.response.data ? e.response.data.message : e.message
        }
    };
}

const characterExists = async (name, realm, region) => {
    try {
      const res = await axios.get(process.env.RIO_ENDPOINT_URL, {
        params: {
          region,
          realm,
          name
        }
      });
      return true;
    } catch(e) {
      return false;
    }
}



//findCharacterRecentRuns('nonexistant123', 'kelthuzad', 'us').then(res => console.log(res));

module.exports = {
  findCharacterRecentRuns,
  characterExists
};