const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers to prevent SRV lookup failures on Alpine Docker / Render / Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if custom DNS cannot be configured in environment
}

let mongodInstance = null;

const connectDB = async (retries = 5) => {
  const rawUri = process.env.MONGODB_URI?.trim();

  if (rawUri) {
    let uri = rawUri;

    // Automatically append default database name and options if missing
    if (uri.endsWith('.mongodb.net/') || uri.endsWith('.mongodb.net')) {
      uri = uri.replace(/\/?$/, '/studysync?retryWrites=true&w=majority');
    }

    console.log('Connecting to configured MongoDB database...');

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await mongoose.connect(uri, {
          serverSelectionTimeoutMS: 10000,
          dbName: 'studysync'
        });
        console.log('MongoDB Atlas / Remote Database Connected Successfully.');
        return;
      } catch (err) {
        console.error(`MongoDB connection attempt ${attempt}/${retries} failed:`, err.message);
        if (attempt === retries) {
          console.error('All MongoDB connection attempts failed. Check:');
          console.error('1. In MongoDB Atlas -> Network Access, add IP: 0.0.0.0/0 (Allow access from anywhere).');
          console.error('2. Database username and password credentials are correct.');
          console.error('3. MONGODB_URI in Render Environment variables is correct.');
        } else {
          console.log('Retrying MongoDB connection in 3 seconds...');
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    }
    return;
  }

  // Fallback to in-memory MongoDB for local dev only if NOT in production
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('No MONGODB_URI provided. Initializing MongoDB Memory Server for local dev...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create();
      const memoryUri = mongodInstance.getUri();

      await mongoose.connect(memoryUri);
      console.log(`Connected to in-memory MongoDB at: ${memoryUri}`);
      console.log('NOTE: To persist data across server restarts, add your MongoDB Atlas URI in server/.env');
    } catch (err) {
      console.error('Error starting in-memory database:', err.message);
    }
  } else {
    console.warn('WARNING: Running in production without MONGODB_URI! Please add MONGODB_URI in Render environment settings.');
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
