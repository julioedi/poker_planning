#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Poker Planning Application...\n');

// Check if .env file exists in backend
const backendEnvPath = path.join(__dirname, '../backend/.env');
if (!fs.existsSync(backendEnvPath)) {
  console.log('📝 Creating backend .env file...');
  const envContent = `PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DEFAULT_USER_ID=0
DEFAULT_USER_EMAIL=admin@pokerplanning.com
DEFAULT_USER_NAME=Admin User
DEFAULT_USER_PASSWORD=admin123
NODE_ENV=development
`;
  fs.writeFileSync(backendEnvPath, envContent);
  console.log('✅ Backend .env file created');
}

// Install root dependencies
console.log('\n📦 Installing root dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('✅ Root dependencies installed');
} catch (error) {
  console.error('❌ Failed to install root dependencies:', error.message);
  process.exit(1);
}

// Install backend dependencies
console.log('\n📦 Installing backend dependencies...');
try {
  execSync('cd backend && npm install', { stdio: 'inherit' });
  console.log('✅ Backend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install backend dependencies:', error.message);
  process.exit(1);
}

// Install frontend dependencies
console.log('\n📦 Installing frontend dependencies...');
try {
  execSync('cd frontend && npm install', { stdio: 'inherit' });
  console.log('✅ Frontend dependencies installed');
} catch (error) {
  console.error('❌ Failed to install frontend dependencies:', error.message);
  process.exit(1);
}

// Setup database
console.log('\n🗄️ Setting up database...');
try {
  execSync('cd backend && npm run setup-db', { stdio: 'inherit' });
  console.log('✅ Database setup completed');
} catch (error) {
  console.error('❌ Failed to setup database:', error.message);
  process.exit(1);
}

console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Start the development servers: npm run dev');
console.log('2. Open http://localhost:3000 in your browser');
console.log('3. Login with default admin credentials:');
console.log('   - Email: admin@pokerplanning.com');
console.log('   - Password: admin123');
console.log('\n🔧 Backend API will be available at http://localhost:5000');
console.log('🌐 Frontend will be available at http://localhost:3000'); 