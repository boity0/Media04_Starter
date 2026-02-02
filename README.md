# Media04 - Fashion Social Media Platform

## Overview
This is a complete fashion-focused social media platform with **professional design**:
- **Backend Version**: Uses Node.js server with JSON file database
- **Clean Design**: Professional fashion boutique background, no emoji clutter
- **Modern UI**: Dark theme with glassmorphism effects

## 🌟 Features
- 📸 **Stories**: 24-hour disappearing content
- 🔍 **Discovery**: Search users, posts, hashtags
- 👥 **Social**: Follow users, like posts, comments
- 💾 **Save Posts**: Bookmark favorite content
- 🤝 **Collaboration Hub**: Connect with brands and influencers
- 📱 **Responsive**: Works on all devices
- 🎨 **Professional Design**: Fashion boutique background with clean interface

## 🚀 Quick Start

### Backend Version (Recommended)
1. **Start Backend Server:**
   ```bash
   npm install
   node server.js
   ```
   Server runs on http://localhost:3001

2. **Start Frontend Server:**
   ```bash
   npx http-server -p 3000 -c-1 --cors
   ```
   Frontend runs on http://localhost:3000

3. **Access the App:**
   - Open http://localhost:3000
   - Data persists in JSON files in `./data/` folder

## 📁 File Structure

### Frontend Files
- `index.html` - Login page
- `feed.html` - Main feed
- `create.html` - Create posts
- `stories.html` - Stories feature
- `discover.html` - Search & discovery
- `profile.html` - User profiles
- `collaboration.html` - Brand partnerships
- `signup.html` - User registration
- `style-new.css` - Professional styling with fashion background
- `script.js` - Frontend logic

### Backend Files
- `server.js` - Express.js API server
- `script-backend.js` - Backend integration logic
- `package.json` - Dependencies
- `data/` - JSON database files
  - `users.json` - User accounts
  - `posts.json` - All posts
  - `stories.json` - Stories (auto-expire)
  - `follows.json` - Following relationships

## 🎨 Design Features
- **Fashion boutique background** from Unsplash
- **Professional dark theme** with white text
- **Glassmorphism cards** with backdrop blur
- **Clean interactions** with smooth hover effects
- **No emoji clutter** - professional appearance
- **Responsive design** for mobile and desktop

## 🔧 API Endpoints

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

## 💡 Usage Tips
- Click "Explore (Demo)" to browse without signing up
- Create an account to test full functionality
- Upload fashion photos for posts and stories
- Use the collaboration hub to connect with brands
- Search for users, posts, or hashtags in the discover section

## 🛠️ Technology Stack
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js + Express.js
- **Database**: JSON files (easily replaceable with MongoDB/PostgreSQL)
- **Styling**: Custom CSS with fashion background and glassmorphism
- **Image Handling**: Base64 encoding for simplicity

## 📱 Mobile Support
- Touch-friendly interface
- Responsive navigation
- Optimized for mobile devices
- Fast loading with efficient caching

Perfect for fashion influencers, social media platforms, and modern web development! ✨