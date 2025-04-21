// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc, updateDoc, deleteDoc, query, where } from "https://www.gstatic.com/firebasejs/11.6.0/firebase-firestore.js";
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
const profilePage = document.getElementById("profile-page");
const userEmailText = document.getElementById("user-email");
const userPostsContainer = document.getElementById("user-posts-container");
const viewProfileBtn = document.getElementById("view-profile");
const backToFeedBtn = document.getElementById("back-to-feed");

function showHomeFeed() {
  authForm.style.display = 'none';
  homeFeed.style.display = 'block';
  loadPosts();
}

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

postSubmit.addEventListener('click', async () => {
  const text = postText.value;
  const file = postImage.files[0];
  const user = auth.currentUser;

  if (!text.trim() && !file) {
    alert("Please write something or upload an image.");
    return;
  }

  let imageURL = '';

  if (file) {
    const storageRef = ref(storage, `posts/${file.name}`);
    await uploadBytes(storageRef, file);
    imageURL = await getDownloadURL(storageRef);
  }

  await addDoc(collection(db, 'posts'), {
    text,
    imageURL,
    timestamp: new Date(),
    userId: user.uid
  });

  postText.value = '';
  postImage.value = '';
});

function loadPosts() {
  onSnapshot(collection(db, 'posts'), (snapshot) => {
    postsContainer.innerHTML = '';

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
        <div class="comments" id="comments-${postId}"></div>
        <input type="text" placeholder="Write a comment..." id="comment-input-${postId}" />
        <button data-id="${postId}" class="comment-btn">Comment</button>
      `;

      if (currentUser?.uid === post.userId) {
        postElement.innerHTML += `
          <button data-id="${postId}" class="edit-post-btn">✏️ Edit</button>
          <button data-id="${postId}" class="delete-post-btn">🗑️ Delete</button>
        `;
      }

      postsContainer.appendChild(postElement);

      const commentsContainer = document.getElementById(`comments-${postId}`);
      const commentsRef = collection(db, "posts", postId, "comments");

      onSnapshot(commentsRef, (commentSnap) => {
        commentsContainer.innerHTML = '';
        commentSnap.forEach(commentDoc => {
          const comment = commentDoc.data();
          const time = comment.timestamp?.toDate?.().toLocaleString() || '';

          const p = document.createElement('p');
          p.textContent = `👤 ${comment.userName || 'User'} 🕒 ${time} 💬 ${comment.text}`;
          commentsContainer.appendChild(p);
        });
      });
    });

    document.querySelectorAll('.like-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const postId = button.getAttribute('data-id');
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        const postData = postSnap.data();
        const userId = auth.currentUser.uid;
        let updatedLikes = postData.likes || [];

        if (updatedLikes.includes(userId)) {
          updatedLikes = updatedLikes.filter(id => id !== userId);
        } else {
          updatedLikes.push(userId);
        }

        await updateDoc(postRef, {
          likes: updatedLikes
        });
      });
    });

    document.querySelectorAll('.comment-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const postId = button.getAttribute('data-id');
        const input = document.getElementById(`comment-input-${postId}`);
        const commentText = input.value;

        if (commentText.trim() !== '') {
          const commentsRef = collection(db, "posts", postId, "comments");
          await addDoc(commentsRef, {
            text: commentText,
            timestamp: new Date(),
            userName: auth.currentUser.displayName || "Anonymous"
          });
          input.value = '';
        }
      });
    });

    document.querySelectorAll('.edit-post-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const postId = button.getAttribute('data-id');
        const newText = prompt("Edit your post:");
        if (newText !== null && newText.trim() !== '') {
          const postRef = doc(db, 'posts', postId);
          await updateDoc(postRef, {
            text: newText
          });
        }
      });
    });

    document.querySelectorAll('.delete-post-btn').forEach(button => {
      button.addEventListener('click', async () => {
        const postId = button.getAttribute('data-id');
        const confirmDelete = confirm("Are you sure you want to delete this post?");
        if (confirmDelete) {
          const postRef = doc(db, 'posts', postId);
          await deleteDoc(postRef);
        }
      });
    });
  });
}

viewProfileBtn.addEventListener("click", () => {
  const user = auth.currentUser;
  if (user) {
    homeFeed.style.display = "none";
    profilePage.style.display = "block";
    userEmailText.textContent = `Email: ${user.email}`;
    loadUserPosts(user.uid);
  }
});

backToFeedBtn.addEventListener("click", () => {
  profilePage.style.display = "none";
  homeFeed.style.display = "block";
});

// Function to load user posts
function loadUserPosts(uid) {
  const q = query(collection(db, "posts"), where("userId", "==", uid));
  onSnapshot(q, (snapshot) => {
    userPostsContainer.innerHTML = "";
    snapshot.forEach((docSnap) => {
      const post = docSnap.data();
      const div = document.createElement("div");
      div.innerHTML = `
        <p>${post.text}</p>
        ${post.imageURL ? `<img src="${post.imageURL}" width="300" />` : ""}
        <button data-id="${docSnap.id}" class="edit-post-btn">✏️ Edit</button>
        <button data-id="${docSnap.id}" class="delete-post-btn">🗑️ Delete</button>
        <hr/>
      `;
      userPostsContainer.appendChild(div);
    });
  });
}

// Load Friend Requests for the current user
function loadFriendRequests() {
  const currentUserUid = auth.currentUser.uid;
  const requestsRef = collection(db, "friend-requests");
  const q = query(requestsRef, where("receiver", "==", currentUserUid), where("status", "==", "pending"));
  
  onSnapshot(q, (snapshot) => {
    const requestsContainer = document.getElementById("requests-container");
    requestsContainer.innerHTML = '';
    snapshot.forEach(docSnap => {
      const request = docSnap.data();
      const requestId = docSnap.id;
      const senderUid = request.sender;

      const userRef = doc(db, "users", senderUid);
      getDoc(userRef).then(userSnap => {
        const userData = userSnap.data();
        const userName = userData.name || "Unknown User";

        const requestDiv = document.createElement("div");
        requestDiv.innerHTML = `
          <p>${userName} wants to be your friend.</p>
          <button onclick="handleFriendRequest('${requestId}', 'accept')">Accept</button>
          <button onclick="handleFriendRequest('${requestId}', 'reject')">Reject</button>
        `;
        requestsContainer.appendChild(requestDiv);
      });
    });
  });
}

// Handle Friend Request (Accept / Reject)
async function handleFriendRequest(requestId, action) {
  const requestRef = doc(db, "friend-requests", requestId);
  const requestSnap = await getDoc(requestRef);
  const request = requestSnap.data();

  if (action === "accept") {
    await updateDoc(requestRef, {
      status: "accepted",
    });

    const friendsRef = collection(db, "friends");
    await addDoc(friendsRef, {
      user1: request.sender,
      user2: request.receiver,
    });
  } else if (action === "reject") {
    await updateDoc(requestRef, {
      status: "rejected",
    });
  }
}



// DOM Elements
const sendFriendRequestBtn = document.getElementById('send-friend-request-btn');

// Send Friend Request (তুমি যেখানে ফ্রেন্ড রিকোয়েস্ট পাঠাতে চাও, সেখানেই এই কোডটি যুক্ত করো)
sendFriendRequestBtn.addEventListener('click', async () => {
  const currentUser = auth.currentUser;
  const receiverUid = "RECEIVER_USER_ID"; // এই জায়গায় রিসিভারের UID বসাবে

  if (!currentUser) {
    alert("You need to be logged in to send a friend request.");
    return;
  }

  try {
    // Firestore friend requests collection এ রিকোয়েস্ট পাঠানো
    const friendRequestRef = collection(db, "friend-requests");
    await addDoc(friendRequestRef, {
      sender: currentUser.uid,
      receiver: receiverUid,
      status: "pending", // রিকোয়েস্ট এখনও একসেপ্ট হয়নি
      timestamp: new Date()
    });

    alert("Friend request sent!");
  } catch (error) {
    alert("Error sending friend request: " + error.message);
  }
});
