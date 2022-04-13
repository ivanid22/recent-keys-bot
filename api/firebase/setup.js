const admin = require("firebase-admin");
const fs = require('firebase-admin/firestore');
const serviceAccount = require("../../secrets/firebase-auth.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://recent-keys-default-rtdb.firebaseio.com"
});

const firestore = fs.getFirestore();

firestore.doc('servers/us').listCollections().then(cols => {
  cols.forEach(col => console.log(col.id))
})



/*firestore.collection('servers').doc('another-test-server').set({
  ivan: [
    {
      name: 'darremi',
      realm: 'kelthuzad',
      region: 'us'
    }
  ]
});*/

/*firestore.doc('server/another-test-server').collection('ivan2').doc('characters').set({
  characters: [1, 2, 3]
});*/

//firestore.collection('servers').listDocuments().then(docs => docs.forEach(doc => console.log(doc.get().then(dc => console.log(dc)))))

module.exports = firestore;