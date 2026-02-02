// Media04 App - Fixed Image Saving
console.log('=== Media04 App Starting ===');

// Utility functions
function getPosts() {
    try {
        return JSON.parse(localStorage.getItem('media04_posts') || '[]');
    } catch (error) {
        console.error('Error reading posts:', error);
        return [];
    }
}

function savePosts(posts) {
    try {
        localStorage.setItem('media04_posts', JSON.stringify(posts));
        console.log('Posts saved successfully');
        return true;
    } catch (error) {
        console.error('Error saving posts:', error);
        
        // Check if it's a quota exceeded error
        if (error.name === 'QuotaExceededError') {
            alert('Storage is full. Please clear some data or use smaller images.');
        } else {
            alert('Error saving data. Please try again.');
        }
        return false;
    }
}

function getUsers() {
    try {
        return JSON.parse(localStorage.getItem('media04_users') || '{}');
    } catch (error) {
        console.error('Error reading users:', error);
        return {};
    }
}

function saveUsers(users) {
    try {
        localStorage.setItem('media04_users', JSON.stringify(users));
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('media04_current') || 'null');
    } catch (error) {
        console.error('Error reading current user:', error);
        return null;
    }
}

function setCurrentUser(user) {
    try {
        localStorage.setItem('media04_current', JSON.stringify(user));
        return true;
    } catch (error) {
        console.error('Error setting current user:', error);
        return false;
    }
}

// Compress image to reduce size
function compressImage(file, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                
                // Calculate new dimensions
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                // Convert to compressed data URL
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

// Check available storage
function getRemainingStorage() {
    try {
        let total = 0;
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                total += localStorage[key].length;
            }
        }
        return (5 * 1024 * 1024) - total; // 5MB - used
    } catch (error) {
        return 0;
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 DOM Content Loaded');
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
        }
        
        console.log('✅ Page initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing page:', error);
    }
}

function setupLogoutButtons() {
    const selectors = ['#logoutLink', '#logoutLink2', '#logoutLink3'];
    selectors.forEach(selector => {
        const button = document.querySelector(selector);
        if (button) {
            button.onclick = function(e) {
                e.preventDefault();
                localStorage.removeItem('media04_current');
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
        loginBtn.onclick = function() {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            const users = getUsers();
            const user = users[email];
            
            if (!user || user.password !== password) {
                alert('Invalid email or password');
                return;
            }
            
            setCurrentUser({
                email: email,
                name: user.name,
                photo: user.photo,
                bio: user.bio
            });
            
            window.location.href = 'feed.html';
        };
    }
}

// SIGNUP PAGE
function initSignup() {
    const signupBtn = document.getElementById('signupBtn');
    if (signupBtn) {
        signupBtn.onclick = function() {
            const name = document.getElementById('signupName').value.trim();
            const email = document.getElementById('signupEmail').value.trim();
            const password = document.getElementById('signupPassword').value;
            
            if (!name || !email || !password) {
                alert('Please fill in all fields');
                return;
            }
            
            const users = getUsers();
            if (users[email]) {
                alert('Email already exists');
                return;
            }
            
            users[email] = {
                name: name,
                password: password,
                photo: '',
                bio: ''
            };
            
            if (saveUsers(users) && setCurrentUser({
                email: email,
                name: name,
                photo: '',
                bio: ''
            })) {
                alert('Account created!');
                window.location.href = 'feed.html';
            }
        };
    }
}

// CREATE POST PAGE - WITH IMAGE COMPRESSION
function initCreate() {
    console.log('Initializing create page...');
    
    // Image upload
    const imageInput = document.getElementById('postImage');
    if (imageInput) {
        imageInput.onchange = function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                if (file.size > 10 * 1024 * 1024) { // 10MB limit
                    alert('Image too large (max 10MB). Please choose a smaller image.');
                    return;
                }
                
                const reader = new FileReader();
                reader.onload = function(e) {
                    const previewArea = document.getElementById('previewArea');
                    previewArea.innerHTML = `
                        <img src="${e.target.result}" class="preview-img" alt="Preview">
                        <p style="color: green; text-align: center;">✓ Image loaded successfully</p>
                        <p style="text-align: center; font-size: 12px; color: #666;">
                            Image will be compressed to save space
                        </p>
                    `;
                };
                reader.onerror = function() {
                    alert('Error reading image file');
                };
                reader.readAsDataURL(file);
            } else {
                alert('Please select a valid image file (JPEG, PNG, etc.)');
            }
        };
    }
    
    // Publish button
    const publishBtn = document.getElementById('publishBtn');
    if (publishBtn) {
        publishBtn.onclick = async function() {
            console.log('=== PUBLISH BUTTON CLICKED ===');
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
    
    console.log('Post data:', { hasImage: !!fileInput.files[0], caption, tags });
    
    if (!fileInput.files[0] && !caption) {
        alert('Please add an image or write a caption');
        return;
    }
    
    // Check storage space
    const remainingSpace = getRemainingStorage();
    if (remainingSpace < 100 * 1024) { // Less than 100KB remaining
        if (!confirm('Storage space is low. Some old posts may be removed to make space. Continue?')) {
            return;
        }
        // Remove some old posts to free space
        const posts = getPosts();
        if (posts.length > 10) {
            posts.splice(10); // Keep only 10 most recent posts
            savePosts(posts);
        }
    }
    
    const newPost = {
        id: Date.now().toString(),
        authorEmail: user.email,
        authorName: user.name,
        caption: caption,
        tags: tags,
        likes: 0,
        comments: [],
        createdAt: new Date().toISOString()
    };
    
    // Handle image with compression
    if (fileInput.files[0]) {
        try {
            const file = fileInput.files[0];
            console.log('Original file size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
            
            // Show compression message
            const publishBtn = document.getElementById('publishBtn');
            const originalText = publishBtn.textContent;
            publishBtn.textContent = 'Compressing image...';
            publishBtn.disabled = true;
            
            // Compress image
            const compressedImage = await compressImage(file);
            console.log('Compressed image size:', (compressedImage.length / 1024).toFixed(2), 'KB');
            
            newPost.imageData = compressedImage;
            
            // Restore button
            publishBtn.textContent = originalText;
            publishBtn.disabled = false;
            
            if (saveNewPost(newPost)) {
                showSuccess('Post published successfully!');
            }
        } catch (error) {
            console.error('Error processing image:', error);
            alert('Error processing image. Please try a different image.');
            
            // Restore button
            const publishBtn = document.getElementById('publishBtn');
            publishBtn.textContent = 'Publish Post';
            publishBtn.disabled = false;
        }
    } else {
        if (saveNewPost(newPost)) {
            showSuccess('Post published successfully!');
        }
    }
}

function saveNewPost(post) {
    try {
        const posts = getPosts();
        posts.unshift(post);
        
        if (savePosts(posts)) {
            // Clear form
            document.getElementById('postCaption').value = '';
            document.getElementById('postTags').value = '';
            document.getElementById('previewArea').innerHTML = '';
            if (document.getElementById('postImage')) {
                document.getElementById('postImage').value = '';
            }
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error saving post:', error);
        
        if (error.name === 'QuotaExceededError') {
            alert('Storage is full! Please clear your browser data or use smaller images.');
        } else {
            alert('Error saving post: ' + error.message);
        }
        return false;
    }
}

function showSuccess(message) {
    alert('🎉 ' + message);
    setTimeout(() => {
        window.location.href = 'feed.html';
    }, 1000);
}

// PROFILE PAGE
function initProfile() {
    // Load current user data
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
    
    // Profile picture upload
    const picInput = document.getElementById('profilePicFile');
    if (picInput) {
        picInput.onchange = async function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                try {
                    // Compress profile picture too
                    const compressedImage = await compressImage(file, 400, 0.6);
                    document.getElementById('profilePic').src = compressedImage;
                    document.getElementById('profilePic').style.display = 'block';
                } catch (error) {
                    alert('Error processing profile picture');
                }
            }
        };
    }
    
    // Save profile button
    const saveBtn = document.getElementById('saveProfile');
    if (saveBtn) {
        saveBtn.onclick = async function() {
            console.log('=== SAVE PROFILE BUTTON CLICKED ===');
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
    
    const users = getUsers();
    
    if (picFile) {
        try {
            const compressedImage = await compressImage(picFile, 400, 0.6);
            if (updateUserProfile(users, user, name, bio, compressedImage)) {
                showSuccess('Profile saved successfully!');
            }
        } catch (error) {
            alert('Error processing profile picture');
        }
    } else {
        const currentPhoto = document.getElementById('profilePic').src;
        if (updateUserProfile(users, user, name, bio, currentPhoto)) {
            showSuccess('Profile saved successfully!');
        }
    }
}

function updateUserProfile(users, user, name, bio, photo) {
    try {
        users[user.email] = {
            ...users[user.email],
            name: name,
            bio: bio,
            photo: photo
        };
        
        if (saveUsers(users) && setCurrentUser({
            ...user,
            name: name,
            bio: bio,
            photo: photo
        })) {
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error saving profile. Please try again.');
        return false;
    }
}

// FEED PAGE
function initFeed() {
    loadFeed();
}

function loadFeed() {
    const feedContainer = document.getElementById('feedContainer');
    if (!feedContainer) return;
    
    const posts = getPosts();
    console.log('Loading', posts.length, 'posts');
    
    if (posts.length === 0) {
        feedContainer.innerHTML = `
            <div class="card">
                <h3>Welcome to Media04! 👋</h3>
                <p>No posts yet. Be the first to share your fashion style!</p>
                <a href="create.html" class="btn">Create First Post</a>
            </div>
        `;
        return;
    }
    
    feedContainer.innerHTML = posts.map(post => `
        <div class="card post-card">
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
                    ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="post-actions">
                <button class="like-btn" onclick="likePost('${post.id}')">❤️ ${post.likes || 0}</button>
                <button class="comment-btn" onclick="commentOnPost('${post.id}')">💬 Comment</button>
                ${post.authorEmail === (getCurrentUser()?.email) ? 
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
}

// Global functions for feed interactions
window.likePost = function(postId) {
    const posts = getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
        posts[postIndex].likes = (posts[postIndex].likes || 0) + 1;
        savePosts(posts);
        loadFeed();
    }
};

window.commentOnPost = function(postId) {
    const commentText = prompt('Enter your comment:');
    if (!commentText) return;
    
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in to comment');
        return;
    }
    
    const posts = getPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
        if (!posts[postIndex].comments) {
            posts[postIndex].comments = [];
        }
        posts[postIndex].comments.push({
            author: user.name,
            text: commentText,
            timestamp: new Date().toISOString()
        });
        savePosts(posts);
        loadFeed();
    }
};

window.deletePost = function(postId) {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    const posts = getPosts();
    const filteredPosts = posts.filter(p => p.id !== postId);
    savePosts(filteredPosts);
    loadFeed();
};

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

console.log('=== Media04 App Loaded ===');
// COLLABORATION HUB
function initCollaboration() {
    console.log('Initializing collaboration hub...');
    loadCollaborations();
    loadInfluencers();
    loadBrands();
    setupCollaborationFilters();
}

// Sample collaboration data
const sampleCollaborations = [
    {
        id: 1,
        title: "Summer Collection Launch",
        brand: "UrbanThreads",
        type: "sponsored_post",
        budget: "$500",
        description: "Looking for influencers to showcase our new summer collection. Content should focus on streetwear styling.",
        requirements: "10K+ followers, Instagram/TikTok",
        deadline: "2025-04-15",
        category: "sponsored"
    },
    {
        id: 2,
        title: "Eco-Friendly Activewear Campaign",
        brand: "GreenFit",
        type: "brand_ambassador",
        budget: "$200 + Products",
        description: "Seeking sustainable fashion influencers for long-term brand ambassadorship.",
        requirements: "Focus on sustainability, 5K+ followers",
        deadline: "2025-04-20",
        category: "campaign"
    },
    {
        id: 3,
        title: "Beauty Product Gifting",
        brand: "GlamBox",
        type: "gifting",
        budget: "Products Only",
        description: "Gifting our new beauty box to influencers for honest reviews and unboxing content.",
        requirements: "Beauty/lifestyle content",
        deadline: "2025-04-10",
        category: "gifting"
    }
];

const sampleInfluencers = [
    {
        id: 1,
        name: "Fashionista Emma",
        niche: "streetwear",
        followers: "45.2K",
        engagement: "4.8%",
        platforms: ["Instagram", "TikTok"],
        location: "New York",
        rate: "$200-$500"
    },
    {
        id: 2,
        name: "Sustainable Style",
        niche: "sustainable",
        followers: "28.7K",
        engagement: "5.2%",
        platforms: ["Instagram", "YouTube"],
        location: "Los Angeles",
        rate: "$150-$400"
    },
    {
        id: 3,
        name: "Luxe Living",
        niche: "luxury",
        followers: "89.5K",
        engagement: "3.9%",
        platforms: ["Instagram"],
        location: "Miami",
        rate: "$500-$1,000"
    },
    {
        id: 4,
        name: "Beauty Guru Sarah",
        niche: "beauty",
        followers: "156.3K",
        engagement: "4.1%",
        platforms: ["Instagram", "TikTok", "YouTube"],
        location: "Chicago",
        rate: "$800-$2,000"
    }
];

const sampleBrands = [
    {
        id: 1,
        name: "UrbanThreads",
        industry: "Streetwear",
        description: "Urban fashion brand focused on contemporary streetwear",
        collaborationTypes: ["Sponsored Posts", "Brand Ambassador"]
    },
    {
        id: 2,
        name: "EcoStyle",
        industry: "Sustainable Fashion",
        description: "Sustainable and ethical fashion brand",
        collaborationTypes: ["Product Gifting", "Content Creation"]
    },
    {
        id: 3,
        name: "Luxe Collection",
        industry: "Luxury Fashion",
        description: "High-end luxury fashion and accessories",
        collaborationTypes: ["Event Appearances", "Campaigns"]
    }
];

function loadCollaborations() {
    const collaborationList = document.getElementById('collaborationList');
    if (!collaborationList) return;

    collaborationList.innerHTML = sampleCollaborations.map(collab => `
        <div class="collaboration-card" data-category="${collab.category}">
            <div class="collaboration-header">
                <div>
                    <h3>${collab.title}</h3>
                    <p>by <strong>${collab.brand}</strong></p>
                </div>
                <div class="collab-badge">${collab.type.replace('_', ' ')}</div>
            </div>
            
            <p>${collab.description}</p>
            
            <div class="collaboration-meta">
                <span class="budget">💰 ${collab.budget}</span>
                <span>📅 ${collab.deadline}</span>
                <span>🎯 ${collab.requirements}</span>
            </div>
            
            <div class="action-buttons">
                <button class="btn-outline" onclick="viewCollaboration(${collab.id})">View Details</button>
                <button class="btn-success" onclick="applyForCollaboration(${collab.id})">Apply Now</button>
            </div>
        </div>
    `).join('');
}

function loadInfluencers() {
    const influencersList = document.getElementById('influencersList');
    if (!influencersList) return;

    influencersList.innerHTML = sampleInfluencers.map(influencer => `
        <div class="influencer-card" data-niche="${influencer.niche}" data-followers="${influencer.followers}">
            <div class="influencer-avatar">${influencer.name.charAt(0)}</div>
            <h3>${influencer.name}</h3>
            <span class="niche-tag">${influencer.niche}</span>
            
            <div class="influencer-stats">
                <div class="stat-item">
                    <span class="stat-value">${influencer.followers}</span>
                    Followers
                </div>
                <div class="stat-item">
                    <span class="stat-value engagement-${influencer.engagement > '4%' ? 'high' : 'medium'}">${influencer.engagement}</span>
                    Engagement
                </div>
            </div>
            
            <p><small>📍 ${influencer.location}</small></p>
            <p><small>💵 ${influencer.rate}</small></p>
            <p><small>📱 ${influencer.platforms.join(', ')}</small></p>
            
            <div class="action-buttons">
                <button class="btn-outline" onclick="viewInfluencerProfile(${influencer.id})">View Profile</button>
                <button class="btn-success" onclick="contactInfluencer(${influencer.id})">Contact</button>
            </div>
        </div>
    `).join('');
}

function loadBrands() {
    const brandsList = document.getElementById('brandsList');
    if (!brandsList) return;

    brandsList.innerHTML = sampleBrands.map(brand => `
        <div class="brand-card">
            <div class="brand-logo">${brand.name.charAt(0)}</div>
            <h3>${brand.name}</h3>
            <p class="brand-industry">${brand.industry}</p>
            <p>${brand.description}</p>
            <div style="margin: 1rem 0;">
                ${brand.collaborationTypes.map(type => `<span class="niche-tag">${type}</span>`).join('')}
            </div>
            <button class="btn-outline" onclick="viewBrandProfile(${brand.id})">View Brand</button>
        </div>
    `).join('');
}

function setupCollaborationFilters() {
    // Collaboration filters
    const categoryFilter = document.getElementById('categoryFilter');
    const budgetFilter = document.getElementById('budgetFilter');
    const platformFilter = document.getElementById('platformFilter');
    
    if (categoryFilter) categoryFilter.addEventListener('change', filterCollaborations);
    if (budgetFilter) budgetFilter.addEventListener('change', filterCollaborations);
    if (platformFilter) platformFilter.addEventListener('change', filterCollaborations);

    // Influencer filters
    const nicheFilter = document.getElementById('nicheFilter');
    const followersFilter = document.getElementById('followersFilter');
    const engagementFilter = document.getElementById('engagementFilter');
    
    if (nicheFilter) nicheFilter.addEventListener('change', filterInfluencers);
    if (followersFilter) followersFilter.addEventListener('change', filterInfluencers);
    if (engagementFilter) engagementFilter.addEventListener('change', filterInfluencers);
}

function filterCollaborations() {
    const category = document.getElementById('categoryFilter').value;
    const budget = document.getElementById('budgetFilter').value;
    const platform = document.getElementById('platformFilter').value;
    
    // In a real app, this would filter the actual data
    console.log('Filtering collaborations:', { category, budget, platform });
    // For now, we'll just reload all collaborations
    loadCollaborations();
}

function filterInfluencers() {
    const niche = document.getElementById('nicheFilter').value;
    const followers = document.getElementById('followersFilter').value;
    const engagement = document.getElementById('engagementFilter').value;
    
    console.log('Filtering influencers:', { niche, followers, engagement });
    // For now, we'll just reload all influencers
    loadInfluencers();
}

function searchInfluencers() {
    const searchTerm = document.getElementById('influencerSearch').value.toLowerCase();
    console.log('Searching influencers for:', searchTerm);
    // In a real app, this would filter influencers based on search term
    loadInfluencers();
}

// Collaboration Actions
function viewCollaboration(collabId) {
    const collaboration = sampleCollaborations.find(c => c.id === collabId);
    if (collaboration) {
        alert(`📋 ${collaboration.title}\n\nBrand: ${collaboration.brand}\nBudget: ${collaboration.budget}\nDescription: ${collaboration.description}\nRequirements: ${collaboration.requirements}\nDeadline: ${collaboration.deadline}`);
    }
}

function applyForCollaboration(collabId) {
    const collaboration = sampleCollaborations.find(c => c.id === collabId);
    if (collaboration) {
        const user = getCurrentUser();
        if (!user) {
            alert('Please log in to apply for collaborations');
            return;
        }
        
        const message = prompt(`Why are you interested in collaborating with ${collaboration.brand}?`);
        if (message) {
            alert(`✅ Application sent to ${collaboration.brand}!\n\nWe'll notify you when they respond.`);
            // In a real app, this would save the application to a database
        }
    }
}

function viewInfluencerProfile(influencerId) {
    const influencer = sampleInfluencers.find(i => i.id === influencerId);
    if (influencer) {
        alert(`👤 ${influencer.name}\n\nNiche: ${influencer.niche}\nFollowers: ${influencer.followers}\nEngagement: ${influencer.engagement}\nLocation: ${influencer.location}\nPlatforms: ${influencer.platforms.join(', ')}\nRate: ${influencer.rate}`);
    }
}

function contactInfluencer(influencerId) {
    const influencer = sampleInfluencers.find(i => i.id === influencerId);
    if (influencer) {
        const user = getCurrentUser();
        if (!user) {
            alert('Please log in to contact influencers');
            return;
        }
        
        const message = prompt(`What would you like to discuss with ${influencer.name}?`);
        if (message) {
            alert(`✅ Message sent to ${influencer.name}!\n\nThey'll respond through your Media04 inbox.`);
        }
    }
}

function viewBrandProfile(brandId) {
    const brand = sampleBrands.find(b => b.id === brandId);
    if (brand) {
        alert(`🏢 ${brand.name}\n\nIndustry: ${brand.industry}\nDescription: ${brand.description}\nCollaboration Types: ${brand.collaborationTypes.join(', ')}`);
    }
}

function sendCollaborationRequest() {
    const user = getCurrentUser();
    if (!user) {
        alert('Please log in to send collaboration requests');
        return;
    }

    const type = document.getElementById('collabType').value;
    const title = document.getElementById('collabTitle').value.trim();
    const description = document.getElementById('collabDescription').value.trim();
    const budget = document.getElementById('collabBudget').value.trim();
    const deadline = document.getElementById('collabDeadline').value.trim();

    if (!type || !title || !description) {
        alert('Please fill in all required fields');
        return;
    }

    // In a real app, this would save to a database
    alert(`✅ Collaboration request sent!\n\nTitle: ${title}\nType: ${type}\nWe'll match you with suitable partners and notify you of responses.`);

    // Clear form
    document.getElementById('collabType').value = '';
    document.getElementById('collabTitle').value = '';
    document.getElementById('collabDescription').value = '';
    document.getElementById('collabBudget').value = '';
    document.getElementById('collabDeadline').value = '';
}

// Also update the navigation in all pages to include the Collaborate link
// Add this to your existing HTML files in the navigation:
// <a href="collaboration.html">Collaborate</a>

// STORIES FUNCTIONALITY
function getStories() {
    try {
        return JSON.parse(localStorage.getItem('media04_stories') || '[]');
    } catch (error) {
        console.error('Error reading stories:', error);
        return [];
    }
}

function saveStories(stories) {
    try {
        localStorage.setItem('media04_stories', JSON.stringify(stories));
        return true;
    } catch (error) {
        console.error('Error saving stories:', error);
        return false;
    }
}

function initStories() {
    console.log('Initializing stories page...');
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
        const file = fileInput.files[0];
        const compressedImage = await compressImage(file, 600, 0.8);
        
        const newStory = {
            id: Date.now().toString(),
            authorEmail: user.email,
            authorName: user.name,
            authorPhoto: user.photo,
            imageData: compressedImage,
            caption: caption,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };
        
        const stories = getStories();
        stories.unshift(newStory);
        
        if (saveStories(stories)) {
            alert('Story published! 📸');
            // Clear form
            document.getElementById('storyCaption').value = '';
            document.getElementById('storyPreview').innerHTML = '';
            document.getElementById('publishStoryBtn').style.display = 'none';
            fileInput.value = '';
            loadStoriesPreview();
        }
    } catch (error) {
        console.error('Error publishing story:', error);
        alert('Error publishing story. Please try again.');
    }
}

function loadStoriesPreview() {
    const container = document.getElementById('storiesPreview');
    if (!container) return;
    
    const stories = getActiveStories();
    const storyUsers = getUniqueStoryUsers(stories);
    
    if (storyUsers.length === 0) {
        container.innerHTML = '<p class="empty-state">No stories yet. Be the first to share!</p>';
        return;
    }
    
    container.innerHTML = storyUsers.map((user, index) => `
        <div class="story-item" onclick="openStoryViewer('${user.email}', ${index})">
            <div class="story-avatar">
                ${user.photo ? `<img src="${user.photo}" alt="${user.name}">` : 
                  `<div style="width:100%;height:100%;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">${user.name.charAt(0)}</div>`}
            </div>
            <div class="story-name">${user.name}</div>
        </div>
    `).join('');
}

function getActiveStories() {
    const stories = getStories();
    const now = new Date().toISOString();
    return stories.filter(story => story.expiresAt > now);
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

let currentStoryIndex = 0;
let currentUserStories = [];

function openStoryViewer(userEmail, startIndex = 0) {
    const stories = getActiveStories();
    currentUserStories = stories.filter(story => story.authorEmail === userEmail);
    currentStoryIndex = 0;
    
    if (currentUserStories.length === 0) return;
    
    const modal = document.getElementById('storyModal');
    modal.style.display = 'flex';
    showCurrentStory();
    startStoryProgress();
}

function showCurrentStory() {
    if (currentStoryIndex >= currentUserStories.length) {
        closeStoryViewer();
        return;
    }
    
    const story = currentUserStories[currentStoryIndex];
    const modal = document.getElementById('storyModal');
    
    modal.querySelector('.story-author').textContent = story.authorName;
    modal.querySelector('.story-time').textContent = getTimeAgo(story.createdAt);
    modal.querySelector('.story-image').src = story.imageData;
    modal.querySelector('.story-caption').textContent = story.caption || '';
    
    const avatar = modal.querySelector('.story-header .story-avatar');
    if (story.authorPhoto) {
        avatar.innerHTML = `<img src="${story.authorPhoto}" alt="${story.authorName}">`;
    } else {
        avatar.innerHTML = `<div style="width:100%;height:100%;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">${story.authorName.charAt(0)}</div>`;
    }
}

function startStoryProgress() {
    const progressBar = document.querySelector('.story-progress-bar');
    progressBar.style.width = '0%';
    
    let progress = 0;
    const interval = setInterval(() => {
        progress += 1;
        progressBar.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            nextStory();
        }
    }, 50); // 5 second duration
    
    // Store interval for cleanup
    window.currentStoryInterval = interval;
}

function nextStory() {
    if (window.currentStoryInterval) {
        clearInterval(window.currentStoryInterval);
    }
    
    currentStoryIndex++;
    if (currentStoryIndex < currentUserStories.length) {
        showCurrentStory();
        startStoryProgress();
    } else {
        closeStoryViewer();
    }
}

function previousStory() {
    if (window.currentStoryInterval) {
        clearInterval(window.currentStoryInterval);
    }
    
    currentStoryIndex = Math.max(0, currentStoryIndex - 1);
    showCurrentStory();
    startStoryProgress();
}

function closeStoryViewer() {
    if (window.currentStoryInterval) {
        clearInterval(window.currentStoryInterval);
    }
    
    const modal = document.getElementById('storyModal');
    modal.style.display = 'none';
}

// FOLLOWING SYSTEM
function getFollowing() {
    try {
        const user = getCurrentUser();
        if (!user) return [];
        return JSON.parse(localStorage.getItem(`media04_following_${user.email}`) || '[]');
    } catch (error) {
        console.error('Error reading following:', error);
        return [];
    }
}

function saveFollowing(following) {
    try {
        const user = getCurrentUser();
        if (!user) return false;
        localStorage.setItem(`media04_following_${user.email}`, JSON.stringify(following));
        return true;
    } catch (error) {
        console.error('Error saving following:', error);
        return false;
    }
}

function getFollowers(userEmail) {
    try {
        return JSON.parse(localStorage.getItem(`media04_followers_${userEmail}`) || '[]');
    } catch (error) {
        console.error('Error reading followers:', error);
        return [];
    }
}

function saveFollowers(userEmail, followers) {
    try {
        localStorage.setItem(`media04_followers_${userEmail}`, JSON.stringify(followers));
        return true;
    } catch (error) {
        console.error('Error saving followers:', error);
        return false;
    }
}

function followUser(targetEmail) {
    const user = getCurrentUser();
    if (!user || user.email === targetEmail) return false;
    
    const following = getFollowing();
    if (following.includes(targetEmail)) return false;
    
    // Add to current user's following
    following.push(targetEmail);
    saveFollowing(following);
    
    // Add current user to target's followers
    const followers = getFollowers(targetEmail);
    if (!followers.includes(user.email)) {
        followers.push(user.email);
        saveFollowers(targetEmail, followers);
    }
    
    return true;
}

function unfollowUser(targetEmail) {
    const user = getCurrentUser();
    if (!user) return false;
    
    const following = getFollowing();
    const index = following.indexOf(targetEmail);
    if (index === -1) return false;
    
    // Remove from current user's following
    following.splice(index, 1);
    saveFollowing(following);
    
    // Remove current user from target's followers
    const followers = getFollowers(targetEmail);
    const followerIndex = followers.indexOf(user.email);
    if (followerIndex !== -1) {
        followers.splice(followerIndex, 1);
        saveFollowers(targetEmail, followers);
    }
    
    return true;
}

function isFollowing(targetEmail) {
    const following = getFollowing();
    return following.includes(targetEmail);
}

// SAVED POSTS FUNCTIONALITY
function getSavedPosts() {
    try {
        const user = getCurrentUser();
        if (!user) return [];
        return JSON.parse(localStorage.getItem(`media04_saved_${user.email}`) || '[]');
    } catch (error) {
        console.error('Error reading saved posts:', error);
        return [];
    }
}

function saveSavedPosts(savedPosts) {
    try {
        const user = getCurrentUser();
        if (!user) return false;
        localStorage.setItem(`media04_saved_${user.email}`, JSON.stringify(savedPosts));
        return true;
    } catch (error) {
        console.error('Error saving saved posts:', error);
        return false;
    }
}

function savePost(postId) {
    const savedPosts = getSavedPosts();
    if (!savedPosts.includes(postId)) {
        savedPosts.push(postId);
        saveSavedPosts(savedPosts);
        return true;
    }
    return false;
}

function unsavePost(postId) {
    const savedPosts = getSavedPosts();
    const index = savedPosts.indexOf(postId);
    if (index !== -1) {
        savedPosts.splice(index, 1);
        saveSavedPosts(savedPosts);
        return true;
    }
    return false;
}

function isPostSaved(postId) {
    const savedPosts = getSavedPosts();
    return savedPosts.includes(postId);
}

// DISCOVER PAGE FUNCTIONALITY
function initDiscover() {
    console.log('Initializing discover page...');
    loadSuggestedUsers();
    loadSavedPostsGrid();
    setupSearchFilters();
}

function loadSuggestedUsers() {
    const container = document.getElementById('suggestedUsers');
    if (!container) return;
    
    const users = getUsers();
    const currentUser = getCurrentUser();
    const following = getFollowing();
    
    // Get users not being followed
    const suggestions = Object.entries(users)
        .filter(([email, user]) => 
            email !== currentUser?.email && 
            !following.includes(email)
        )
        .slice(0, 6); // Show max 6 suggestions
    
    if (suggestions.length === 0) {
        container.innerHTML = '<p class="empty-state">No new users to follow right now!</p>';
        return;
    }
    
    container.innerHTML = suggestions.map(([email, user]) => `
        <div class="user-suggestion">
            <div class="user-avatar">${user.name.charAt(0)}</div>
            <h4>${user.name}</h4>
            <p class="small">${user.bio || 'Fashion enthusiast'}</p>
            <button class="follow-btn" onclick="toggleFollow('${email}', this)">Follow</button>
        </div>
    `).join('');
}

function toggleFollow(targetEmail, button) {
    const isCurrentlyFollowing = isFollowing(targetEmail);
    
    if (isCurrentlyFollowing) {
        if (unfollowUser(targetEmail)) {
            button.textContent = 'Follow';
            button.classList.remove('following');
        }
    } else {
        if (followUser(targetEmail)) {
            button.textContent = 'Following';
            button.classList.add('following');
        }
    }
}

function loadSavedPostsGrid() {
    const container = document.getElementById('savedPosts');
    if (!container) return;
    
    const savedPostIds = getSavedPosts();
    const allPosts = getPosts();
    const savedPosts = allPosts.filter(post => savedPostIds.includes(post.id));
    
    if (savedPosts.length === 0) {
        container.innerHTML = '<p class="empty-state">💾<br>No saved posts yet.<br>Save posts you love to view them here!</p>';
        return;
    }
    
    container.innerHTML = savedPosts.map(post => `
        <div class="saved-post-item" onclick="viewPost('${post.id}')">
            ${post.imageData ? `<img src="${post.imageData}" alt="Saved post">` : 
              `<div style="height:200px;background:#f8f9fa;display:flex;align-items:center;justify-content:center;color:#666;">📝 Text Post</div>`}
            <div class="saved-post-overlay">
                <strong>${post.authorName}</strong>
                <p>${post.caption ? post.caption.substring(0, 50) + '...' : ''}</p>
            </div>
        </div>
    `).join('');
}

function setupSearchFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

function performSearch() {
    const query = document.getElementById('searchInput').value.trim().toLowerCase();
    if (!query) return;
    
    const activeFilter = document.querySelector('.filter-btn.active').dataset.filter;
    const results = searchContent(query, activeFilter);
    displaySearchResults(results, query);
}

function searchContent(query, filter) {
    const results = { users: [], posts: [], hashtags: [] };
    
    if (filter === 'all' || filter === 'users') {
        const users = getUsers();
        Object.entries(users).forEach(([email, user]) => {
            if (user.name.toLowerCase().includes(query) || 
                (user.bio && user.bio.toLowerCase().includes(query))) {
                results.users.push({ email, ...user });
            }
        });
    }
    
    if (filter === 'all' || filter === 'posts') {
        const posts = getPosts();
        results.posts = posts.filter(post => 
            (post.caption && post.caption.toLowerCase().includes(query)) ||
            (post.tags && post.tags.some(tag => tag.toLowerCase().includes(query))) ||
            post.authorName.toLowerCase().includes(query)
        );
    }
    
    if (filter === 'all' || filter === 'hashtags') {
        const posts = getPosts();
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
    
    return results;
}

function displaySearchResults(results, query) {
    const container = document.getElementById('searchResultsContent');
    const resultsDiv = document.getElementById('searchResults');
    
    if (!container || !resultsDiv) return;
    
    resultsDiv.style.display = 'block';
    
    let html = `<h4>Search results for "${query}"</h4>`;
    
    if (results.users.length > 0) {
        html += '<h5>Users</h5>';
        html += results.users.map(user => `
            <div class="search-result-item">
                <div class="search-result-avatar">${user.name.charAt(0)}</div>
                <div class="search-result-info">
                    <div class="search-result-name">${user.name}</div>
                    <div class="search-result-meta">${user.bio || 'Fashion enthusiast'}</div>
                </div>
                <button class="follow-btn ${isFollowing(user.email) ? 'following' : ''}" 
                        onclick="toggleFollow('${user.email}', this)">
                    ${isFollowing(user.email) ? 'Following' : 'Follow'}
                </button>
            </div>
        `).join('');
    }
    
    if (results.posts.length > 0) {
        html += '<h5>Posts</h5>';
        html += results.posts.slice(0, 5).map(post => `
            <div class="search-result-item" onclick="viewPost('${post.id}')">
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
        html += '<h5>Hashtags</h5>';
        html += '<div class="trending-tags">';
        html += results.hashtags.map(tag => 
            `<span class="trending-tag" onclick="searchTag('${tag}')">#${tag}</span>`
        ).join('');
        html += '</div>';
    }
    
    if (results.users.length === 0 && results.posts.length === 0 && results.hashtags.length === 0) {
        html += '<p class="empty-state">No results found. Try a different search term!</p>';
    }
    
    container.innerHTML = html;
}

function searchTag(tag) {
    document.getElementById('searchInput').value = tag;
    performSearch();
}

function viewPost(postId) {
    // For now, just scroll to the post in the feed
    window.location.href = `feed.html#post-${postId}`;
}

// UTILITY FUNCTIONS
function getTimeAgo(dateString) {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'now';
    if (diffInSeconds < 3600) return Math.floor(diffInSeconds / 60) + 'm';
    if (diffInSeconds < 86400) return Math.floor(diffInSeconds / 3600) + 'h';
    return Math.floor(diffInSeconds / 86400) + 'd';
}

// UPDATE EXISTING FUNCTIONS

// Update initializePage to handle new pages
const originalInitializePage = initializePage;
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
                loadStoriesPreview(); // Add stories to feed
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

// Update loadFeed to include new features
const originalLoadFeed = loadFeed;
function loadFeed() {
    const feedContainer = document.getElementById('feedContainer');
    if (!feedContainer) return;
    
    const posts = getPosts();
    const currentUser = getCurrentUser();
    const savedPosts = getSavedPosts();
    
    console.log('Loading', posts.length, 'posts');
    
    if (posts.length === 0) {
        feedContainer.innerHTML = `
            <div class="card">
                <h3>Welcome to Media04! 👋</h3>
                <p>No posts yet. Be the first to share your fashion style!</p>
                <a href="create.html" class="btn">Create First Post</a>
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
                    ${currentUser && post.authorEmail !== currentUser.email ? 
                        `<button class="follow-user-btn ${isFollowing(post.authorEmail) ? 'following' : ''}" 
                                onclick="toggleFollowFromPost('${post.authorEmail}', this)">
                            ${isFollowing(post.authorEmail) ? 'Following' : 'Follow'}
                        </button>` : ''}
                    <div class="small">${new Date(post.createdAt).toLocaleString()}</div>
                </div>
            </div>
            
            ${post.imageData ? `<img src="${post.imageData}" class="post-image" alt="Post image">` : ''}
            
            ${post.caption ? `<p>${escapeHtml(post.caption)}</p>` : ''}
            
            ${post.tags && post.tags.length > 0 ? `
                <div class="post-tags">
                    ${post.tags.map(tag => `<span class="tag" onclick="searchTag('${tag}')">#${tag}</span>`).join('')}
                </div>
            ` : ''}
            
            <div class="post-actions">
                <button class="like-btn" onclick="likePost('${post.id}')">❤️ ${post.likes || 0}</button>
                <button class="comment-btn" onclick="commentOnPost('${post.id}')">💬 Comment</button>
                ${post.authorEmail === currentUser?.email ? 
                    `<button class="delete-btn" onclick="deletePost('${post.id}')">🗑️ Delete</button>` : ''}
                <button class="save-btn ${savedPosts.includes(post.id) ? 'saved' : ''}" 
                        onclick="toggleSavePost('${post.id}', this)">
                    ${savedPosts.includes(post.id) ? '🔖 Saved' : '📌 Save'}
                </button>
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
}

// New global functions
window.toggleSavePost = function(postId, button) {
    const isSaved = isPostSaved(postId);
    
    if (isSaved) {
        if (unsavePost(postId)) {
            button.textContent = '📌 Save';
            button.classList.remove('saved');
        }
    } else {
        if (savePost(postId)) {
            button.textContent = '🔖 Saved';
            button.classList.add('saved');
        }
    }
};

window.toggleFollowFromPost = function(targetEmail, button) {
    toggleFollow(targetEmail, button);
};

console.log('=== Enhanced Media04 Features Loaded ===');