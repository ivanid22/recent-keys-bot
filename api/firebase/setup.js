const admin = require("firebase-admin");
const fs = require('firebase-admin/firestore');
const serviceAccount = require("../../secrets/firebase-auth.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_ENDPOINT_URL
});

const firestore = fs.getFirestore();

module.exports = firestore;