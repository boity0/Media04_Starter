// Media04 App - Backend Version
console.log('=== Media04 App Starting (Backend Version) ===');

const API_BASE = 'http://localhost:3001/api';

// API Helper Functions
async function apiCall(endpoint, options = {}) {
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'API Error');
        }
        
        return await response.json();
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// User Management
let currentUser = null;

function getCurrentUser() {
    if (!currentUser) {
        const stored = localStorage.getItem('media04_current_user');
        if (stored) {
            currentUser = JSON.parse(stored);
        }
    }
    return currentUser;
}

function setCurrentUser(user) {
    currentUser = user;
    if (user) {
        localStorage.setItem('media04_current_user', JSON.stringify(user));
    } else {
        localStorage.removeItem('media04_current_user');
    }
}

// Compress image function (reused from original)
function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                resolve(compressedDataUrl);
            };
            
            img.onerror = reject;
            img.src = e.target.result;
        };
        
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded (Backend Version)');
    initializePage();
});

function initializePage() {
    const page = window.location.pathname.split('/').pop() || 'index.html';
    console.log('📄 Initializing page:', page);
    
    try {
        setupLogoutButtons();
        updateUserInfo();
        
        switch(page) {
            case 'index.html':
                initLogin();
                break;
            case 'signup.html':
                initSignup();
                break;
            case 'create.html':
                initCreate();
                break;
            case 'profile.html':
                initProfile();
                break;
            case 'feed.html':
                initFeed();
                break;
            case 'stories.html':
                initStories();
                break;
            case 'discover.html':
                initDiscover();
                break;
            case 'collaboration.html':
                initCollaboration();
                break;
        }
        
        console.log('✅ Page initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing page:', error);
    }
}

function setupLogoutButtons() {
    const selectors = ['#logoutLink', '#logoutLink2', '#logoutLink3', '#logoutLink4'];
    selectors.forEach(selector => {
        const button = document.querySelector(selector);
        if (button) {
            button.onclick = function(e) {
                e.preventDefault();
                setCurrentUser(null);
                window.location.href = 'index.html';
            };
        }
    });
}

function updateUserInfo() {
    const user = getCurrentUser();
    if (user) {
        const brandElements = document.querySelectorAll('.brand.small');
        brandElements.forEach(el => {
            el.textContent = `Media04 — ${user.name}`;
        });
    }
}

// LOGIN PAGE
function initLogin() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.onclick = async function() {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            try {
                loginBtn.textContent = 'Logging in... 🌟';
                loginBtn.disabled = true;
                
                const response = await apiCall('/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({ email, password })
                });
                
                setCurrentUser(response.user);
                window.location.href = 'feed.html';
            } catch (error) {
                alert('Login failed: ' + error.message);
                loginBtn.textContent = 'Log in 🌟';
                loginBtn.disabled = false;
            }
        };
    }
}

// SIGNUP PAGE
function initSignup() {
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
        signupBtn.onclick = async function() {
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;
            
            if (!name || !email || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            try {
                signupBtn.textContent = 'Creating account... 🌟';
                signupBtn.disabled = true;
                
                const response = await apiCall('/auth/signup', {
                    method: 'POST',
                    body: JSON.stringify({ name, email, password })
                });
                
                setCurrentUser(response.user);
                alert('Account created! Welcome to Media04! 🎉');
                window.location.href = 'feed.html';
            } catch (error) {
                alert('Signup failed: ' + error.message);
                signupBtn.textContent = 'Sign up 🌟';
                signupBtn.disabled = false;
            }
        };
    }
}

// CREATE POST PAGE
function initCreate() {
    console.log('Initializing create page...');
    
    const imageInput = document.getElementById('postImage');
    if (imageInput) {
        imageInput.onchange = function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                if (file.size > 10 * 1024 * 1024) {
                    alert('Image too large (max 10MB). Please choose a smaller image.');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewArea = document.getElementById('previewArea');
                    previewArea.innerHTML = `
                        <img src="${e.target.result}" class="preview-img" alt="Preview">
                        <p style="color: #ff6b9d; text-align: center;">✓ Image loaded successfully! 🌟</p>
                    `;
                };
                reader.readAsDataURL(file);
            }
        };
    }
    
    const publishBtn = document.getElementById('publishBtn');
    if (publishBtn) {
        publishBtn.onclick = async function() {
            await createNewPost();
        };
    }
}

async function createNewPost() {
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in first');
        window.location.href = 'index.html';
        return;
    }
    
    const fileInput = document.getElementById('postImage');
    const caption = document.getElementById('postCaption').value.trim();
    const tagsInput = document.getElementById('postTags').value.trim();
    const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()) : [];
    
    if (!fileInput.files[0] && !caption) {
        alert('Please add an image or write a caption');
        return;
    }
    
    try {
        const publishBtn = document.getElementById('publishBtn');
        publishBtn.textContent = 'Publishing... 🌟';
        publishBtn.disabled = true;
        
        let imageData = '';
        if (fileInput.files[0]) {
            const compressedImage = await compressImage(fileInput.files[0]);
            imageData = compressedImage;
        }
        
        await apiCall('/posts', {
            method: 'POST',
            body: JSON.stringify({
                authorEmail: user.email,
                authorName: user.name,
                caption,
                tags,
                imageData
            })
        });
        
        // Clear form
        document.getElementById('postCaption').value = '';
        document.getElementById('postTags').value = '';
        document.getElementById('previewArea').innerHTML = '<p class="small text-center" style="color: #ff6b9d; padding: 2rem;">Your fabulous image will appear here after selection 🌟</p>';
        if (fileInput) fileInput.value = '';
        
        alert('🎉 Post published successfully!');
        setTimeout(() => {
            window.location.href = 'feed.html';
        }, 1000);
        
    } catch (error) {
        alert('Error publishing post: ' + error.message);
        const publishBtn = document.getElementById('publishBtn');
        publishBtn.textContent = 'Publish Post 🚀';
        publishBtn.disabled = false;
    }
}

// PROFILE PAGE
function initProfile() {
    const user = getCurrentUser();
    if (user) {
        document.getElementById('profileName').value = user.name || '';
        document.getElementById('profileBio').value = user.bio || '';
        
        const profilePic = document.getElementById('profilePic');
        if (profilePic && user.photo) {
            profilePic.src = user.photo;
            profilePic.style.display = 'block';
        }
    }
    
    const picInput = document.getElementById('profilePicFile');
    if (picInput) {
        picInput.onchange = async function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                try {
                    const compressedImage = await compressImage(file, 400, 0.6);
                    document.getElementById('profilePic').src = compressedImage;
                    document.getElementById('profilePic').style.display = 'block';
                } catch (error) {
                    alert('Error processing profile picture');
                }
            }
        };
    }
    
    const saveBtn = document.getElementById('saveProfile');
    if (saveBtn) {
        saveBtn.onclick = async function() {
            await saveProfile();
        };
    }
}

async function saveProfile() {
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in first');
        return;
    }
    
    const name = document.getElementById('profileName').value.trim();
    const bio = document.getElementById('profileBio').value.trim();
    const picFile = document.getElementById('profilePicFile').files[0];
    
    if (!name) {
        alert('Please enter your name');
        return;
    }
    
    try {
        const saveBtn = document.getElementById('saveProfile');
        saveBtn.textContent = 'Saving... 🌟';
        saveBtn.disabled = true;
        
        let photo = document.getElementById('profilePic').src;
        if (picFile) {
            photo = await compressImage(picFile, 400, 0.6);
        }
        
        const response = await apiCall(`/users/${user.email}`, {
            method: 'PUT',
            body: JSON.stringify({ name, bio, photo })
        });
        
        setCurrentUser(response.user);
        alert('🎉 Profile saved successfully!');
        
        saveBtn.textContent = 'Save Profile 💖';
        saveBtn.disabled = false;
        
    } catch (error) {
        alert('Error saving profile: ' + error.message);
        const saveBtn = document.getElementById('saveProfile');
        saveBtn.textContent = 'Save Profile 💖';
        saveBtn.disabled = false;
    }
}

// FEED PAGE
function initFeed() {
    loadFeed();
    loadStoriesPreview();
}

async function loadFeed() {
    const feedContainer = document.getElementById('feedContainer');
    if (!feedContainer) return;
    
    try {
        const posts = await apiCall('/posts');
        const currentUser = getCurrentUser();
        
        if (posts.length === 0) {
            feedContainer.innerHTML = `
                <div class="card">
                    <h3>Welcome to Media04! 👋</h3>
                    <p>No posts yet. Be the first to share your fashion style!</p>
                    <a href="create.html" class="btn">Create First Post ✨</a>
                </div>
            `;
            return;
        }
        
        feedContainer.innerHTML = posts.map(post => `
            <div class="card post-card" id="post-${post.id}">
                <div class="post-header">
                    <div class="post-avatar">${post.authorName ? post.authorName.charAt(0).toUpperCase() : 'U'}</div>
                    <div>
                        <strong>${escapeHtml(post.authorName)}</strong>
                        <div class="small">${new Date(post.createdAt).toLocaleString()}</div>
                    </div>
                </div>
                
                ${post.imageData ? `<img src="${post.imageData}" class="post-image" alt="Post image">` : ''}
                
                ${post.caption ? `<p>${escapeHtml(post.caption)}</p>` : ''}
                
                ${post.tags && post.tags.length > 0 ? `
                    <div class="post-tags">
                        ${post.tags.map(tag => `<span class="tag">#${escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
                
                <div class="post-actions">
                    <button class="like-btn" onclick="likePost('${post.id}')">❤️ ${post.likes || 0}</button>
                    <button class="comment-btn" onclick="commentOnPost('${post.id}')">💬 Comment</button>
                    ${post.authorEmail === currentUser?.email ? 
                        `<button class="delete-btn" onclick="deletePost('${post.id}')">🗑️ Delete</button>` : ''}
                </div>
                
                <div class="post-comments">
                    ${(post.comments || []).map(comment => `
                        <div class="comment">
                            <strong>${escapeHtml(comment.author || 'User')}:</strong> ${escapeHtml(comment.text)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        feedContainer.innerHTML = `
            <div class="card">
                <h3>Oops! 😅</h3>
                <p>Couldn't load posts. Make sure the backend server is running!</p>
                <p><small>Error: ${error.message}</small></p>
            </div>
        `;
    }
}

// Global functions for feed interactions
window.likePost = async function(postId) {
    try {
        await apiCall(`/posts/${postId}/like`, { method: 'PUT' });
        loadFeed(); // Reload to show updated likes
    } catch (error) {
        alert('Error liking post: ' + error.message);
    }
};

window.commentOnPost = async function(postId) {
    const commentText = prompt('Enter your comment:');
    if (!commentText) return;
    
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in to comment');
        return;
    }
    
    try {
        await apiCall(`/posts/${postId}/comment`, {
            method: 'POST',
            body: JSON.stringify({
                author: user.name,
                text: commentText
            })
        });
        loadFeed(); // Reload to show new comment
    } catch (error) {
        alert('Error adding comment: ' + error.message);
    }
};

window.deletePost = async function(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        await apiCall(`/posts/${postId}?userEmail=${user.email}`, { method: 'DELETE' });
        loadFeed(); // Reload to remove deleted post
    } catch (error) {
        alert('Error deleting post: ' + error.message);
    }
};

// STORIES FUNCTIONALITY
function initStories() {
    loadStoriesPreview();
    setupStoryCreation();
}

function setupStoryCreation() {
    const storyImage = document.getElementById('storyImage');
    const publishBtn = document.getElementById('publishStoryBtn');
    
    if (storyImage) {
        storyImage.onchange = function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('storyPreview');
                    preview.innerHTML = `<img src="${e.target.result}" alt="Story preview">`;
                    publishBtn.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        };
    }
    
    if (publishBtn) {
        publishBtn.onclick = publishStory;
    }
}

async function publishStory() {
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in first');
        return;
    }
    
    const fileInput = document.getElementById('storyImage');
    const caption = document.getElementById('storyCaption').value.trim();
    
    if (!fileInput.files[0]) {
        alert('Please select an image for your story');
        return;
    }
    
    try {
        const publishBtn = document.getElementById('publishStoryBtn');
        publishBtn.textContent = 'Publishing... 🌟';
        publishBtn.disabled = true;
        
        const file = fileInput.files[0];
        const compressedImage = await compressImage(file, 600, 0.8);
        
        await apiCall('/stories', {
            method: 'POST',
            body: JSON.stringify({
                authorEmail: user.email,
                authorName: user.name,
                authorPhoto: user.photo,
                imageData: compressedImage,
                caption
            })
        });
        
        alert('Story published! 📸');
        
        // Clear form
        document.getElementById('storyCaption').value = '';
        document.getElementById('storyPreview').innerHTML = '';
        publishBtn.style.display = 'none';
        fileInput.value = '';
        
        loadStoriesPreview();
        
    } catch (error) {
        alert('Error publishing story: ' + error.message);
        const publishBtn = document.getElementById('publishStoryBtn');
        publishBtn.textContent = 'Publish Story';
        publishBtn.disabled = false;
    }
}

async function loadStoriesPreview() {
    const container = document.getElementById('storiesPreview');
    if (!container) return;
    
    try {
        const stories = await apiCall('/stories');
        const storyUsers = getUniqueStoryUsers(stories);
        
        if (storyUsers.length === 0) {
            container.innerHTML = '<p class="empty-state">No stories yet. Be the first to share! 🌸</p>';
            return;
        }
        
        container.innerHTML = storyUsers.map((user, index) => `
            <div class="story-item" onclick="alert('Story viewer coming soon! 📸')">
                <div class="story-avatar">
                    ${user.photo ? `<img src="${user.photo}" alt="${user.name}">` : 
                      `<div style="width:100%;height:100%;background:linear-gradient(135deg,#ff9a9e,#fecfef);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">${user.name.charAt(0)}</div>`}
                </div>
                <div class="story-name">${user.name}</div>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = '<p class="empty-state">Error loading stories 😅</p>';
    }
}

function getUniqueStoryUsers(stories) {
    const userMap = new Map();
    stories.forEach(story => {
        if (!userMap.has(story.authorEmail)) {
            userMap.set(story.authorEmail, {
                email: story.authorEmail,
                name: story.authorName,
                photo: story.authorPhoto
            });
        }
    });
    return Array.from(userMap.values());
}

// DISCOVER PAGE
function initDiscover() {
    loadSuggestedUsers();
    setupSearch();
}

async function loadSuggestedUsers() {
    const container = document.getElementById('suggestedUsers');
    if (!container) return;
    
    try {
        const users = await apiCall('/users');
        const currentUser = getCurrentUser();
        
        const suggestions = users
            .filter(user => user.email !== currentUser?.email)
            .slice(0, 6);
        
        if (suggestions.length === 0) {
            container.innerHTML = '<p class="empty-state">No users to discover right now! 🌸</p>';
            return;
        }
        
        container.innerHTML = suggestions.map(user => `
            <div class="user-suggestion">
                <div class="user-avatar">${user.name.charAt(0)}</div>
                <h4>${user.name}</h4>
                <p class="small">${user.bio || 'Fashion enthusiast 💖'}</p>
                <button class="follow-btn" onclick="alert('Following feature coming soon! 💕')">Follow</button>
            </div>
        `).join('');
        
    } catch (error) {
        container.innerHTML = '<p class="empty-state">Error loading users 😅</p>';
    }
}

function setupSearch() {
    const searchBtn = document.querySelector('.search-btn');
    if (searchBtn) {
        searchBtn.onclick = performSearch;
    }
}

async function performSearch() {
    const query = document.getElementById('searchInput').value.trim();
    if (!query) return;
    
    try {
        const results = await apiCall(`/search?q=${encodeURIComponent(query)}`);
        displaySearchResults(results, query);
    } catch (error) {
        alert('Search error: ' + error.message);
    }
}

function displaySearchResults(results, query) {
    const container = document.getElementById('searchResultsContent');
    const resultsDiv = document.getElementById('searchResults');
    
    if (!container || !resultsDiv) return;
    
    resultsDiv.style.display = 'block';
    
    let html = `<h4>Search results for "${query}" 🔍</h4>`;
    
    if (results.users.length > 0) {
        html += '<h5>Users 👥</h5>';
        html += results.users.map(user => `
            <div class="search-result-item">
                <div class="search-result-avatar">${user.name.charAt(0)}</div>
                <div class="search-result-info">
                    <div class="search-result-name">${user.name}</div>
                    <div class="search-result-meta">${user.bio || 'Fashion enthusiast 💖'}</div>
                </div>
            </div>
        `).join('');
    }
    
    if (results.posts.length > 0) {
        html += '<h5>Posts 📝</h5>';
        html += results.posts.slice(0, 5).map(post => `
            <div class="search-result-item">
                ${post.imageData ? `<img src="${post.imageData}" style="width:50px;height:50px;object-fit:cover;border-radius:5px;margin-right:1rem;" alt="Post">` : 
                  '<div class="search-result-avatar">📝</div>'}
                <div class="search-result-info">
                    <div class="search-result-name">${post.authorName}</div>
                    <div class="search-result-meta">${post.caption ? post.caption.substring(0, 100) + '...' : 'No caption'}</div>
                </div>
            </div>
        `).join('');
    }
    
    if (results.hashtags.length > 0) {
        html += '<h5>Hashtags 🏷️</h5>';
        html += '<div class="trending-tags">';
        html += results.hashtags.map(tag => 
            `<span class="trending-tag">#${tag}</span>`
        ).join('');
        html += '</div>';
    }
    
    if (results.users.length === 0 && results.posts.length === 0 && results.hashtags.length === 0) {
        html += '<p class="empty-state">No results found. Try a different search term! 🌸</p>';
    }
    
    container.innerHTML = html;
}

// COLLABORATION PAGE (placeholder)
function initCollaboration() {
    console.log('Collaboration page - using original functionality for now');
    // Keep original collaboration functionality
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('=== Media04 Backend Version Loaded ===');