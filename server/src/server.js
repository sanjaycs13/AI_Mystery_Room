import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';

const port = Number(process.env.PORT || 5000);
try {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');
  await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  app.listen(port, () => console.log(`AI Mystery Room API listening on port ${port}`));
} catch (error) {
  console.error(`Server startup failed: ${error.message}`);
  process.exit(1);
}
