# E-commerce Application

## Overview
This is an e-commerce application migrated from Bolt to Replit. The application has been successfully migrated from Supabase to PostgreSQL with Drizzle ORM for improved security and compatibility with Replit's environment.

## Project Architecture
- **Frontend**: React with TypeScript, Vite, TailwindCSS, and shadcn/ui components
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **State Management**: Redux Toolkit and React Query for server state
- **Authentication**: Server-side authentication with bcrypt
- **Payment**: Simple order placement system with Cash on Delivery only

## Recent Changes
### Migration from Bolt to Replit (August 8, 2025) - COMPLETED
- [x] Installed required packages and dependencies
- [x] Created comprehensive Drizzle schema with all necessary tables
- [x] Implemented complete API layer replacing Supabase functionality
- [x] Set up PostgreSQL database with sample products and categories  
- [x] Removed all Supabase dependencies from components
- [x] Fixed authentication modal and import issues
- [x] Updated payment components to use new API service
- [x] Configured secure client/server separation with proper validation
- [x] Application successfully running with authentic data from database

### Complete Payment System Removal (August 11, 2025) - COMPLETED
- [x] Removed all Razorpay payment integration including API routes and components
- [x] Removed all Stripe payment integration including webhooks and processing
- [x] Removed all UPI payment methods and related components
- [x] Cleaned up payment-related dependencies (razorpay, stripe packages)
- [x] Replaced complex checkout flow with simple order placement system
- [x] Updated checkout to use Cash on Delivery only approach
- [x] Removed payment diagnostics and streamlined payment components
- [x] Application now functions as simple e-commerce without payment processing

## User Preferences
- Prefers comprehensive solutions with detailed implementation
- Values security and best practices
- Wants client/server separation for better architecture

## Technical Notes
- Database URL and credentials are available as environment variables
- Authentication uses bcrypt for password hashing
- All API routes are prefixed with `/api`
- Using UUID primary keys for all database tables
- TypeScript with strict type checking enabled