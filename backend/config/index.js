module.exports = {
  port: process.env.API_PORT || 3001,
  host: process.env.API_HOST || 'localhost',
  apiKey: process.env.API_KEY || 'default-api-key',
  databasePath: process.env.DATABASE_PATH
};
