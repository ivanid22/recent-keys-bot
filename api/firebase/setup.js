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

module.exports = firestore;