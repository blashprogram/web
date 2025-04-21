// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCFMv7ak5kXSdALMyaMYKgUNPxPPIoTaFw",
  authDomain: "clone-d69ae.firebaseapp.com",
  projectId: "clone-d69ae",
  storageBucket: "clone-d69ae.appspot.com",
  messagingSenderId: "1082476281362",
  appId: "1:1082476281362:web:60033cfac864674faea2cb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// DOM Elements
const authForm = document.getElementById('auth-form');
const authButton = document.getElementById('auth-button');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const switchToSignup = document.getElementById('switch-to-signup');
const homeFeed = document.getElementById('home-feed');
const logoutBtn = document.getElementById('logout-btn');
const postText = document.getElementById('post-text');
const postImage = document.getElementById('post-image');
const postSubmit = document.getElementById('post-submit');
const postsContainer = document.getElementById('posts-container');

// Show Home Feed
function showHomeFeed() {
  authForm.style.display = 'none';
  homeFeed.style.display = 'block';
  loadPosts();
}

// Signup/Login
authButton.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    showHomeFeed();
  } catch (error) {
    alert(error.message);
  }
});

switchToSignup.addEventListener('click', (e) => {
  e.preventDefault();
  const email = emailInput.value;
  const password = passwordInput.value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(() => alert('Account created! Now login.'))
    .catch((error) => alert(error.message));
});

logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    alert("Logged out");
    window.location.reload();
  });
});

// Post Creation
postSubmit.addEventListener('click', async () => {
  const text = postText.value;
  const file = postImage.files[0];

  let imageURL = "";
  if (file) {
    const storageRef = ref(storage, `posts/${file.name}`);
    await uploadBytes(storageRef, file);
    imageURL = await getDownloadURL(storageRef);
  }

  await addDoc(collection(db, 'posts'), {
    text,
    imageURL,
    likes: [],
    timestamp: new Date()
  });

  postText.value = '';
  postImage.value = '';
});

// Load Posts with Like and Comment
function loadPosts() {
  onSnapshot(collection(db, 'posts'), (snapshot) => {
    postsContainer.innerHTML = '';

    snapshot.forEach(async (docSnap) => {
      const post = docSnap.data();
      const postId = docSnap.id;
      const postDiv = document.createElement('div');
      postDiv.className = "post";

      const userId = auth.currentUser.uid;
      const isLiked = post.likes.includes(userId);

      postDiv.innerHTML = `
        <p>${post.text}</p>
        ${post.imageURL ? `<img src="${post.imageURL}" width="300">` : ""}
        <button class="like-btn" data-id="${postId}">
          ❤️ ${post.likes.length} ${isLiked ? '(You liked this)' : ''}
        </button>
        <div class="comments" id="comments-${postId}"></div>
        <input type="text" placeholder="Write a comment" id="comment-input-${postId}" />
        <button class="comment-btn" data-id="${postId}">Comment</button>
      `;

      postsContainer.appendChild(postDiv);

      // Like Button
// ❤️ Like buttons
const likeButtons = document.querySelectorAll('.like-btn');
likeButtons.forEach(button => {
  button.addEventListener('click', async () => {
    const postId = button.getAttribute('data-id');
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    const postData = postSnap.data();
    const userId = auth.currentUser.uid;
    let updatedLikes = postData.likes || [];

    if (updatedLikes.includes(userId)) {
      // Already liked, so unlike it
      updatedLikes = updatedLikes.filter(id => id !== userId);
    } else {
      // Not liked yet, so like it
      updatedLikes.push(userId);
    }

    await updateDoc(postRef, {
      likes: updatedLikes
    });
  });
});

      // Comment Button
      postDiv.querySelector('.comment-btn').addEventListener('click', async () => {
        const input = document.getElementById(`comment-input-${postId}`);
        const commentText = input.value.trim();
        if (commentText === '') return;

        const commentsRef = collection(db, 'posts', postId, 'comments');
        await addDoc(commentsRef, {
          text: commentText,
          userName: auth.currentUser.email,
          timestamp: new Date()
        });

        input.value = '';
      });

      // Load Comments
      const commentsRef = collection(db, 'posts', postId, 'comments');
      const commentsContainer = document.getElementById(`comments-${postId}`);
      onSnapshot(commentsRef, (snap) => {
        commentsContainer.innerHTML = '';
        snap.forEach(commentDoc => {
          const comment = commentDoc.data();
          const p = document.createElement('p');
          p.textContent = `💬 ${comment.userName}: ${comment.text}`;
          commentsContainer.appendChild(p);
        });
      });
    });
  });
  }
