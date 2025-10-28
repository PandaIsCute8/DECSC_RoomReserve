# 🚀 RoomReserve Local Setup Guide

## Quick Setup (Recommended)

### Option 1: Use Neon (Free Cloud Database) - Easiest

1. **Create a free Neon account:**
   - Go to [neon.tech](https://neon.tech)
   - Sign up with GitHub or email
   - Create a new project

2. **Get your database URL:**
   - In your Neon dashboard, go to "Connection Details"
   - Copy the connection string (it looks like: `postgresql://username:password@hostname:port/database`)

3. **Update your .env file:**
   ```bash
   # Replace the DATABASE_URL in .env with your Neon connection string
   DATABASE_URL="postgresql://your-actual-connection-string-here"
   ```

4. **Run the setup:**
   ```bash
   npm run setup
   ```

5. **Start the application:**
   ```bash
   npm run dev
   ```

### Option 2: Use Supabase (Free Cloud Database)

1. **Create a free Supabase account:**
   - Go to [supabase.com](https://supabase.com)
   - Sign up and create a new project

2. **Get your database URL:**
   - Go to Settings > Database
   - Copy the connection string

3. **Update your .env file and run setup as above**

### Option 3: Install PostgreSQL Locally

1. **Install PostgreSQL:**
   ```bash
   # On macOS with Homebrew:
   brew install postgresql
   brew services start postgresql
   
   # On Ubuntu/Debian:
   sudo apt update
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   
   # On Windows:
   # Download from https://www.postgresql.org/download/windows/
   ```

2. **Create database:**
   ```bash
   createdb roomreserve
   ```

3. **Update .env file:**
   ```bash
   DATABASE_URL="postgresql://your-username@localhost:5432/roomreserve"
   ```

4. **Run setup:**
   ```bash
   npm run setup
   ```

## Testing Your Setup

After setting up your database, run:

```bash
npm run test-setup
```

This will verify that everything is working correctly.

## Starting the Application

```bash
npm run dev
```

The application will be available at: http://localhost:5000

## Sign In

Use any email ending with `@student.ateneo.edu` to sign in, for example:
- `test@student.ateneo.edu`
- `admin@student.ateneo.edu`

## Troubleshooting

### Database Connection Issues
- Make sure your DATABASE_URL is correct
- Check if your database is running (for local PostgreSQL)
- Verify your cloud database credentials

### Port Already in Use
- Change the PORT in your .env file to another number (e.g., 3001)

### TypeScript Errors
- Run `npm install` to ensure all dependencies are installed
- Run `npx tsc --noEmit` to check for TypeScript errors

## Need Help?

If you encounter any issues:
1. Check the console output for error messages
2. Verify your .env file has the correct DATABASE_URL
3. Make sure all dependencies are installed with `npm install`
4. Try running `npm run test-setup` to diagnose issues
