const MAX_CHARS = 280;
const RING_CIRCUMFERENCE = 62.83;
const STORAGE_KEY = "mini_twitter_posts_v3";
const PROFILE_KEY = "mini_twitter_profile_v1";
const THEME_KEY = "mini_twitter_theme";

// DOM Elements
const postInput = document.getElementById("postInput");
const postImageUrl = document.getElementById("postImageUrl");
const imageInputDrawer = document.getElementById("imageInputDrawer");
const toggleImageBtn = document.getElementById("toggleImageBtn");
const emojiBar = document.getElementById("emojiBar");
const toggleEmojiBtn = document.getElementById("toggleEmojiBtn");
const charCount = document.getElementById("charCount");
const ringProgress = document.getElementById("ringProgress");
const postBtn = document.getElementById("postBtn");
const postFeed = document.getElementById("postFeed");
const headerTitle = document.getElementById("headerTitle");

const themeToggle = document.getElementById("themeToggle");
const sunIcon = document.getElementById("sunIcon");
const moonIcon = document.getElementById("moonIcon");

const desktopSearchInput = document.getElementById("desktopSearchInput");
const mobileSearchToggle = document.getElementById("mobileSearchToggle");
const mobileSearchBar = document.getElementById("mobileSearchBar");
const mobileSearchInput = document.getElementById("mobileSearchInput");
const clearMobileSearch = document.getElementById("clearMobileSearch");

const activeFilterBanner = document.getElementById("activeFilterBanner");
const activeFilterText = document.getElementById("activeFilterText");
const resetFilterBtn = document.getElementById("resetFilterBtn");

const profileSection = document.getElementById("profileSection");
const editProfileToggle = document.getElementById("editProfileToggle");
const profileEditForm = document.getElementById("profileEditForm");
const cancelProfileEdit = document.getElementById("cancelProfileEdit");

const toastEl = document.getElementById("toast");

// App State
let currentView = "all"; // 'all' | 'liked' | 'bookmarks' | 'profile'
let searchQuery = "";

let userProfile = JSON.parse(localStorage.getItem(PROFILE_KEY)) || {
  name: "Sri",
  handle: "@invinsiblesri",
  bio: "Full-Stack Web Developer building clean, fast & responsive web experiences.",
  following: ["alexcodes"],
};

let posts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
  {
    id: 1,
    author: "Sri",
    handle: "@invinsiblesri",
    verified: true,
    content: "Now live on both Desktop & Mobile! Try clicking #WebDev, replying to a post, or saving bookmarks.",
    imageUrl: "",
    timestamp: "Just now",
    likes: 18,
    liked: false,
    reposts: 4,
    reposted: false,
    bookmarked: true,
    showReplies: false,
    replies: [
      { id: 101, author: "Maya Lin", text: "The responsive bottom bar on mobile feels super smooth!" },
    ],
    isEditing: false,
  },
  {
    id: 2,
    author: "Alex Rivera",
    handle: "@alexcodes",
    verified: true,
    content: "Building interactive UIs with pure HTML, CSS Grid, and vanilla #JavaScript is unbeatable for speed. #UIUX",
    imageUrl: "",
    timestamp: "2h ago",
    likes: 9,
    liked: true,
    reposts: 2,
    reposted: false,
    bookmarked: false,
    showReplies: false,
    replies: [],
    isEditing: false,
  },
];

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  localStorage.setItem(PROFILE_KEY, JSON.stringify(userProfile));
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add("show");
  clearTimeout(toastEl._timer);
  toastEl._timer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function formatContentWithHashtags(text) {
  const safe = escapeHTML(text);
  return safe.replace(/(#[a-zA-Z0-9_]+)/g, '<span class="hashtag" data-tag="$1">$1</span>');
}

// =========================================
// THEME TOGGLE
// =========================================
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  sunIcon.classList.toggle("hidden", theme !== "dark");
  moonIcon.classList.toggle("hidden", theme === "dark");
}

applyTheme(localStorage.getItem(THEME_KEY) || "dark");

themeToggle.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  applyTheme(next);
});

// =========================================
// PROFILE SYNC & EDITING
// =========================================
function syncProfileUI() {
  const initial = userProfile.name.charAt(0).toUpperCase() || "U";
  document.getElementById("sideAvatar").textContent = initial;
  document.getElementById("composerAvatar").textContent = initial;
  document.getElementById("profileAvatarLg").textContent = initial;

  document.getElementById("sideName").textContent = userProfile.name;
  document.getElementById("sideHandle").textContent = userProfile.handle;
  document.getElementById("profileDisplayName").textContent = userProfile.name;
  document.getElementById("profileDisplayHandle").textContent = userProfile.handle;
  document.getElementById("profileDisplayBio").textContent = userProfile.bio;

  const myPostsCount = posts.filter((p) => p.handle === userProfile.handle).length;
  document.getElementById("statPosts").textContent = myPostsCount;
  document.getElementById("statFollowing").textContent = userProfile.following.length;
}

editProfileToggle.addEventListener("click", () => {
  document.getElementById("editNameInput").value = userProfile.name;
  document.getElementById("editHandleInput").value = userProfile.handle;
  document.getElementById("editBioInput").value = userProfile.bio;
  profileEditForm.classList.toggle("hidden");
});

cancelProfileEdit.addEventListener("click", () => {
  profileEditForm.classList.add("hidden");
});

profileEditForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const newName = document.getElementById("editNameInput").value.trim();
  let newHandle = document.getElementById("editHandleInput").value.trim();
  const newBio = document.getElementById("editBioInput").value.trim();

  if (!newName || !newHandle) return;
  if (!newHandle.startsWith("@")) newHandle = "@" + newHandle;

  userProfile.name = newName;
  userProfile.handle = newHandle;
  userProfile.bio = newBio || "Building on Mini Twitter.";
  saveState();
  syncProfileUI();
  profileEditForm.classList.add("hidden");
  showToast("Profile updated!");
});

// =========================================
// COMPOSER LOGIC
// =========================================
function updateComposerUI() {
  const length = postInput.value.length;
  const remaining = MAX_CHARS - length;
  const progress = Math.min(length / MAX_CHARS, 1);

  charCount.textContent = remaining;
  ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE - progress * RING_CIRCUMFERENCE;

  ringProgress.classList.remove("warning", "danger");
  if (remaining <= 20) ringProgress.classList.add("danger");
  else if (remaining <= 60) ringProgress.classList.add("warning");

  postBtn.disabled = postInput.value.trim().length === 0 || remaining < 0;
}

postInput.addEventListener("input", updateComposerUI);

toggleImageBtn.addEventListener("click", () => {
  imageInputDrawer.classList.toggle("hidden");
  if (!imageInputDrawer.classList.contains("hidden")) postImageUrl.focus();
});

toggleEmojiBtn.addEventListener("click", () => {
  emojiBar.classList.toggle("hidden");
});

emojiBar.addEventListener("click", (e) => {
  if (e.target.classList.contains("emoji-btn")) {
    postInput.value += e.target.textContent;
    postInput.focus();
    updateComposerUI();
  }
});

function createPost() {
  const content = postInput.value.trim();
  const rawImg = postImageUrl.value.trim();
  const validImg = rawImg.startsWith("http://") || rawImg.startsWith("https://") ? rawImg : "";

  if (!content || content.length > MAX_CHARS) return;

  const newPost = {
    id: Date.now(),
    author: userProfile.name,
    handle: userProfile.handle,
    verified: true,
    content,
    imageUrl: validImg,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    likes: 0,
    liked: false,
    reposts: 0,
    reposted: false,
    bookmarked: false,
    showReplies: false,
    replies: [],
    isEditing: false,
  };

  posts.unshift(newPost);
  saveState();

  postInput.value = "";
  postImageUrl.value = "";
  imageInputDrawer.classList.add("hidden");
  emojiBar.classList.add("hidden");
  updateComposerUI();
  syncProfileUI();
  renderPosts();
  showToast("Post published!");
}

postBtn.addEventListener("click", createPost);
postInput.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !postBtn.disabled) createPost();
});

// Mobile FAB & Sidebar Post Button focus composer
function focusComposer() {
  window.scrollTo({ top: 0, behavior: "smooth" });
  setTimeout(() => postInput.focus(), 250);
}

document.getElementById("mobileFab").addEventListener("click", focusComposer);
document.getElementById("sidebarPostBtn").addEventListener("click", focusComposer);

// =========================================
// NAVIGATION, TABS & SEARCH FILTERING
// =========================================
function switchView(view) {
  currentView = view;
  const titles = { all: "Home", liked: "Liked Posts", bookmarks: "Bookmarks", profile: "Profile" };
  headerTitle.textContent = titles[view] || "Home";

  document.querySelectorAll(".nav-item, .tab-btn, .bottom-nav-item").forEach((el) => {
    el.classList.toggle("active", el.dataset.view === view);
  });

  profileSection.classList.toggle("hidden", view !== "profile");
  renderPosts();
}

document.querySelectorAll(".nav-item, .tab-btn, .bottom-nav-item").forEach((btn) => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

document.getElementById("sidebarProfileCard").addEventListener("click", () => switchView("profile"));

function setSearchFilter(query) {
  searchQuery = query.trim();
  desktopSearchInput.value = searchQuery;
  mobileSearchInput.value = searchQuery;

  if (searchQuery) {
    activeFilterBanner.classList.remove("hidden");
    activeFilterText.textContent = `Filtering by "${searchQuery}"`;
  } else {
    activeFilterBanner.classList.add("hidden");
  }
  renderPosts();
}

desktopSearchInput.addEventListener("input", (e) => setSearchFilter(e.target.value));
mobileSearchInput.addEventListener("input", (e) => setSearchFilter(e.target.value));

mobileSearchToggle.addEventListener("click", () => {
  mobileSearchBar.classList.toggle("hidden");
  if (!mobileSearchBar.classList.contains("hidden")) mobileSearchInput.focus();
});

clearMobileSearch.addEventListener("click", () => {
  setSearchFilter("");
  mobileSearchBar.classList.add("hidden");
});

resetFilterBtn.addEventListener("click", () => setSearchFilter(""));

// Trending Hashtags Click
document.getElementById("trendList").addEventListener("click", (e) => {
  const item = e.target.closest(".trend-item");
  if (item) setSearchFilter(item.dataset.tag);
});

// Who to Follow Toggle
document.getElementById("followList").addEventListener("click", (e) => {
  const btn = e.target.closest(".btn-follow");
  if (!btn) return;
  const user = btn.dataset.user;
  const idx = userProfile.following.indexOf(user);

  if (idx === -1) {
    userProfile.following.push(user);
    btn.textContent = "Following";
    btn.classList.add("following");
    showToast(`Following @${user}`);
  } else {
    userProfile.following.splice(idx, 1);
    btn.textContent = "Follow";
    btn.classList.remove("following");
  }
  saveState();
  syncProfileUI();
});

// =========================================
// FEED INTERACTIONS (Event Delegation)
// =========================================
postFeed.addEventListener("click", (e) => {
  // Clickable Hashtag inside post
  if (e.target.classList.contains("hashtag")) {
    setSearchFilter(e.target.dataset.tag);
    return;
  }

  const card = e.target.closest(".post-card");
  if (!card) return;
  const postId = Number(card.dataset.id);
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  if (e.target.closest(".like-btn")) {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    saveState();
    renderPosts();
  } else if (e.target.closest(".repost-btn")) {
    post.reposted = !post.reposted;
    post.reposts += post.reposted ? 1 : -1;
    saveState();
    renderPosts();
  } else if (e.target.closest(".bookmark-btn")) {
    post.bookmarked = !post.bookmarked;
    saveState();
    renderPosts();
    showToast(post.bookmarked ? "Saved to Bookmarks" : "Removed from Bookmarks");
  } else if (e.target.closest(".comment-btn")) {
    post.showReplies = !post.showReplies;
    renderPosts();
  } else if (e.target.closest(".share-btn")) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`${post.author} (${post.handle}): "${post.content}"`);
      showToast("Post copied to clipboard!");
    }
  } else if (e.target.closest(".edit-btn")) {
    post.isEditing = true;
    renderPosts();
  } else if (e.target.closest(".cancel-edit-btn")) {
    post.isEditing = false;
    renderPosts();
  } else if (e.target.closest(".save-edit-btn")) {
    const updated = card.querySelector(".edit-textarea").value.trim();
    if (updated && updated.length <= MAX_CHARS) {
      post.content = updated;
      post.isEditing = false;
      saveState();
      renderPosts();
      showToast("Post updated");
    }
  } else if (e.target.closest(".delete-btn")) {
    posts = posts.filter((p) => p.id !== postId);
    saveState();
    syncProfileUI();
    renderPosts();
    showToast("Post deleted");
  }
});

// Handle Reply Submissions
postFeed.addEventListener("submit", (e) => {
  if (!e.target.classList.contains("reply-form")) return;
  e.preventDefault();
  const card = e.target.closest(".post-card");
  const postId = Number(card.dataset.id);
  const post = posts.find((p) => p.id === postId);
  const input = e.target.querySelector(".reply-input");
  const text = input.value.trim();

  if (post && text) {
    post.replies.push({ id: Date.now(), author: userProfile.name, text });
    post.showReplies = true;
    saveState();
    renderPosts();
    showToast("Reply added");
  }
});

// =========================================
// RENDER FEED
// =========================================
function renderPosts() {
  let filtered = [...posts];

  if (currentView === "liked") {
    filtered = filtered.filter((p) => p.liked);
  } else if (currentView === "bookmarks") {
    filtered = filtered.filter((p) => p.bookmarked);
  } else if (currentView === "profile") {
    filtered = filtered.filter((p) => p.handle === userProfile.handle);
  }

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.content.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.handle.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    postFeed.innerHTML = `<div class="empty-state">No posts match this view right now.</div>`;
    return;
  }

  postFeed.innerHTML = filtered
    .map((post, index) => {
      const initial = escapeHTML(post.author.charAt(0).toUpperCase());
      const avatarClass = index % 2 === 1 ? "avatar avatar-alt" : "avatar";
      const verifiedBadge = post.verified
        ? `<span class="verified-badge" title="Verified">
             <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
               <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
             </svg>
           </span>`
        : "";

      if (post.isEditing) {
        return `
          <article class="post-card" data-id="${post.id}">
            <div class="${avatarClass}">${initial}</div>
            <div class="post-main">
              <textarea class="edit-textarea" rows="3" maxlength="280">${escapeHTML(post.content)}</textarea>
              <div class="edit-controls">
                <button class="btn-secondary cancel-edit-btn">Cancel</button>
                <button class="btn-primary save-edit-btn">Save</button>
              </div>
            </div>
          </article>
        `;
      }

      const imageHTML = post.imageUrl
        ? `<img src="${escapeHTML(post.imageUrl)}" alt="Post attachment" class="post-image" onerror="this.style.display='none'" />`
        : "";

      const repliesHTML = post.showReplies
        ? `<div class="replies-box">
             ${post.replies
               .map(
                 (r) => `
                 <div class="reply-item">
                   <div><span class="reply-author">${escapeHTML(r.author)}</span>${escapeHTML(r.text)}</div>
                 </div>`
               )
               .join("")}
             <form class="reply-form">
               <input type="text" class="reply-input" maxlength="160" placeholder="Write a reply..." required />
               <button type="submit" class="btn-primary reply-submit-btn">Reply</button>
             </form>
           </div>`
        : "";

      return `
        <article class="post-card" data-id="${post.id}">
          <div class="${avatarClass}">${initial}</div>
          <div class="post-main">
            <div class="post-header">
              <span class="author-name">${escapeHTML(post.author)}</span>
              ${verifiedBadge}
              <span class="author-handle">${escapeHTML(post.handle)}</span>
              <span class="post-time">· ${escapeHTML(post.timestamp)}</span>
            </div>
            <p class="post-content">${formatContentWithHashtags(post.content)}</p>
            ${imageHTML}
            <div class="post-actions">
              <button class="action-btn comment-btn" title="Replies">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
                <span>${post.replies.length}</span>
              </button>

              <button class="action-btn repost-btn ${post.reposted ? "reposted" : ""}" title="Repost">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="17 1 21 5 17 9"></polyline>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                  <polyline points="7 23 3 19 7 15"></polyline>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                </svg>
                <span>${post.reposts}</span>
              </button>

              <button class="action-btn like-btn ${post.liked ? "liked" : ""}" title="Like">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>${post.likes}</span>
              </button>

              <button class="action-btn bookmark-btn ${post.bookmarked ? "bookmarked" : ""}" title="Bookmark">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                </svg>
              </button>

              <button class="action-btn share-btn" title="Copy Post">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="18" cy="5" r="3"></circle>
                  <circle cx="6" cy="12" r="3"></circle>
                  <circle cx="18" cy="19" r="3"></circle>
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                </svg>
              </button>

              <button class="action-btn edit-btn" title="Edit">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>

              <button class="action-btn delete-btn" title="Delete">
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
            ${repliesHTML}
          </div>
        </article>
      `;
    })
    .join("");
}

// Initial Boot
syncProfileUI();
renderPosts();
