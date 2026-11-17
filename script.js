const MAX_CHARS = 280;
const RING_CIRCUMFERENCE = 69.12;
const STORAGE_KEY = "mini_twitter_posts_v2";
const THEME_KEY = "mini_twitter_theme";

const postInput = document.getElementById("postInput");
const charCount = document.getElementById("charCount");
const ringProgress = document.getElementById("ringProgress");
const postBtn = document.getElementById("postBtn");
const postFeed = document.getElementById("postFeed");
const themeToggle = document.getElementById("themeToggle");
const sunIcon = document.getElementById("sunIcon");
const moonIcon = document.getElementById("moonIcon");
const tabBtns = document.querySelectorAll(".tab-btn");

let currentFilter = "all";

// Theme Initialization
function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  if (theme === "dark") {
    sunIcon.classList.remove("hidden");
    moonIcon.classList.add("hidden");
  } else {
    sunIcon.classList.add("hidden");
    moonIcon.classList.remove("hidden");
  }
}

const savedTheme = localStorage.getItem(THEME_KEY) || "dark";
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  applyTheme(current === "dark" ? "light" : "dark");
});

// Initial Posts State
let posts = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [
  {
    id: 1,
    author: "Sri",
    handle: "@invinsiblesri",
    verified: true,
    content: "Just upgraded Mini Twitter with a dark/light theme switcher, circular character counter, and smooth animations!",
    timestamp: "Just now",
    likes: 12,
    liked: false,
    reposts: 3,
    reposted: false,
    isEditing: false,
  },
  {
    id: 2,
    author: "Alex Rivera",
    handle: "@alexcodes",
    verified: false,
    content: "Clean UI + vanilla JavaScript localStorage persistence makes this super fast and responsive.",
    timestamp: "2h ago",
    likes: 5,
    liked: true,
    reposts: 1,
    reposted: false,
    isEditing: false,
  },
];

function savePosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function escapeHTML(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// Update Circular Progress & Character Count
function updateComposerUI() {
  const length = postInput.value.length;
  const remaining = MAX_CHARS - length;
  const progress = Math.min(length / MAX_CHARS, 1);

  charCount.textContent = remaining;
  ringProgress.style.strokeDashoffset = RING_CIRCUMFERENCE - progress * RING_CIRCUMFERENCE;

  ringProgress.classList.remove("warning", "danger");
  if (remaining <= 20) {
    ringProgress.classList.add("danger");
  } else if (remaining <= 60) {
    ringProgress.classList.add("warning");
  }

  postBtn.disabled = postInput.value.trim().length === 0 || remaining < 0;
}

postInput.addEventListener("input", updateComposerUI);

// Create Post
function createPost() {
  const content = postInput.value.trim();
  if (!content || content.length > MAX_CHARS) return;

  const newPost = {
    id: Date.now(),
    author: "User",
    handle: "@user_dev",
    verified: true,
    content,
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    likes: 0,
    liked: false,
    reposts: 0,
    reposted: false,
    isEditing: false,
  };

  posts.unshift(newPost);
  savePosts();

  postInput.value = "";
  updateComposerUI();
  renderPosts();
}

postBtn.addEventListener("click", createPost);

postInput.addEventListener("keydown", (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !postBtn.disabled) {
    createPost();
  }
});

// Filter Tabs
tabBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderPosts();
  });
});

// Event Delegation for Post Actions
postFeed.addEventListener("click", (e) => {
  const card = e.target.closest(".post-card");
  if (!card) return;

  const postId = Number(card.dataset.id);
  const post = posts.find((p) => p.id === postId);
  if (!post) return;

  if (e.target.closest(".like-btn")) {
    post.liked = !post.liked;
    post.likes += post.liked ? 1 : -1;
    savePosts();
    renderPosts();
  } else if (e.target.closest(".repost-btn")) {
    post.reposted = !post.reposted;
    post.reposts += post.reposted ? 1 : -1;
    savePosts();
    renderPosts();
  } else if (e.target.closest(".edit-btn")) {
    post.isEditing = true;
    renderPosts();
  } else if (e.target.closest(".cancel-edit-btn")) {
    post.isEditing = false;
    renderPosts();
  } else if (e.target.closest(".save-edit-btn")) {
    const editBox = card.querySelector(".edit-textarea");
    const updatedText = editBox.value.trim();
    if (updatedText && updatedText.length <= MAX_CHARS) {
      post.content = updatedText;
      post.isEditing = false;
      savePosts();
      renderPosts();
    }
  } else if (e.target.closest(".delete-btn")) {
    posts = posts.filter((p) => p.id !== postId);
    savePosts();
    renderPosts();
  }
});

// Render Posts
function renderPosts() {
  const visiblePosts =
    currentFilter === "liked" ? posts.filter((p) => p.liked) : posts;

  if (visiblePosts.length === 0) {
    postFeed.innerHTML = `<div class="empty-state">${
      currentFilter === "liked"
        ? "No liked posts yet. Tap the heart on a post to save it here!"
        : "No posts yet. Share what's on your mind above!"
    }</div>`;
    return;
  }

  postFeed.innerHTML = visiblePosts
    .map((post, index) => {
      const initial = escapeHTML(post.author.charAt(0).toUpperCase());
      const avatarClass = index % 2 === 1 ? "avatar avatar-alt" : "avatar";
      const verifiedSVG = post.verified
        ? `<span class="verified-badge" title="Verified">
             <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
               <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"/>
             </svg>
           </span>`
        : "";

      if (post.isEditing) {
        return `
          <article class="post-card" data-id="${post.id}">
            <div class="${avatarClass}">${initial}</div>
            <div class="post-main">
              <div class="post-header">
                <span class="author-name">${escapeHTML(post.author)}</span>
                ${verifiedSVG}
                <span class="author-handle">${escapeHTML(post.handle)}</span>
              </div>
              <textarea class="edit-textarea" rows="3" maxlength="280">${escapeHTML(post.content)}</textarea>
              <div class="edit-controls">
                <button class="btn-secondary cancel-edit-btn">Cancel</button>
                <button class="btn-primary save-edit-btn">Save</button>
              </div>
            </div>
          </article>
        `;
      }

      return `
        <article class="post-card" data-id="${post.id}">
          <div class="${avatarClass}">${initial}</div>
          <div class="post-main">
            <div class="post-header">
              <span class="author-name">${escapeHTML(post.author)}</span>
              ${verifiedSVG}
              <span class="author-handle">${escapeHTML(post.handle)}</span>
              <span class="post-time">· ${escapeHTML(post.timestamp)}</span>
            </div>
            <p class="post-content">${escapeHTML(post.content)}</p>
            <div class="post-actions">
              <button class="action-btn like-btn ${post.liked ? "liked" : ""}" title="Like">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                <span>${post.likes}</span>
              </button>

              <button class="action-btn repost-btn ${post.reposted ? "reposted" : ""}" title="Repost">
                <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="17 1 21 5 17 9"></polyline>
                  <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                  <polyline points="7 23 3 19 7 15"></polyline>
                  <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                </svg>
                <span>${post.reposts}</span>
              </button>

              <button class="action-btn edit-btn" title="Edit">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span>Edit</span>
              </button>

              <button class="action-btn delete-btn" title="Delete">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span>Delete</span>
              </button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");
}

renderPosts();
