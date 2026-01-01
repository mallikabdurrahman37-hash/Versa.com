// ==========================================
// BOOKING & DASHBOARD LOGIC
// ==========================================

let currentUser = null;
let trialsUsed = 0;
const MAX_FREE_TRIALS = 5;

// 1. LISTEN FOR LOGIN STATE
auth.onAuthStateChanged((user) => {
    if (user) {
        currentUser = user;
        console.log("User Loaded:", user.email);
        loadUserProfile(user.uid);
        loadUserOrders(user.uid);
    } else {
        // If not logged in, wait or redirect (handled in auth.js)
    }
});

// 2. LOAD USER PROFILE (Trials Count)
function loadUserProfile(uid) {
    db.collection('users').doc(uid).onSnapshot((doc) => {
        if (doc.exists) {
            const data = doc.data();
            trialsUsed = data.trials_used || 0;
            const remaining = MAX_FREE_TRIALS - trialsUsed;

            // Update UI
            document.getElementById('user-name-display').innerText = data.name;
            document.getElementById('trials-count').innerText = remaining > 0 ? remaining : 0;
            
            // Auto-fill Name & Phone in Booking Form
            if(document.getElementById('order-name')) document.getElementById('order-name').value = data.name;
            if(document.getElementById('order-phone')) document.getElementById('order-phone').value = data.phone;

            // Show Admin Button if this is YOU
            if (data.role === 'admin') {
                const adminBtn = document.getElementById('admin-panel-btn');
                if(adminBtn) adminBtn.classList.remove('hidden');
            }
        }
    });
}

// 3. HANDLE NEW BOOKING
const bookingForm = document.getElementById('booking-form');

if (bookingForm) {
    bookingForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Get Form Data
        const service = document.getElementById('service-type').value;
        const software = document.getElementById('software-pref').value;
        const link = document.getElementById('drive-link').value;
        const desc = document.getElementById('project-desc').value;
        const name = document.getElementById('order-name').value;
        const phone = document.getElementById('order-phone').value;

        // LOGIC: Check Free Trials
        if (trialsUsed >= MAX_FREE_TRIALS) {
            // === PAID MODE ===
            alert("⚠️ Free Trials Limit Reached!\n\nYou must pay to place this order. Redirecting to Payment...");
            
            // Redirect to UPI App
            // This format works on mobile to open PhonePe/GPay/Paytm
            const upiLink = "upi://pay?pa=9239529167@fam&pn=VersaServices&tn=OrderPayment";
            window.location.href = upiLink;
            
            // Note: In a real app, you would wait for payment confirmation here.
            // For now, we stop the auto-booking.
            return; 
        }

        // === FREE TRIAL MODE ===
        // Prepare Order Data
        const orderData = {
            userID: currentUser.uid,
            customer_name: name,
            contact_phone: phone,
            service_type: service,
            software_pref: software,
            drive_link: link,
            description: desc,
            status: "Pending", // Default status
            payment_status: "Free Trial",
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Use a "Batch" to do two things at once:
        // 1. Save the Order
        // 2. Decrease Free Trials (Increment trials_used)
        const batch = db.batch();
        const newOrderRef = db.collection('orders').doc(); // Auto ID
        const userRef = db.collection('users').doc(currentUser.uid);

        batch.set(newOrderRef, orderData);
        batch.update(userRef, { 
            trials_used: firebase.firestore.FieldValue.increment(1) 
        });

        // Send to Firebase
        batch.commit()
            .then(() => {
                alert(`✅ Order Placed! You used a Free Trial.\n(${MAX_FREE_TRIALS - (trialsUsed + 1)} remaining)`);
                bookingForm.reset();
                // Refresh profile to update numbers
            })
            .catch((error) => {
                console.error("Booking Error:", error);
                alert("❌ Failed to book: " + error.message);
            });
    });
}

// 4. LOAD MY ORDERS (Real-time)
function loadUserOrders(uid) {
    const ordersList = document.getElementById('orders-list');
    
    // Listen to 'orders' collection where userID matches the current user
    db.collection('orders')
        .where('userID', '==', uid)
        .orderBy('timestamp', 'desc') // Newest first
        .onSnapshot((snapshot) => {
            ordersList.innerHTML = ""; // Clear list

            if (snapshot.empty) {
                ordersList.innerHTML = "<p style='color:#aaa; text-align:center;'>No orders yet. Start a project above!</p>";
                return;
            }

            snapshot.forEach((doc) => {
                const order = doc.data();
                
                // Color Code the Status
                let statusClass = 'status-pending';
                let icon = '<i class="fas fa-clock"></i>';
                
                if (order.status === 'Accepted') { 
                    statusClass = 'status-accepted'; 
                    icon = '<i class="fas fa-check-circle"></i>';
                }
                if (order.status === 'Completed') { 
                    statusClass = 'status-completed'; 
                    icon = '<i class="fas fa-check-double"></i>';
                }
                if (order.status === 'Rejected') { 
                    statusClass = 'status-rejected'; 
                    icon = '<i class="fas fa-times-circle"></i>';
                }

                // If Completed, show the Download Link
                let downloadBtn = '';
                if (order.status === 'Completed' && order.completed_link) {
                    downloadBtn = `<br><a href="${order.completed_link}" target="_blank" style="color:cyan; text-decoration:underline; font-size:0.9rem;">Download File <i class="fas fa-download"></i></a>`;
                }

                // Create HTML Card
                const card = `
                    <div class="order-card glass-effect">
                        <div style="flex: 1;">
                            <h4 style="color:white;">${order.service_type} <span style="font-size:0.8rem; color:#aaa;">(${order.software_pref})</span></h4>
                            <p style="font-size: 0.8rem; color: #aaa;">${order.description.substring(0, 30)}...</p>
                            ${downloadBtn}
                        </div>
                        <div style="text-align:right;">
                            <div class="order-status ${statusClass}">
                                ${icon} ${order.status}
                            </div>
                            <small style="display:block; margin-top:5px; color:#666;">
                                ${order.payment_status}
                            </small>
                        </div>
                    </div>
                `;
                ordersList.innerHTML += card;
            });
        });
}
