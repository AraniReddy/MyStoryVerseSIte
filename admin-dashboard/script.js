// Supabase configuration
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tab switching
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabName).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'transactions') {
        loadPendingTransactions();
    }
}

// Load pending transactions
async function loadPendingTransactions() {
    try {
        const { data: transactions, error } = await supabaseClient
            .from('task_responses')
            .select(`
                id,
                user_id,
                task_id,
                created_at,
                user_profiles!inner(name),
                brand_tasks!inner(brand_name, reward_amount)
            `)
            .eq('reward_status', 'pending');

        if (error) throw error;

        const tbody = document.querySelector('#transactionsTable tbody');
        tbody.innerHTML = '';

        transactions.forEach(transaction => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transaction.user_profiles.name}</td>
                <td>${transaction.brand_tasks.brand_name}</td>
                <td>₹${transaction.brand_tasks.reward_amount}</td>
                <td>${new Date(transaction.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="approve-btn" onclick="approveTransaction('${transaction.id}')">Approve</button>
                    <button class="reject-btn" onclick="rejectTransaction('${transaction.id}')">Reject</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading transactions:', error);
        alert('Error loading transactions');
    }
}

// Approve transaction
async function approveTransaction(responseId) {
    try {
        const { error } = await supabaseClient
            .from('task_responses')
            .update({ reward_status: 'paid' })
            .eq('id', responseId);

        if (error) throw error;
        
        alert('Transaction approved successfully!');
        loadPendingTransactions();
    } catch (error) {
        console.error('Error approving transaction:', error);
        alert('Error approving transaction');
    }
}

// Reject transaction
async function rejectTransaction(responseId) {
    try {
        const { error } = await supabaseClient
            .from('task_responses')
            .delete()
            .eq('id', responseId);

        if (error) throw error;
        
        alert('Transaction rejected successfully!');
        loadPendingTransactions();
    } catch (error) {
        console.error('Error rejecting transaction:', error);
        alert('Error rejecting transaction');
    }
}

// Add new task
document.getElementById('taskForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        brand_name: document.getElementById('brandName').value,
        question: document.getElementById('question').value,
        reward_amount: parseInt(document.getElementById('rewardAmount').value),
        user_target: parseInt(document.getElementById('userTarget').value),
        image_urls: [document.getElementById('imageUrl').value],
        secure_mode: document.getElementById('secureMode').checked,
        active_to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    try {
        const { error } = await supabaseClient
            .from('brand_tasks')
            .insert(formData);

        if (error) throw error;
        
        alert('Task added successfully!');
        document.getElementById('taskForm').reset();
    } catch (error) {
        console.error('Error adding task:', error);
        alert('Error adding task');
    }
});

// Add new promotion
document.getElementById('promotionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('promoTitle').value,
        description: document.getElementById('promoDescription').value,
        video_url: document.getElementById('videoUrl').value,
        reward_amount: parseInt(document.getElementById('promoReward').value),
        active: true
    };

    try {
        const { error } = await supabaseClient
            .from('promotions')
            .insert(formData);

        if (error) throw error;
        
        alert('Promotion added successfully!');
        document.getElementById('promotionForm').reset();
    } catch (error) {
        console.error('Error adding promotion:', error);
        alert('Error adding promotion');
    }
});

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        window.location.reload();
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPendingTransactions();
});