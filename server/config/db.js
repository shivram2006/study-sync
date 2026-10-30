const mongoose = require('mongoose');

let mongodInstance = null;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI?.trim();

    if (uri) {
      console.log('Connecting to configured MongoDB database...');
      await mongoose.connect(uri);
      console.log('MongoDB Atlas / Remote Database Connected Successfully.');
      return;
    }

    console.log('No MONGODB_URI provided. Initializing MongoDB Memory Server for development...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongodInstance = await MongoMemoryServer.create();
    const memoryUri = mongodInstance.getUri();
    
    await mongoose.connect(memoryUri);
    console.log(`Connected to in-memory MongoDB at: ${memoryUri}`);
    console.log('NOTE: To persist data across server restarts, add your MongoDB Atlas URI in server/.env');
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

const closeDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongodInstance) {
      await mongodInstance.stop();
    }
  } catch (err) {
    console.error('Error closing database:', err.message);
  }
};

module.exports = { connectDB, closeDB };
