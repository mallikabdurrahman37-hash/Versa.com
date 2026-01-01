// ==========================================
// AUTHENTICATION LOGIC
// ==========================================

// 1. REGISTER NEW USER
const registerForm = document.getElementById('register-form-submit');
if (registerForm) {
    registerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const name = document.getElementById('reg-name').value;
        const phone = document.getElementById('reg-phone').value;
        const email = document.getElementById('reg-email').value;
        const password = document.getElementById('reg-password').value;

        // Create User in Firebase Auth
        auth.createUserWithEmailAndPassword(email, password)
            .then((cred) => {
                // If success, create the User Profile in Database
                return db.collection('users').doc(cred.user.uid).set({
                    name: name,
                    phone: phone,
                    email: email,
                    role: 'user', // Default role
                    trials_used: 0, // Start with 0 used
                    joined_at: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                alert("✅ Account Created! Welcome to Versa.");
                window.location.href = "dashboard.html";
            })
            .catch((error) => {
                console.error("Error:", error);
                alert("❌ Error: " + error.message);
            });
    });
}

// 2. LOGIN USER
const loginForm = document.getElementById('login-form-submit');
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        auth.signInWithEmailAndPassword(email, password)
            .then((cred) => {
                console.log("Login Successful, checking role...");
                checkUserRole(cred.user.uid);
            })
            .catch((error) => {
                console.error("Login Error:", error);
                alert("❌ Login Failed: " + error.message);
            });
    });
}

// 3. CHECK ROLE & REDIRECT (The "Traffic Cop")
function checkUserRole(uid) {
    db.collection('users').doc(uid).get().then((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            
            if (userData.role === 'admin') {
                // If it's YOU, go to Admin Panel
                window.location.href = "admin.html";
            } else {
                // If it's a Customer, go to Dashboard
                window.location.href = "dashboard.html";
            }
        } else {
            // Fallback if document missing
            window.location.href = "dashboard.html";
        }
    }).catch((error) => {
        console.log("Error checking role:", error);
        // Default to dashboard if error
        window.location.href = "dashboard.html";
    });
}

// 4. LOGOUT FUNCTION (Used in Navbar)
function logoutUser() {
    auth.signOut().then(() => {
        alert("Logged out successfully.");
        window.location.href = "index.html";
    });
}

// 5. AUTH STATE LISTENER (For Dashboard Pages)
// If a user is NOT logged in but tries to open dashboard.html, kick them out.
const currentPage = window.location.pathname;
if (currentPage.includes('dashboard.html') || currentPage.includes('admin.html')) {
    auth.onAuthStateChanged((user) => {
        if (!user) {
            window.location.href = "index.html";
        } else {
            // Load User Name in Navbar
            const navUser = document.getElementById('nav-username');
            if (navUser) navUser.innerText = user.email.split('@')[0];
        }
    });
}
