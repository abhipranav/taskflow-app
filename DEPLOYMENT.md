# TaskFlow Deployment Guide 🚀

This guide covers how to deploy TaskFlow to various platforms and environments.

## 📋 Prerequisites

Before deploying, ensure you have:

- Node.js 18+ installed
- A GitHub OAuth app configured
- Environment variables set up
- Database configured (SQLite for development, PostgreSQL/MySQL for production)

## 🔧 Environment Variables

Create the following environment variables for your deployment:

### Required Variables

```env
# Database
DATABASE_URL="file:./prod.db"  # For SQLite (development)
# DATABASE_URL="postgresql://user:pass@host:5432/db"  # For PostgreSQL (production)

# NextAuth Configuration
NEXTAUTH_SECRET="your-super-secret-key-here"
NEXTAUTH_URL="https://your-domain.com"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# AI Providers (Optional)
AI_PROVIDER="gemini"  # or "groq" or "ollama"
GEMINI_API_KEY="your-gemini-api-key"
GROQ_API_KEY="your-groq-api-key"
OLLAMA_BASE_URL="http://localhost:11434"  # For local Ollama

# Logging (Optional)
LOG_LEVEL="info"  # debug, info, warn, error
```

### Optional Variables

```env
# Email Notifications (via Resend)
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"

# Analytics (Optional)
NEXT_PUBLIC_ANALYTICS_ID="your-analytics-id"

# Custom Domain
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

## 🚀 Deployment Options

### Option 1: Vercel (Recommended) ⭐

Vercel provides the easiest deployment with built-in Next.js optimization.

#### 1. Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

#### 2. Configure Environment Variables

In the Vercel dashboard:
1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add all required variables from above

#### 3. Database Setup

For production, use a hosted database:

**PostgreSQL Options:**
- [Neon](https://neon.tech) - Serverless PostgreSQL
- [Supabase](https://supabase.com) - PostgreSQL with additional features
- [PlanetScale](https://planetscale.com) - MySQL-compatible

**SQLite (Not recommended for production):**
- Use a persistent file system (Vercel doesn't persist files between deployments)

#### 4. Deploy

```bash
# Push to main branch to trigger automatic deployment
git add .
git commit -m "Ready for deployment"
git push origin main
```

#### 5. Database Migration

After deployment, run database migrations:

```bash
# If using Vercel CLI
vercel env pull .env.local
npm run db:push
```

### Option 2: Docker Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile --prod; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then yarn global add pnpm && pnpm i --frozen-lockfile --prod; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
```

#### 2. Create docker-compose.yml

```yaml
version: '3.8'

services:
  taskflow:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=file:./prod.db
      - NEXTAUTH_SECRET=your-secret
      - NEXTAUTH_URL=http://localhost:3000
      - GITHUB_CLIENT_ID=your-github-client-id
      - GITHUB_CLIENT_SECRET=your-github-client-secret
    volumes:
      - ./prod.db:/app/prod.db
    restart: unless-stopped
```

#### 3. Build and Run

```bash
# Build the image
docker build -t taskflow .

# Run with docker-compose
docker-compose up -d

# Or run directly
docker run -p 3000:3000 -e DATABASE_URL="file:./prod.db" taskflow
```

### Option 3: Railway

Railway provides easy deployment with built-in databases.

1. Go to [railway.app](https://railway.app) and create an account
2. Click "New Project" → "Deploy from GitHub repo"
3. Connect your repository
4. Railway will auto-detect Next.js and set up the build
5. Add environment variables in the dashboard
6. Use Railway's built-in PostgreSQL database

### Option 4: Netlify

For static deployment (limited functionality):

1. Go to [netlify.com](https://netlify.com) and sign up
2. Click "New site from Git"
3. Connect your repository
4. Set build command: `npm run build`
5. Set publish directory: `.next`
6. Add environment variables

**Note:** Netlify has limitations with SQLite and server-side features.

### Option 5: Self-Hosted (VPS/Cloud)

#### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start npm --name "taskflow" -- start

# Save PM2 configuration
pm2 save
pm2 startup
```

#### Using systemd

Create `/etc/systemd/system/taskflow.service`:

```ini
[Unit]
Description=TaskFlow Application
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/taskflow
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start the service
sudo systemctl enable taskflow
sudo systemctl start taskflow
```

## 🗄️ Database Setup

### SQLite (Development/Testing)

```bash
# Push schema
npm run db:push

# Seed with test data
npm run db:seed
```

### PostgreSQL (Production)

1. Create a PostgreSQL database
2. Update `DATABASE_URL` in environment variables
3. Push schema: `npm run db:push`
4. Seed if needed: `npm run db:seed`

## 🔒 Security Considerations

### 1. Environment Variables
- Never commit `.env` files to version control
- Use different secrets for each environment
- Rotate secrets regularly

### 2. Database Security
- Use connection pooling for production databases
- Enable SSL/TLS for database connections
- Regularly backup your database

### 3. HTTPS
- Always use HTTPS in production
- Set up SSL certificates (Let's Encrypt for free)
- Configure HSTS headers

### 4. Monitoring
- Set up error tracking (Sentry, LogRocket)
- Monitor performance metrics
- Set up alerts for downtime

## 🔧 Post-Deployment Tasks

### 1. Verify Deployment
```bash
# Check if the app is running
curl https://your-domain.com/api/health

# Test authentication
# Visit https://your-domain.com and try logging in
```

### 2. Set Up Monitoring
- Configure error tracking
- Set up uptime monitoring
- Monitor database performance

### 3. Configure Backups
- Set up automated database backups
- Test backup restoration
- Store backups securely

### 4. Performance Optimization
- Enable caching where appropriate
- Optimize images and assets
- Set up CDN if needed

## 🐛 Troubleshooting

### Common Issues

**Build Failures:**
- Check Node.js version compatibility
- Ensure all dependencies are installed
- Verify environment variables are set

**Database Connection Issues:**
- Check DATABASE_URL format
- Verify database credentials
- Ensure database is accessible from deployment environment

**Authentication Issues:**
- Verify GitHub OAuth app settings
- Check NEXTAUTH_URL matches your domain
- Ensure NEXTAUTH_SECRET is set

**Performance Issues:**
- Check database query performance
- Monitor memory usage
- Enable caching for static assets

## 📞 Support

If you encounter issues:
1. Check the [GitHub Issues](https://github.com/yourusername/taskflow-app/issues)
2. Review the logs in your deployment platform
3. Check the [README.md](./README.md) for basic setup

## 🔄 Updates and Maintenance

- Regularly update dependencies
- Monitor for security vulnerabilities
- Keep Node.js version up to date
- Test deployments in staging environment first

---

Happy deploying! 🎉</content>
<parameter name="filePath">/Users/abhijeetpranavmishra/dev/taskflow-app/DEPLOYMENT.md