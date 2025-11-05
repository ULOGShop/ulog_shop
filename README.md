# 🛒 ULOG Tebex Store - Complete Setup Guide

A modern, premium FiveM store frontend integrated with Tebex Headless API, featuring Discord OAuth authentication, product reviews, and a beautiful UI.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start (Localhost)](#-quick-start-localhost)
- [Environment Configuration](#-environment-configuration)
- [Production Deployment](#-production-deployment)
- [Discord Bot Setup](#-discord-bot-setup)
- [Troubleshooting](#-troubleshooting)
- [API Documentation](#-api-documentation)

---

## ✨ Features

- 🎨 **Modern UI** - Beautiful, responsive design with Mantine components
- 🔐 **Discord OAuth** - Secure authentication with Discord
- 🛍️ **Tebex Integration** - Full integration with Tebex Headless API
- ⭐ **Review System** - MySQL-powered product reviews
- 🛒 **Shopping Cart** - Persistent cart with local storage
- 🔒 **Security** - Rate limiting, input validation, XSS protection
- 📱 **Responsive** - Works perfectly on all devices
- 🚀 **Fast** - Optimized build with Vite

---

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Mantine UI** - Component library
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Backend
- **Node.js** with Express
- **MySQL** - Reviews database
- **Discord OAuth2** - Authentication
- **Tebex API** - Payment processing
- **Helmet.js** - Security headers
- **Rate Limiting** - DDoS protection

---

## 📦 Prerequisites

Before you begin, ensure you have:

- **Node.js** 16+ installed
- **pnpm** package manager (`npm install -g pnpm`)
- **MySQL** 5.7+ or MariaDB 10+
- **Tebex Account** with Headless API access
- **Discord Application** (for OAuth)

---

## 🚀 Quick Start (Localhost)

### Step 1: Clone and Install

```bash
# Navigate to project directory
cd ulog_tebex_site_v2

# Install backend dependencies
cd server
pnpm install

# Install frontend dependencies
cd ../client
pnpm install
```

---

### Step 2: Database Setup

```sql
-- Create database
CREATE DATABASE ulog_reviews CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use database
USE ulog_reviews;

-- Create reviews table
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_username VARCHAR(255) NOT NULL,
    user_avatar VARCHAR(512),
    product_name VARCHAR(512) NOT NULL,
    review_description TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product_name (product_name(255)),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### Step 3: Get API Keys

#### A. Tebex API Keys

1. **Headless API (Public/Private Token):**
   - Go to [Tebex Creator Dashboard](https://creator.tebex.io/)
   - Select your **Webstore**
   - Navigate to **Settings** → **API Keys**
   - Copy **Public Token** and **Private Key**

2. **Plugin API (Server Secret):**
   - Go to [Tebex Creator Dashboard](https://creator.tebex.io/)
   - Select your **Game Server** (not webstore!)
   - Navigate to **Settings**
   - Copy the **Secret Key**

#### B. Discord OAuth2

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select existing
3. Go to **OAuth2** → **General**
4. Copy **Client ID** and **Client Secret**
5. Add redirect URIs:
   - Development: `http://localhost:5173/auth/discord/callback`
   - Production: `https://your-domain.com/auth/discord/callback`

---

### Step 4: Configure Environment Variables

#### Server Configuration (`server/.env`)

Create `server/.env` with the following content:

```env
# Server Configuration
PORT=3001
FRONTEND_URL=http://localhost:5173

# Tebex Headless API Keys
TEBEX_PUBLIC_TOKEN=your_public_token_here
TEBEX_PRIVATE_KEY=your_private_key_here

# Tebex Plugin API (for recent payments)
TEBEX_SERVER_SECRET=your_server_secret_here

# Discord OAuth2
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:5173/auth/discord/callback
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_GUILD_ID=your_discord_guild_id

# MySQL Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ulog_reviews
```

#### Client Configuration (`client/.env`)

Create `client/.env` with:

```env
# Backend API URL
VITE_BACKEND_URL=http://localhost:3001

# Discord OAuth2
VITE_DISCORD_CLIENT_ID=your_discord_client_id_here
VITE_DISCORD_REDIRECT_URI=http://localhost:5173/auth/discord/callback

# Tebex Public Token
VITE_TEBEX_PUBLIC_TOKEN=your_public_token_here
```

**⚠️ Important:** Replace all `your_*_here` placeholders with your actual values!

---

### Step 5: Start Development Servers

```bash
# Terminal 1 - Start Backend
cd server
node index.js

# Terminal 2 - Start Frontend
cd client
pnpm dev
```

**Access your store at:** http://localhost:5173

---

## 🌐 Production Deployment

### Step 1: Prepare Server Environment

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install MySQL
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Install Nginx
sudo apt install -y nginx

# Install PM2 (process manager)
npm install -g pm2
```

---

### Step 2: Clone and Setup Project

```bash
# Clone project to server
cd /var/www
git clone your-repo-url ulog_store
cd ulog_store

# Install dependencies
cd server && pnpm install
cd ../client && pnpm install
```

---

### Step 3: Configure Production Environment

#### Server (`server/.env`)

```env
PORT=3001
FRONTEND_URL=https://your-domain.com

TEBEX_PUBLIC_TOKEN=your_production_token
TEBEX_PRIVATE_KEY=your_production_key
TEBEX_SERVER_SECRET=your_production_secret

DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
DISCORD_REDIRECT_URI=https://your-domain.com/auth/discord/callback
DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_GUILD_ID=your_discord_guild_id

DB_HOST=localhost
DB_PORT=3306
DB_USER=ulog_user
DB_PASSWORD=strong_production_password
DB_NAME=ulog_reviews
```

#### Client (`client/.env.production`)

```env
VITE_BACKEND_URL=https://your-domain.com
VITE_DISCORD_CLIENT_ID=your_client_id
VITE_DISCORD_REDIRECT_URI=https://your-domain.com/auth/discord/callback
VITE_TEBEX_PUBLIC_TOKEN=your_public_token
```

---

### Step 4: Build Frontend

```bash
cd client
pnpm build

# This creates a 'dist' folder with optimized production files
```

---

### Step 5: Configure Nginx

Create `/etc/nginx/sites-available/ulog_store`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend (static files)
    root /var/www/ulog_store/client/dist;
    index index.html;

    # Frontend routing (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json;
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/ulog_store /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Step 6: Setup SSL with Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
# Test renewal: sudo certbot renew --dry-run
```

---

### Step 7: Start Backend with PM2

```bash
cd /var/www/ulog_store/server

# Start backend
pm2 start index.js --name ulog-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# Check status
pm2 status
pm2 logs ulog-backend
```

---

### Step 8: Database Security (Production)

```bash
# Login to MySQL
sudo mysql

# Create dedicated user
CREATE USER 'ulog_user'@'localhost' IDENTIFIED BY 'strong_password_here';
GRANT ALL PRIVILEGES ON ulog_reviews.* TO 'ulog_user'@'localhost';
FLUSH PRIVILEGES;

# Create database (if not exists)
CREATE DATABASE ulog_reviews CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ulog_reviews;

# Create reviews table (same as localhost)
CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    user_id VARCHAR(255) NOT NULL,
    user_username VARCHAR(255) NOT NULL,
    user_avatar VARCHAR(512),
    product_name VARCHAR(512) NOT NULL,
    review_description TEXT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product_name (product_name(255)),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

EXIT;
```

---

### Step 9: Update Discord Redirect URIs

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **OAuth2** → **General**
4. Add your production redirect URI: `https://your-domain.com/auth/discord/callback`
5. Save changes

---

### Step 10: Test Production Deployment

```bash
# Check backend status
pm2 status
pm2 logs ulog-backend

# Check Nginx
sudo systemctl status nginx
sudo nginx -t

# Test API endpoint
curl https://your-domain.com/api/health

# Visit your site
# https://your-domain.com
```

---

## 🤖 Discord Bot Setup

The Discord bot handles review submissions via slash commands.

### Step 1: Create Discord Bot

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create new application or use existing
3. Go to **Bot** section
4. Click **Reset Token** and copy the bot token
5. Enable **Server Members Intent** and **Message Content Intent**

---

### Step 2: Configure Bot

Navigate to the Discord bot directory:

```bash
cd ulog-discord-bot
```

Edit `config.json`:

```json
{
  "token": "your_bot_token_here",
  "clientId": "your_application_id_here",
  "guildId": "your_discord_server_id_here",
  "tebexSecret": "your_tebex_server_secret",
  "db": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "your_mysql_password",
    "database": "ulog_reviews"
  }
}
```

---

### Step 3: Deploy Slash Commands

```bash
# Install dependencies
npm install

# Deploy commands to Discord
node deploy-commands.js

# You should see: "Successfully registered application commands."
```

---

### Step 4: Start Bot

```bash
# Development
node index.js

# Production (with PM2)
pm2 start index.js --name ulog-discord-bot
pm2 save
```

---

### Step 5: Invite Bot to Server

1. Go to Discord Developer Portal → Your App → OAuth2 → URL Generator
2. Select scopes: `bot`, `applications.commands`
3. Select permissions: `Send Messages`, `Use Slash Commands`
4. Copy generated URL and open in browser
5. Select your server and authorize

---

### Step 6: Using the Bot

In your Discord server:

```
/review
```

The bot will:
1. Ask for a transaction ID
2. Verify the transaction with Tebex API
3. Check if already reviewed
4. Open a modal for rating and review text
5. Save to database
6. Confirm submission

---

## 🔧 Troubleshooting

### Backend Issues

**Problem:** `Error: listen EADDRINUSE: address already in use :::3001`

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux
sudo lsof -ti:3001 | xargs kill -9
```

---

**Problem:** Backend shows "Missing configuration"

- Check that `server/.env` exists
- Verify all values are filled in (no `your_*_here` placeholders)
- No extra spaces around `=` sign
- File is named exactly `.env` (with dot at start)

---

**Problem:** "Failed to connect to MySQL"

```bash
# Check MySQL is running
sudo systemctl status mysql

# Test connection
mysql -u root -p -e "SHOW DATABASES;"

# Verify database exists
mysql -u root -p -e "USE ulog_reviews; SHOW TABLES;"
```

---

### Frontend Issues

**Problem:** "Network Error" when calling API

- Check `VITE_BACKEND_URL` in `.env` or `.env.production`
- Verify backend is running: `curl http://localhost:3001/api/health`
- Check browser console for CORS errors
- Clear browser cache (Ctrl+Shift+Delete)

---

**Problem:** Reviews not loading

- Check backend logs: `pm2 logs ulog-backend`
- Test endpoint: `curl http://localhost:3001/api/reviews/product/TestProduct`
- Verify MySQL connection
- Check if `VITE_BACKEND_URL` is correct

---

**Problem:** Discord auth fails

1. Verify `DISCORD_REDIRECT_URI` matches in:
   - `server/.env`
   - `client/.env` or `.env.production`
   - Discord Developer Portal OAuth2 settings
2. Check Discord Client ID and Secret are correct
3. Test token exchange endpoint manually

---

**Problem:** Tebex API returns 403

- Use **Server Secret** from Game Server settings (not webstore)
- Verify secret is correct in `server/.env`
- Check IP whitelist in Tebex settings (if applicable)

---

### Production Issues

**Problem:** PM2 process keeps crashing

```bash
# Check logs
pm2 logs ulog-backend --lines 100

# Check error details
pm2 describe ulog-backend

# Restart with fresh environment
pm2 delete ulog-backend
pm2 start index.js --name ulog-backend
pm2 save
```

---

**Problem:** Nginx 502 Bad Gateway

```bash
# Check backend is running
pm2 status

# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Verify proxy_pass URL in Nginx config
sudo nano /etc/nginx/sites-available/ulog_store

# Test Nginx config
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

**Problem:** SSL certificate issues

```bash
# Check certificate status
sudo certbot certificates

# Renew manually
sudo certbot renew

# Check Nginx SSL config
sudo nano /etc/nginx/sites-available/ulog_store
```

---

## 📡 API Documentation

### Backend Endpoints

#### Health Check
```
GET /api/health
```
Returns server status.

---

#### Tebex Categories
```
GET /api/tebex/categories
```
Fetches all product categories with packages.

---

#### Tebex Packages
```
GET /api/tebex/packages
GET /api/tebex/packages/:packageId
```
Fetches all packages or a specific package by ID.

---

#### Recent Payments
```
GET /api/tebex/payments/recent?limit=10
```
Fetches recent payments from Tebex Plugin API.

---

#### Create Basket
```
POST /api/tebex/baskets
Body: { complete_url, cancel_url, custom }
```
Creates a new Tebex basket.

---

#### Add to Basket
```
POST /api/tebex/baskets/:basketIdent/packages
Body: { package_id, quantity, type }
```
Adds a package to basket.

---

#### Get Basket Auth URL
```
GET /api/tebex/baskets/:basketIdent/auth?returnUrl=...
```
Gets authentication URL for basket checkout.

---

#### Discord Token Exchange
```
POST /api/discord/token
Body: { code }
```
Exchanges Discord OAuth code for access token.

---

#### Product Reviews
```
GET /api/reviews/product/:productName
```
Fetches reviews and stats for a product.

---

## 🔐 Security Features

- ✅ **Rate Limiting** - Global (100 req/15min) and strict (20 req/15min) limiters
- ✅ **Input Validation** - Joi schemas for all inputs
- ✅ **XSS Protection** - DOMPurify sanitization on frontend
- ✅ **SQL Injection Prevention** - Parameterized queries
- ✅ **CORS** - Configured for frontend domain only
- ✅ **Helmet.js** - Security headers
- ✅ **Environment Variables** - Sensitive data in .env files
- ✅ **HTTPS** - SSL/TLS encryption in production

---

## 📝 Environment Variables Reference

### Server Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Backend server port | `3001` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `TEBEX_PUBLIC_TOKEN` | Tebex Headless public token | `z5jb-xxxxx` |
| `TEBEX_PRIVATE_KEY` | Tebex Headless private key | `xxxxxxxx` |
| `TEBEX_SERVER_SECRET` | Tebex Plugin API secret | `xxxxxxxx` |
| `DISCORD_CLIENT_ID` | Discord OAuth client ID | `1234567890` |
| `DISCORD_CLIENT_SECRET` | Discord OAuth secret | `xxxxxxxx` |
| `DISCORD_REDIRECT_URI` | Discord OAuth callback | `http://localhost:5173/auth/discord/callback` |
| `DB_HOST` | MySQL host | `localhost` |
| `DB_PORT` | MySQL port | `3306` |
| `DB_USER` | MySQL user | `root` |
| `DB_PASSWORD` | MySQL password | `password` |
| `DB_NAME` | MySQL database | `ulog_reviews` |

### Client Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_BACKEND_URL` | Backend API URL | `http://localhost:3001` |
| `VITE_DISCORD_CLIENT_ID` | Discord client ID | `1234567890` |
| `VITE_DISCORD_REDIRECT_URI` | Discord callback | `http://localhost:5173/auth/discord/callback` |
| `VITE_TEBEX_PUBLIC_TOKEN` | Tebex public token | `z5jb-xxxxx` |

**⚠️ Note:** Client variables MUST have `VITE_` prefix!

---

## 🚀 Performance Optimization

### Frontend
- ✅ Vite for fast builds
- ✅ Code splitting
- ✅ Lazy loading routes
- ✅ Image optimization
- ✅ Gzip compression (Nginx)

### Backend
- ✅ Database indexing
- ✅ Connection pooling
- ✅ Rate limiting
- ✅ Efficient queries
- ✅ PM2 cluster mode (optional)

---

## 📦 Project Structure

```
ulog_tebex_site_v2/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts (Auth, Cart)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   ├── public/            # Static assets
│   ├── .env               # Development config
│   ├── .env.production    # Production config
│   └── package.json
│
├── server/                # Backend (Node.js + Express)
│   ├── database.js        # MySQL connection and queries
│   ├── validators.js      # Input validation schemas
│   ├── index.js           # Main server file
│   ├── .env               # Server configuration
│   └── package.json
│
└── README.md              # This file
```

---

## 🔄 Update Guide

### Updating Dependencies

```bash
# Backend
cd server
pnpm update

# Frontend
cd client
pnpm update
```

### Pulling Latest Changes

```bash
git pull origin main

# Reinstall dependencies
cd server && pnpm install
cd ../client && pnpm install

# Rebuild frontend
cd client && pnpm build

# Restart services
pm2 restart ulog-backend
```

---

## 📞 Support

For issues, questions, or contributions:
- Check the [Troubleshooting](#-troubleshooting) section
- Review your environment configuration
- Check server logs: `pm2 logs ulog-backend`
- Verify MySQL connection
- Test API endpoints manually

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🎉 Credits

Built with ❤️ for the FiveM community.

**Technologies:**
- React + TypeScript
- Node.js + Express
- MySQL
- Tebex API
- Discord API
- Mantine UI

---

**Happy selling! 🚀**
