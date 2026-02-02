const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static('public'));

// Data file paths
const DATA_DIR = './data';
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const POSTS_FILE = path.join(DATA_DIR, 'posts.json');
const STORIES_FILE = path.join(DATA_DIR, 'stories.json');
const FOLLOWS_FILE = path.join(DATA_DIR, 'follows.json');

// Initialize data directory and files
async function initializeData() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        
        // Initialize files if they don't exist
        const files = [
            { path: USERS_FILE, data: {} },
            { path: POSTS_FILE, data: [] },
            { path: STORIES_FILE, data: [] },
            { path: FOLLOWS_FILE, data: {} }
        ];
        
        for (const file of files) {
            try {
                await fs.access(file.path);
            } catch {
                await fs.writeFile(file.path, JSON.stringify(file.data, null, 2));
                console.log(`✅ Created ${file.path}`);
            }
        }
        
        console.log('🗄️ Database initialized successfully!');
    } catch (error) {
        console.error('❌ Error initializing database:', error);
    }
}

// Helper functions
async function readJsonFile(filePath) {
    try {
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error);
        return null;
    }
}

async function writeJsonFile(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error(`Error writing ${filePath}:`, error);
        return false;
    }
}

// Clean expired stories
async function cleanExpiredStories() {
    const stories = await readJsonFile(STORIES_FILE);
    if (!stories) return;
    
    const now = new Date().toISOString();
    const activeStories = stories.filter(story => story.expiresAt > now);
    
    if (activeStories.length !== stories.length) {
        await writeJsonFile(STORIES_FILE, activeStories);
        console.log(`🧹 Cleaned ${stories.length - activeStories.length} expired stories`);
    }
}

// Routes

// 🔐 AUTH ROUTES
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        if (!name || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const users = await readJsonFile(USERS_FILE);
        if (users[email]) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        
        users[email] = {
            id: uuidv4(),
            name,
            email,
            password, // In production, hash this!
            photo: '',
            bio: '',
            createdAt: new Date().toISOString()
        };
        
        await writeJsonFile(USERS_FILE, users);
        
        const { password: _, ...userWithoutPassword } = users[email];
        res.json({ user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const users = await readJsonFile(USERS_FILE);
        const user = users[email];
        
        if (!user || user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 👤 USER ROUTES
app.get('/api/users', async (req, res) => {
    try {
        const users = await readJsonFile(USERS_FILE);
        const publicUsers = Object.values(users).map(({ password, ...user }) => user);
        res.json(publicUsers);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/users/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const { name, bio, photo } = req.body;
        
        const users = await readJsonFile(USERS_FILE);
        if (!users[email]) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        users[email] = { ...users[email], name, bio, photo };
        await writeJsonFile(USERS_FILE, users);
        
        const { password: _, ...userWithoutPassword } = users[email];
        res.json({ user: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 📝 POST ROUTES
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await readJsonFile(POSTS_FILE);
        res.json(posts || []);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/posts', async (req, res) => {
    try {
        const { authorEmail, authorName, caption, tags, imageData } = req.body;
        
        const newPost = {
            id: uuidv4(),
            authorEmail,
            authorName,
            caption: caption || '',
            tags: tags || [],
            imageData: imageData || '',
            likes: 0,
            comments: [],
            createdAt: new Date().toISOString()
        };
        
        const posts = await readJsonFile(POSTS_FILE);
        posts.unshift(newPost);
        
        await writeJsonFile(POSTS_FILE, posts);
        res.json(newPost);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.put('/api/posts/:id/like', async (req, res) => {
    try {
        const { id } = req.params;
        const posts = await readJsonFile(POSTS_FILE);
        
        const postIndex = posts.findIndex(p => p.id === id);
        if (postIndex === -1) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        posts[postIndex].likes = (posts[postIndex].likes || 0) + 1;
        await writeJsonFile(POSTS_FILE, posts);
        
        res.json({ likes: posts[postIndex].likes });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/posts/:id/comment', async (req, res) => {
    try {
        const { id } = req.params;
        const { author, text } = req.body;
        
        const posts = await readJsonFile(POSTS_FILE);
        const postIndex = posts.findIndex(p => p.id === id);
        
        if (postIndex === -1) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        const newComment = {
            id: uuidv4(),
            author,
            text,
            timestamp: new Date().toISOString()
        };
        
        if (!posts[postIndex].comments) {
            posts[postIndex].comments = [];
        }
        posts[postIndex].comments.push(newComment);
        
        await writeJsonFile(POSTS_FILE, posts);
        res.json(newComment);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/posts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { userEmail } = req.query;
        
        const posts = await readJsonFile(POSTS_FILE);
        const postIndex = posts.findIndex(p => p.id === id);
        
        if (postIndex === -1) {
            return res.status(404).json({ error: 'Post not found' });
        }
        
        if (posts[postIndex].authorEmail !== userEmail) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        posts.splice(postIndex, 1);
        await writeJsonFile(POSTS_FILE, posts);
        
        res.json({ message: 'Post deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 📸 STORY ROUTES
app.get('/api/stories', async (req, res) => {
    try {
        await cleanExpiredStories();
        const stories = await readJsonFile(STORIES_FILE);
        res.json(stories || []);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/stories', async (req, res) => {
    try {
        const { authorEmail, authorName, authorPhoto, imageData, caption } = req.body;
        
        const newStory = {
            id: uuidv4(),
            authorEmail,
            authorName,
            authorPhoto: authorPhoto || '',
            imageData,
            caption: caption || '',
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        
        const stories = await readJsonFile(STORIES_FILE);
        stories.unshift(newStory);
        
        await writeJsonFile(STORIES_FILE, stories);
        res.json(newStory);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 👥 FOLLOW ROUTES
app.get('/api/follows/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const follows = await readJsonFile(FOLLOWS_FILE);
        
        res.json({
            following: follows[email]?.following || [],
            followers: follows[email]?.followers || []
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/follows', async (req, res) => {
    try {
        const { followerEmail, followingEmail } = req.body;
        
        if (followerEmail === followingEmail) {
            return res.status(400).json({ error: 'Cannot follow yourself' });
        }
        
        const follows = await readJsonFile(FOLLOWS_FILE);
        
        // Initialize if needed
        if (!follows[followerEmail]) follows[followerEmail] = { following: [], followers: [] };
        if (!follows[followingEmail]) follows[followingEmail] = { following: [], followers: [] };
        
        // Add to following/followers if not already there
        if (!follows[followerEmail].following.includes(followingEmail)) {
            follows[followerEmail].following.push(followingEmail);
        }
        if (!follows[followingEmail].followers.includes(followerEmail)) {
            follows[followingEmail].followers.push(followerEmail);
        }
        
        await writeJsonFile(FOLLOWS_FILE, follows);
        res.json({ message: 'Followed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.delete('/api/follows', async (req, res) => {
    try {
        const { followerEmail, followingEmail } = req.body;
        
        const follows = await readJsonFile(FOLLOWS_FILE);
        
        if (follows[followerEmail]) {
            follows[followerEmail].following = follows[followerEmail].following.filter(
                email => email !== followingEmail
            );
        }
        
        if (follows[followingEmail]) {
            follows[followingEmail].followers = follows[followingEmail].followers.filter(
                email => email !== followerEmail
            );
        }
        
        await writeJsonFile(FOLLOWS_FILE, follows);
        res.json({ message: 'Unfollowed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// 🔍 SEARCH ROUTE
app.get('/api/search', async (req, res) => {
    try {
        const { q, type = 'all' } = req.query;
        const query = q.toLowerCase();
        
        const results = { users: [], posts: [], hashtags: [] };
        
        if (type === 'all' || type === 'users') {
            const users = await readJsonFile(USERS_FILE);
            results.users = Object.values(users)
                .filter(user => 
                    user.name.toLowerCase().includes(query) || 
                    (user.bio && user.bio.toLowerCase().includes(query))
                )
                .map(({ password, ...user }) => user);
        }
        
        if (type === 'all' || type === 'posts') {
            const posts = await readJsonFile(POSTS_FILE);
            results.posts = posts.filter(post =>
                (post.caption && post.caption.toLowerCase().includes(query)) ||
                (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query))) ||
                post.authorName.toLowerCase().includes(query)
            );
        }
        
        if (type === 'all' || type === 'hashtags') {
            const posts = await readJsonFile(POSTS_FILE);
            const hashtags = new Set();
            posts.forEach(post => {
                if (post.tags) {
                    post.tags.forEach(tag => {
                        if (tag.toLowerCase().includes(query)) {
                            hashtags.add(tag);
                        }
                    });
                }
            });
            results.hashtags = Array.from(hashtags);
        }
        
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Media04 Backend is running! 🌟' });
});

// Start server
async function startServer() {
    await initializeData();
    
    app.listen(PORT, () => {
        console.log(`
🌟 =============================================== 🌟
    🦄 Media04 Backend Server is running! 🦄
    
    📍 Server: http://localhost:${PORT}
    🔗 API: http://localhost:${PORT}/api
    💖 Health: http://localhost:${PORT}/api/health
    
    🗄️ Database: JSON files in ./data/
    📸 Ready for your cute social media app!
🌟 =============================================== 🌟
        `);
    });
}

startServer().catch(console.error);