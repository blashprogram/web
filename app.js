import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-storage.js";

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCFMv7ak5kXSdALMyaMYKgUNPxPPIoTaFw",
  authDomain: "clone-d69ae.firebaseapp.com",
  projectId: "clone-d69ae",
  storageBucket: "clone-d69ae.firebasestorage.app",
  messagingSenderId: "1082476281362",
  appId: "1:1082476281362:web:60033cfac864674faea2cb"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();

// Elements
const authForm = document.getElementById('auth-form');
const authButton = document.getElementById('auth-button');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authSwitch = document.getElementById('auth-switch');
const switchToSignup = document.getElementById('switch-to-signup');
const homeFeed = document.getElementById('home-feed');
const logoutBtn = document.getElementById('logout-btn');
const postText = document.getElementById('post-text');
const postImage = document.getElementById('post-image');
const postSubmit = document.getElementById('post-submit');
const postsContainer = document.getElementById('posts-container');

// Authentication Functions
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
    .then(() => {
      alert('Account created!');
    })
    .catch((error) => {
      alert(error.message);
    });
});

logoutBtn.addEventListener('click', () => {
  signOut(auth).then(() => {
    alert("Logged out");
    window.location.reload();
  });
});

// Show Home Feed
function showHomeFeed() {
  authForm.style.display = 'none';
  homeFeed.style.display = 'block';
  loadPosts();
}

// Post Creation
postSubmit.addEventListener('click', async () => {
  const text = postText.value;
  const file = postImage.files[0];

  if (file) {
    const storageRef = ref(storage, `posts/${file.name}`);
    await uploadBytes(storageRef, file);
    const fileURL = await getDownloadURL(storageRef);

    await addDoc(collection(db, 'posts'), {
      text,
      imageURL: fileURL,
      timestamp: new Date()
    });
  } else {
    await addDoc(collection(db, 'posts'), {
      text,
      timestamp: new Date()
    });
  }
  postText.value = '';
  postImage.value = '';
});

// Load Posts
import {
    getDoc,
    updateDoc,
    doc
  } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
  
  function loadPosts() {
    onSnapshot(collection(db, 'posts'), (snapshot) => {
      postsContainer.innerHTML = ''; // Clear previous posts
  
      snapshot.forEach(docSnap => {
        const post = docSnap.data();
        const postId = docSnap.id;
  
        const postElement = document.createElement('div');
        postElement.classList.add('post');
  
        const currentUser = auth.currentUser;
  
        const isLiked = post.likes && post.likes.includes(currentUser?.uid);
  
        postElement.innerHTML = `
          <p>${post.text}</p>
          ${post.imageURL ? `<img src="${post.imageURL}" width="300px" />` : ''}
          <button data-id="${postId}" class="like-btn">
            ❤️ ${post.likes ? post.likes.length : 0}
          </button>
        `;
  
        postsContainer.appendChild(postElement);
      });
  
      // Like button functionality
      const likeButtons = document.querySelectorAll('.like-btn');
      likeButtons.forEach(button => {
        button.addEventListener('click', async () => {
          const postId = button.getAttribute('data-id');
          const postRef = doc(db, 'posts', postId);
  
          const postSnap = await getDoc(postRef);
          const postData = postSnap.data();
  
          const userId = auth.currentUser.uid;
  
          let updatedLikes = postData.likes || [];
  
          if (!updatedLikes.includes(userId)) {
            updatedLikes.push(userId);
          }
  
          await updateDoc(postRef, {
            likes: updatedLikes
          });
        });
      });
    });
  }
  
