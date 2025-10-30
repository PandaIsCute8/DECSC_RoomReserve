# RoomReserve - Classroom Reservation System

A modern web application for reserving classrooms at JGSOM (John Gokongwei School of Management). Built with React, TypeScript, Express.js, and PostgreSQL.

## Features

- 🏢 Browse available classrooms with real-time status
- 📅 Calendar-based date selection
- ⏰ Time slot picker with conflict detection
- 🔐 Authentication with Ateneo student email validation
- 📱 Responsive design for mobile and desktop
- 👨‍💼 Admin panel for managing reservations
- ✅ Check-in system with 15-minute grace period

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: Express.js, Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **UI Components**: Radix UI, Lucide React
- **State Management**: TanStack Query (React Query)

## Quick Start

### Prerequisites

- Node.js 18+ 
- PostgreSQL database (local or cloud)
- npm or yarn

### 1. Clone and Setup

```bash
git clone <repository-url>
cd RoomReserve
chmod +x setup.js
./setup.js
```

### 2. Configure Database

The setup script creates a `.env` file. Update it with your database credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/roomreserve"
PORT=5000
NODE_ENV=development
```

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Manual Setup

If you prefer to set up manually:

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/roomreserve"
PORT=5000
NODE_ENV=development
```

### 3. Database Setup

```bash
# Create database schema
npm run db:push

# Seed with sample data
npx tsx server/seed.ts
```

### 4. Start Development

```bash
npm run dev
```

## Database Options

### Local PostgreSQL

1. Install PostgreSQL locally
2. Create a database: `createdb roomreserve`
3. Update DATABASE_URL in `.env`

### Cloud Databases (Recommended for easy setup)

#### Neon (Free tier available)
1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string to your `.env` file

#### Supabase (Free tier available)
1. Sign up at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings > Database
4. Copy the connection string to your `.env` file

#### Railway (Free tier available)
1. Sign up at [railway.app](https://railway.app)
2. Create a new PostgreSQL service
3. Copy the connection string to your `.env` file

## Project Structure

```
RoomReserve/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── lib/            # Utilities and configurations
│   │   └── hooks/          # Custom React hooks
├── server/                 # Express.js backend
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database operations
│   ├── db.ts              # Database connection
│   └── seed.ts            # Sample data
├── shared/                 # Shared types and schemas
│   └── schema.ts          # Database schema and types
└── setup.js               # Setup script
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Rooms
- `GET /api/rooms` - Get all rooms with status
- `GET /api/rooms/:id` - Get room details
- `GET /api/rooms/:id/reservations?date=YYYY-MM-DD` - Get room reservations for a date

### Reservations
- `POST /api/reservations` - Create reservation
- `GET /api/reservations/my` - Get user's reservations
- `POST /api/reservations/:id/checkin` - Check in to reservation
- `DELETE /api/reservations/:id` - Cancel reservation

### Admin
- `GET /api/admin/reservations` - Get all reservations (admin only)

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run check        # Type check
npm run db:push      # Push database schema changes
```

## Troubleshooting

### Database Connection Issues

1. Verify your DATABASE_URL is correct
2. Ensure your database server is running
3. Check firewall settings if using a remote database
4. Verify database credentials and permissions

### Port Already in Use

If port 5000 is already in use, update the PORT in your `.env` file:

```env
PORT=3001
```

### Module Resolution Issues

If you encounter module resolution errors:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Email Delivery (SMTP)

RoomReserve can send real emails for reservation confirmations and reminders. If SMTP is not configured, the server will log the emails instead of sending them.

### Configure SMTP

Add the following to your `.env` file (values from your SMTP provider such as Gmail, SendGrid, Mailgun, SMTP2GO, etc.):

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
# Optional: From header
SMTP_FROM=RoomReserve <no-reply@yourdomain.com>
```

Then install dependencies if not already done:

```bash
npm install
```

Start the server as usual:

```bash
npm run dev
```

Notes:
- Port 465 implies a secure connection (TLS). For 587, the transport will use STARTTLS.
- Emails are sent from the backend in `server/mailer.ts`. Confirmation is sent immediately after reservation creation, and a reminder is scheduled for 5 minutes before the start time.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions, please create an issue in the repository or contact the development team.
