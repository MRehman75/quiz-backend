const { MongoClient, ServerApiVersion } = require('mongodb');

let client;
let db;

async function connectToDatabase() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set. Add it to your .env file.');
  }

  client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  await client.connect();
  await client.db('quiz-db').command({ ping: 1 });
  db = client.db('quiz-db');
  console.log('Connected to MongoDB database "quiz-db"');
  return db;
}

function getDb() {
  if (!db) throw new Error('Database is not initialized. Call connectToDatabase() first.');
  return db;
}

async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = {
  connectToDatabase,
  getDb,
  closeDatabase,
};
