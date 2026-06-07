# Hearing Aid Repair Management System

A comprehensive system for managing hearing aid repairs at a dealership in Delhi. The system allows staff to track repairs and customers to monitor their repair status.

## Features

- Customer repair status tracking with CAPTCHA verification
- Staff dashboard with repair management
- Real-time statistics and analytics
- Role-based access control
- Mobile-responsive design
- Search and filter functionality
- Detailed repair and customer views
- Comprehensive reporting system

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **UI Framework**: Material-UI v5
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Charts**: Recharts
- **Testing**: Jest + React Testing Library
- **Additional Features**: reCAPTCHA, TypeScript

## Prerequisites

- Node.js 18+ and npm
- Supabase account
- reCAPTCHA API keys

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# reCAPTCHA
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
```

## Local Development Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd hearing-aid-repair-system
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up your environment variables as described above.

4. Set up your Supabase database and authentication:
   - Create a new Supabase project
   - Configure authentication settings in Supabase dashboard
   - Run the database migrations:
     ```bash
     cd supabase
     supabase db push
     ```
   - Update your environment variables with the Supabase credentials

5. Set up reCAPTCHA:
   - Get your reCAPTCHA API keys from Google
   - Update your environment variables with the reCAPTCHA credentials

6. Run the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Deployment

### Vercel Deployment (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Create a new project on [Vercel](https://vercel.com)

3. Import your repository

4. Configure environment variables in Vercel project settings

5. Deploy the project

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

### Database Migration in Production

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link your Supabase project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Push database changes:
   ```bash
   supabase db push
   ```

## Project Structure

```
src/
├── app/
│   ├── (auth)/           # Authentication routes
│   ├── (customer)/       # Customer-facing routes
│   ├── (dashboard)/      # Staff dashboard routes
│   ├── api/             # API routes
│   ├── components/      # Shared components
│   ├── lib/            # Utilities and configurations
│   ├── styles/         # Global styles and theme
│   └── types/          # TypeScript type definitions
├── __tests__/          # Test files
└── middleware.ts       # Next.js middleware
```

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build the production application
- `npm start` - Start the production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- Follow TypeScript best practices
- Write tests for new features
- Update documentation as needed
- Follow the existing code style

## Performance Optimization

- Images are optimized using Next.js Image component
- API routes are optimized with proper caching
- Database queries are optimized with indexes
- Client-side state management is efficient

## Security Measures

- Authentication using Supabase Auth
- Row Level Security in Supabase
- CAPTCHA verification for public endpoints
- Environment variables for sensitive data
- Input validation and sanitization

## Monitoring and Analytics

- Error tracking with Vercel Analytics
- Database monitoring with Supabase Dashboard
- Performance monitoring with Vercel Analytics

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@example.com or create an issue in the repository. 