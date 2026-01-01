// ==========================================
// ADMIN PANEL LOGIC (CONTROL CENTER)
// ==========================================

// Double-check Admin Permission (Security)
auth.onAuthStateChanged((user) => {
    if (user) {
        db.collection('users').doc(user.uid).get().then((doc) => {
            if (!doc.exists || doc.data().role !== 'admin') {
                window.location.href = "index.html"; // Kick out if not admin
            } else {
                console.log("👑 Admin Logged In");
                loadAllOrders('all'); // Load all orders by default
                loadServices();       // Load prices
            }
        });
    }
});

// ==========================================
// 1. ORDER MANAGEMENT
// ==========================================

function loadAllOrders(filterStatus) {
    const container = document.getElementById('admin-orders-container');
    container.innerHTML = '<p class="loading-text">Loading orders...</p>';

    let query = db.collection('orders').orderBy('timestamp', 'desc');

    // Apply Filter if not "all"
    if (filterStatus !== 'all') {
        query = db.collection('orders').where('status', '==', filterStatus);
    }

    query.onSnapshot((snapshot) => {
        container.innerHTML = ""; // Clear current list

        if (snapshot.empty) {
            container.innerHTML = "<p>No orders found.</p>";
            return;
        }

        snapshot.forEach((doc) => {
            const order = doc.data();
            const orderId = doc.id;
            
            // Format Date
            const date = order.timestamp ? new Date(order.timestamp.toDate()).toLocaleDateString() : 'Just now';

            // HTML for Admin Order Card
            const card = `
                <div class="order-card-admin glass-effect">
                    <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                        <h3 style="color:var(--primary-color);">${order.service_type}</h3>
                        <span style="color:#aaa;">${date}</span>
                    </div>
                    
                    <p><strong>Customer:</strong> ${order.customer_name} (${order.contact_phone})</p>
                    <p><strong>Software:</strong> ${order.software_pref}</p>
                    <p><strong>Description:</strong> ${order.description}</p>
                    <p><strong>Raw Files:</strong> <a href="${order.drive_link}" target="_blank" style="color:cyan; text-decoration:underline;">Open Link</a></p>
                    <p><strong>Payment:</strong> ${order.payment_status}</p>

                    <hr style="border-color:rgba(255,255,255,0.1); margin:10px 0;">

                    <div class="admin-actions">
                        <select id="status-${orderId}" class="status-select" onchange="updateStatus('${orderId}')">
                            <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Accepted" ${order.status === 'Accepted' ? 'selected' : ''}>Accept (In Progress)</option>
                            <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed (Send File)</option>
                            <option value="Rejected" ${order.status === 'Rejected' ? 'selected' : ''}>Reject</option>
                        </select>
                        
                        <div id="complete-box-${orderId}" class="${order.status === 'Completed' ? '' : 'hidden'}" style="flex:1; display:flex; gap:5px;">
                            <input type="text" id="final-link-${orderId}" placeholder="Paste Final Drive Link here..." value="${order.completed_link || ''}" style="width:100%; padding:5px; border-radius:5px; border:none;">
                            <button onclick="sendWork('${orderId}')" class="cta-btn primary" style="padding:5px 10px; font-size:0.8rem;">SEND</button>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });
    });
}

// Function to update status
window.updateStatus = function(orderId) {
    const newStatus = document.getElementById(`status-${orderId}`).value;
    const completeBox = document.getElementById(`complete-box-${orderId}`);

    // If Admin selects "Completed", show the input box to paste the link
    if (newStatus === 'Completed') {
        completeBox.classList.remove('hidden');
    } else {
        completeBox.classList.add('hidden');
        // Update status immediately for other statuses
        db.collection('orders').doc(orderId).update({
            status: newStatus
        }).then(() => alert(`Order marked as ${newStatus}`));
    }
};

// Function to Send Final Work
window.sendWork = function(orderId) {
    const finalLink = document.getElementById(`final-link-${orderId}`).value;
    
    if (!finalLink) {
        alert("Please paste the Google Drive link of the edited video first!");
        return;
    }

    db.collection('orders').doc(orderId).update({
        status: 'Completed',
        completed_link: finalLink
    }).then(() => {
        alert("✅ Work Sent to Customer! They can now download it.");
    });
};


// ==========================================
// 2. SERVICE & PRICE MANAGEMENT
// ==========================================

// Load Prices
function loadServices() {
    const list = document.getElementById('services-list-admin');
    
    db.collection('services').onSnapshot(snapshot => {
        list.innerHTML = "";
        snapshot.forEach(doc => {
            const s = doc.data();
            const item = `
                <div class="price-row">
                    <span>${s.name}</span>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <input type="number" value="${s.price}" id="price-${doc.id}" class="price-input">
                        <button onclick="updatePrice('${doc.id}')" style="background:none; border:none; color:cyan; cursor:pointer;"><i class="fas fa-save"></i></button>
                        <button onclick="deleteService('${doc.id}')" style="background:none; border:none; color:red; cursor:pointer;"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
            list.innerHTML += item;
        });
    });
}

// Add New Service
const addServiceForm = document.getElementById('add-service-form');
if (addServiceForm) {
    addServiceForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('new-service-name').value;
        const price = document.getElementById('new-service-price').value;

        db.collection('services').add({
            name: name,
            price: Number(price)
        }).then(() => {
            addServiceForm.reset();
            alert("Service Added!");
        });
    });
}

// Update Price
window.updatePrice = function(docId) {
    const newPrice = document.getElementById(`price-${docId}`).value;
    db.collection('services').doc(docId).update({
        price: Number(newPrice)
    }).then(() => alert("Price Updated!"));
};

// Delete Service
window.deleteService = function(docId) {
    if(confirm("Are you sure you want to delete this service?")) {
        db.collection('services').doc(docId).delete();
    }
};
