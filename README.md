# Media04 - Starter HTML/CSS/JS MVP

## Overview
This is a complete fashion-focused social media platform with **two versions**:
- **Local Version**: Uses localStorage (no backend needed)
- **Backend Version**: Uses Node.js server with JSON file database

## 🌟 Features
- ✨ **Cute Design**: Pastel gradients, floating emojis, glassmorphism effects
- 📸 **Stories**: 24-hour disappearing content
- 🔍 **Discovery**: Search users, posts, hashtags
- 👥 **Social**: Follow users, like posts, comments
- 💾 **Save Posts**: Bookmark favorite content
- 🤝 **Collaboration Hub**: Connect with brands and influencers
- 📱 **Responsive**: Works on all devices

## 🚀 Quick Start

### Option 1: Local Version (No Backend)
1. Open `index.html` in your browser
2. Uses localStorage for data persistence
3. Perfect for demos and testing

### Option 2: Backend Version (Real Database)
1. **Start Backend Server:**
   ```bash
   npm install
   node server.js
   ```
   Server runs on http://localhost:3001

2. **Start Frontend Server:**
   ```bash
   npx http-server -p 3000
   ```
   Frontend runs on http://localhost:3000

3. **Access Backend Version:**
   - Open http://localhost:3000/index-backend.html
   - Data persists in JSON files in `./data/` folder

## 📁 File Structure

### Frontend Files
- `index.html` - Local version login
- `index-backend.html` - Backend version login
- `feed.html` / `feed-backend.html` - Main feed
- `create.html` / `create-backend.html` - Create posts
- `stories.html` / `stories-backend.html` - Stories feature
- `discover.html` / `discover-backend.html` - Search & discovery
- `profile.html` / `profile-backend.html` - User profiles
- `collaboration.html` - Brand partnerships
- `style.css` - Cute styling with animations
- `script.js` - Local version logic
- `script-backend.js` - Backend version logic

### Backend Files
- `server.js` - Express.js API server
- `package.json` - Dependencies
- `data/` - JSON database files
  - `users.json` - User accounts
  - `posts.json` - All posts
  - `stories.json` - Stories (auto-expire)
  - `follows.json` - Following relationships

## 🎨 Design Features
- **Animated gradients** that shift through pastel colors
- **Floating emoji elements** across all pages
- **Glassmorphism cards** with backdrop blur
- **Cute interactions** with hover effects and animations
- **Comic Sans MS font** for extra cuteness
- **Responsive design** for mobile and desktop

## 🔧 API Endpoints (Backend Version)

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login

### Users
- `GET /api/users` - Get all users
- `PUT /api/users/:email` - Update profile

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create post
- `PUT /api/posts/:id/like` - Like post
- `POST /api/posts/:id/comment` - Add comment
- `DELETE /api/posts/:id` - Delete post

### Stories
- `GET /api/stories` - Get active stories
- `POST /api/stories` - Create story

### Social
- `GET /api/follows/:email` - Get following/followers
- `POST /api/follows` - Follow user
- `DELETE /api/follows` - Unfollow user

### Search
- `GET /api/search?q=query&type=all` - Search content

## 💡 Demo Tips
- **Local Version**: Click "Explore (Demo)" to browse without signing up
- **Backend Version**: Create an account to test full functionality
- **Image Upload**: Choose fashion photos, they'll be compressed automatically
- **Stories**: Upload images that disappear after 24 hours
- **Search**: Try searching for users, posts, or hashtags
- **Mobile**: Works great on phones and tablets

## 🛠️ Development
- **Frontend**: Pure HTML/CSS/JavaScript
- **Backend**: Node.js + Express
- **Database**: JSON files (easily replaceable with MongoDB/PostgreSQL)
- **Storage**: Base64 encoded images (for simplicity)

## 🌈 Customization
- Modify `style.css` for different color schemes
- Update emoji sets in floating elements
- Add new API endpoints in `server.js`
- Extend functionality in `script-backend.js`

## 📱 Mobile Support
- Touch-friendly interface
- Responsive navigation
- Optimized image handling
- Fast loading on mobile networks

Perfect for fashion influencers, social media demos, and learning full-stack development! 🦄✨

