const admin = require("firebase-admin");
const {getFirestore} = require("firebase-admin/firestore");

exports.logger = require("firebase-functions/logger");
const app = admin.initializeApp();
const db = getFirestore(app);

exports.app = app;
exports.db = db;
