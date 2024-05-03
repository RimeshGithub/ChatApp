/* === Imports === */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js"
import { getAuth,
         createUserWithEmailAndPassword,
         signInWithEmailAndPassword,
         signOut,
         onAuthStateChanged, 
         GoogleAuthProvider,
         signInWithPopup } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-auth.js"
import { getFirestore,
         collection,
         addDoc,
         serverTimestamp,
         onSnapshot,
         query,
         where,
         orderBy,
         doc,
         updateDoc,
         deleteDoc } from "https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js"

/* === Firebase Setup === */
/* IMPORTANT: Replace this with your own firebaseConfig when doing challenges */
const firebaseConfig = {
  apiKey: "AIzaSyC3JfDWRpFegL2xV5_vUmE5p_0YRrNWoU4",
  authDomain: "fir-project-e955e.firebaseapp.com",
  databaseURL: "https://fir-project-e955e-default-rtdb.firebaseio.com",
  projectId: "fir-project-e955e",
  storageBucket: "fir-project-e955e.appspot.com",
  messagingSenderId: "67657787043",
  appId: "1:67657787043:web:ea8982f313ffd57e910116"
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const provider = new GoogleAuthProvider()
const db = getFirestore(app)

/* === UI === */

/* == UI - Elements == */

const viewLoggedOut = document.getElementById("logged-out-view")
const viewLoggedIn = document.getElementById("logged-in-view")

const signInWithGoogleButtonEl = document.getElementById("sign-in-with-google-btn")

const emailInputEl = document.getElementById("email-input")
const passwordInputEl = document.getElementById("password-input")

const signInButtonEl = document.getElementById("sign-in-btn")
const createAccountButtonEl = document.getElementById("create-account-btn")

const signOutButtonEl = document.getElementById("sign-out-btn")

const userProfilePictureEl = document.getElementById("user-profile-picture")
const userGreetingEl = document.getElementById("user-greeting")

const textareaEl = document.getElementById("post-input")
const postButtonEl = document.getElementById("post-btn")

const postsEl = document.getElementById("posts")

const scrollButton = document.getElementById("scroll-bottom-btn")

const chatterButton = document.getElementById("chatter-btn")
const chatterBox = document.getElementById("chatter-box")
const chatterListBox = document.getElementById("chatter-list")
const chatterCloseButton = document.getElementById("chatter-close-btn")

/* == UI - Event Listeners == */

signInWithGoogleButtonEl.addEventListener("click", authSignInWithGoogle)

signInButtonEl.addEventListener("click", authSignInWithEmail)

createAccountButtonEl.addEventListener("click", authCreateAccountWithEmail)

signOutButtonEl.addEventListener("click", authSignOut)

postButtonEl.addEventListener("click", postButtonPressed)

scrollButton.addEventListener("click", scrollToBottom)

chatterButton.addEventListener("click", viewChattersList)
chatterCloseButton.addEventListener("click", closeChattersList)

const collectionName = "messages"
let chatterList = []
let updatedChatterList = []

onAuthStateChanged(auth, (user) => {
    if (user) {
        showLoggedInView()
        showProfilePicture(userProfilePictureEl, user)
        showUserGreeting(userGreetingEl, user)
        fetchAllPosts(user)   
        setTimeout(() => {
            scrollToBottom()
        }, 1500)
    } else {
        showLoggedOutView()
    }
})

/* === Functions === */

/* = Functions - Firebase - Authentication = */

function authSignInWithGoogle() {
    signInWithPopup(auth, provider)
        .then((result) => {
            console.log("Signed in with Google")
        }).catch((error) => {
            console.error(error.message)
            alert(error.message)
        })
}

function authSignInWithEmail() {
    const email = emailInputEl.value
    const password = passwordInputEl.value
    let unknownUser = (email.toString()).split('@')[0]
    localStorage.setItem("unknownUser",unknownUser)
    
    signInWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            clearAuthFields()
        })
        .catch((error) => {
            console.error(error.message)
            alert(error.message)
        })
}

function authCreateAccountWithEmail() {
    const email = emailInputEl.value
    const password = passwordInputEl.value

    createUserWithEmailAndPassword(auth, email, password)
        .then((userCredential) => {
            clearAuthFields()
        })
        .catch((error) => {
            console.error(error.message) 
            alert(error.message)
        })
}

function authSignOut() {
    signOut(auth)
        .then(() => {
        }).catch((error) => {
            console.error(error.message)
            alert(error.message)
        })
}

/* = Functions - Firebase - Cloud Firestore = */

async function addPostToDB(postBody, user) {
    try {
        const docRef = await addDoc(collection(db, collectionName), {
            userName: user.displayName ? user.displayName : localStorage.getItem("unknownUser"),
            uid: user.uid,
            profilePic: user.photoURL,
            body: postBody,
            createdAt: serverTimestamp()
        })
        console.log("Document written with ID: ", docRef.id)
        scrollToBottom()
    } catch (error) {
        console.error(error.message)
        alert(error.message)
    }
}

async function updatePostInDB(docId, newBody) {
    const postRef = doc(db, collectionName, docId);

    await updateDoc(postRef, {
        body: newBody
    })
}

async function deletePostFromDB(docId) {
    await deleteDoc(doc(db, collectionName, docId))
}

function fetchInRealtimeAndRenderPostsFromDB(query, user) {
    onSnapshot(query, (querySnapshot) => {
        clearAll(postsEl)
        
        querySnapshot.forEach((doc) => {
            renderPost(postsEl, doc, user)
            updateChatterList(doc.data())
        })
    })
}

function fetchAllPosts(user) {
    const postsRef = collection(db, collectionName)
    
    const q = query(postsRef, orderBy("createdAt", "asc"))

    fetchInRealtimeAndRenderPostsFromDB(q, user)
}

/* == Functions - UI Functions == */

function createPostHeader(postData) {
    const headerDiv = document.createElement("div")
    headerDiv.className = "header"
    
        const profilePicture = document.createElement("img")
        profilePicture.className = "ppDisplay"
        if(postData.profilePic)
           profilePicture.src = postData.profilePic
        else
           profilePicture.src = "assets/images/default.jpeg"
        headerDiv.appendChild(profilePicture)
        
        const headerName = document.createElement("h3")
        headerName.textContent = postData.userName

        headerDiv.appendChild(headerName)
        
        const headerDate = document.createElement("h4")
        headerDate.textContent = displayDate(postData.createdAt)
        headerDiv.appendChild(headerDate)
        
    return headerDiv
}

function createPostBody(postData) {
    const postBody = document.createElement("p")
    postBody.innerHTML = replaceNewlinesWithBrTags(postData.body)
    
    return postBody
}

function createPostUpdateButton(wholeDoc) {
    const postId = wholeDoc.id
    const postData = wholeDoc.data()
    
    const button = document.createElement("button")
    button.textContent = "Edit"
    button.addEventListener("click", function() {
        const newBody = prompt("Edit the message:", postData.body)
        
        if (newBody) {
            updatePostInDB(postId, newBody)
        }
    })
    
    return button
}

function createPostDeleteButton(wholeDoc) {
    const postId = wholeDoc.id
    
    const button = document.createElement('button')
    button.textContent = 'Delete'
    button.addEventListener('click', function() {
        const confirmation = confirm("Do you want to delete this message?")
        
        if(confirmation)
            deletePostFromDB(postId)
    })
    return button
}

function createPostFooter(wholeDoc) {
    const footerDiv = document.createElement("div")
    footerDiv.className = "footer"
    
    footerDiv.appendChild(createPostUpdateButton(wholeDoc))
    footerDiv.appendChild(createPostDeleteButton(wholeDoc))
    
    return footerDiv
}

function renderPost(postsEl, wholeDoc, user) {
    const postData = wholeDoc.data()
    
    const postDiv = document.createElement("div")
    postData.uid == user.uid ? postDiv.className = "post" : postDiv.className = "post2"
    
    postDiv.appendChild(createPostHeader(postData))
    postDiv.appendChild(createPostBody(postData))
    
    if(postData.uid == user.uid)
       postDiv.appendChild(createPostFooter(wholeDoc))
    
    postsEl.appendChild(postDiv)
}

function replaceNewlinesWithBrTags(inputString) {
    return inputString.replace(/\n/g, "<br>")
}

function postButtonPressed() {
    const postBody = textareaEl.value
    const user = auth.currentUser
    
    if (postBody) {
        addPostToDB(postBody, user)
        clearInputField(textareaEl)
    }
}

function showProfilePicture(imgElement, user) {
    const photoURL = user.photoURL
    
    if (photoURL) {
        imgElement.src = photoURL
    } else {
        imgElement.src = "assets/images/default.jpeg"
    }
}

function showUserGreeting(element, user) {
    const displayName = user.displayName
    
    if (displayName) {  
        element.textContent = displayName
    } else {
        element.textContent = localStorage.getItem("unknownUser")
    }
}

function displayDate(firebaseDate) {
    if (!firebaseDate) {
        return "Date processing"
    }
    
    const date = firebaseDate.toDate()
    
    const day = date.getDate()
    const year = date.getFullYear()
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    const month = monthNames[date.getMonth()]

    let hours = date.getHours()
    let minutes = date.getMinutes()
    hours = hours < 10 ? "0" + hours : hours
    minutes = minutes < 10 ? "0" + minutes : minutes

    return `${day} ${month} ${year} - ${hours}:${minutes}`
}

function scrollToBottom(){
  postsEl.scrollTo({
            left: 0,
            top: postsEl.scrollHeight,
            behavior: 'smooth'
           })
}

postsEl.addEventListener("scroll", () => {
    if(isScrolledToBottom(postsEl))
      scrollButton.style.display = "none"
    else 
      scrollButton.style.display = "block"
})

function isScrolledToBottom(element) {
    // Calculate the current scroll position
    const scrollPosition = element.scrollTop + element.clientHeight

    // Check if the element is scrolled to the bottom with a small tolerance for rounding errors
    return Math.abs(scrollPosition - element.scrollHeight) < 1
}

function updateChatterList(postData){
    let profilePic = postData.profilePic ? postData.profilePic : "assets/images/default.jpeg"
    
    chatterList.push({name: postData.userName , profilePic: profilePic , uid: postData.uid})
    
    //removes duplicate objects
    const uniqueByUid = new Map(chatterList.map(item => [item.uid, item]))

    updatedChatterList = [...uniqueByUid.values()]
}

function viewChattersList(){
    showView(chatterBox)
    clearAll(chatterListBox)
    
    updatedChatterList.map((chatter) => {
        const chatterDiv = document.createElement("div")
        chatterDiv.className = "chatter-div"
        
        const chatterProfilePic = document.createElement("img")
            chatterProfilePic.src = chatter.profilePic
            
        const chatterName = document.createElement("h2")
            chatterName.textContent = chatter.name
         
        chatterDiv.appendChild(chatterProfilePic)         
        chatterDiv.appendChild(chatterName)
        chatterListBox.appendChild(chatterDiv)
    })
}

function closeChattersList(){
    hideView(chatterBox)
}

function clearAll(element) {
    element.innerHTML = ""
}

function showLoggedOutView() {
    hideView(viewLoggedIn)
    showView(viewLoggedOut)
}

function showLoggedInView() {
    hideView(viewLoggedOut)
    showView(viewLoggedIn)
}

function showView(view) {
    view.style.display = "flex" 
}

function hideView(view) {
    view.style.display = "none"
}

function clearInputField(field) {
	field.value = ""
}

function clearAuthFields() {
	clearInputField(emailInputEl)
	clearInputField(passwordInputEl)
}