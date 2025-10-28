#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Setting up RoomReserve for local development...\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file...');
  const envContent = `# Database Configuration
# For local development, you can use a local PostgreSQL database
# or a free cloud database like Neon, Supabase, or Railway
DATABASE_URL="postgresql://username:password@localhost:5432/roomreserve"

# Alternative: Use a free cloud database
# DATABASE_URL="postgresql://username:password@hostname:port/database"

# Server Configuration
PORT=5000
NODE_ENV=development
`;
  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created! Please update DATABASE_URL with your database credentials.\n');
} else {
  console.log('✅ .env file already exists.\n');
}

// Install dependencies
console.log('📦 Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Dependencies installed successfully!\n');
} catch (error) {
  console.error('❌ Failed to install dependencies:', error.message);
  process.exit(1);
}

// Push database schema
console.log('🗄️  Setting up database schema...');
try {
  execSync('npm run db:push', { stdio: 'inherit' });
  console.log('✅ Database schema created successfully!\n');
} catch (error) {
  console.error('❌ Failed to create database schema:', error.message);
  console.log('💡 Make sure your DATABASE_URL in .env is correct and the database is accessible.\n');
}

// Seed database
console.log('🌱 Seeding database with sample data...');
try {
  execSync('npx tsx server/seed.ts', { stdio: 'inherit' });
  console.log('✅ Database seeded successfully!\n');
} catch (error) {
  console.error('❌ Failed to seed database:', error.message);
  console.log('💡 Make sure your database is running and accessible.\n');
}

console.log('🎉 Setup complete! You can now run the application with:');
console.log('   npm run dev');
console.log('\n📚 Next steps:');
console.log('1. Update the DATABASE_URL in .env with your actual database credentials');
console.log('2. Make sure your PostgreSQL database is running');
console.log('3. Run "npm run dev" to start the development server');
console.log('4. Open http://localhost:5000 in your browser');
