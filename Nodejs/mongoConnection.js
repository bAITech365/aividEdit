// mongo.js
const { MongoClient, ObjectID } = require('mongodb');
const uri = "mongodb+srv://balpreet:ct8bCW7LDccrGAmQ@cluster0.2pwq0w2.mongodb.net/tradingdb";
const client = new MongoClient(uri);
const db = client.db();

module.exports = { client, db };