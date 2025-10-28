#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🧪 Testing RoomReserve setup...\n');

// Test 1: Check if .env exists
console.log('1. Checking .env file...');
if (fs.existsSync('.env')) {
  console.log('✅ .env file exists');
  
  // Check if DATABASE_URL is set
  const envContent = fs.readFileSync('.env', 'utf8');
  if (envContent.includes('DATABASE_URL=') && !envContent.includes('username:password')) {
    console.log('✅ DATABASE_URL appears to be configured');
  } else {
    console.log('⚠️  DATABASE_URL needs to be configured with actual credentials');
  }
} else {
  console.log('❌ .env file not found. Run "npm run setup" first.');
  process.exit(1);
}

// Test 2: Check if dependencies are installed
console.log('\n2. Checking dependencies...');
try {
  if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules exists');
  } else {
    console.log('❌ Dependencies not installed. Run "npm install" first.');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Error checking dependencies:', error.message);
  process.exit(1);
}

// Test 3: Check if database schema exists
console.log('\n3. Testing database connection...');
try {
  execSync('npm run db:push', { stdio: 'pipe' });
  console.log('✅ Database schema is up to date');
} catch (error) {
  console.log('❌ Database connection failed:', error.message);
  console.log('💡 Make sure your DATABASE_URL is correct and the database is running');
  process.exit(1);
}

// Test 4: Check if database has data
console.log('\n4. Testing database seeding...');
try {
  execSync('npm run seed', { stdio: 'pipe' });
  console.log('✅ Database seeded successfully');
} catch (error) {
  console.log('❌ Database seeding failed:', error.message);
  console.log('💡 Make sure your database is accessible and has the correct permissions');
  process.exit(1);
}

console.log('\n🎉 All tests passed! Your RoomReserve setup is ready.');
console.log('\nNext steps:');
console.log('1. Run "npm run dev" to start the development server');
console.log('2. Open http://localhost:5000 in your browser');
console.log('3. Sign in with any @student.ateneo.edu email address');
console.log('4. Try making a reservation!');
