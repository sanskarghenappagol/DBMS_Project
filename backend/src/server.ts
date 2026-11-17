import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { testConnection } from './config/database';
import { connectMongoDB } from './config/mongodb';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  console.log('==================================================');
  console.log('🚀 Smart Healthcare & Doctor Appointment API');
  console.log('==================================================');

  // Test MySQL Connection
  const mysqlOk = await testConnection();
  if (!mysqlOk) {
    console.warn('⚠️ MySQL connection check failed. Please ensure MySQL server is running on port 3306 and schema.sql is executed.');
  }

  // Connect MongoDB (with graceful fallback if offline)
  await connectMongoDB();

  // Start HTTP Listener
  app.listen(PORT, () => {
    console.log(`🌐 Server running at http://localhost:${PORT}`);
    console.log(`📊 Health Endpoint: http://localhost:${PORT}/health`);
    console.log(`📑 API Endpoints: http://localhost:${PORT}/api/*`);
    console.log('==================================================');
  });
}

bootstrap().catch((error) => {
  console.error('Fatal Server Boot Error:', error);
  process.exit(1);
});

