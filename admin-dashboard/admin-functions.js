// Minimal admin functions for website integration
const supabaseClient = createClient('YOUR_SUPABASE_URL', 'YOUR_SUPABASE_ANON_KEY');

function showAdminTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(t => t.style.display = 'none');
    document.getElementById(`admin-${tab}`).style.display = 'block';
    
    if (tab === 'transactions') loadAdminTransactions();
}

async function loadAdminTransactions() {
    const { data } = await supabaseClient
        .from('task_responses')
        .select('*, user_profiles(name), brand_tasks(brand_name, reward_amount)')
        .eq('reward_status', 'pending');
    
    const tbody = document.querySelector('#adminTransactionsTable tbody');
    tbody.innerHTML = data.map(t => `
        <tr>
            <td>${t.user_profiles.name}</td>
            <td>${t.brand_tasks.brand_name}</td>
            <td>₹${t.brand_tasks.reward_amount}</td>
            <td><button onclick="approveAdminTransaction('${t.id}')">Approve</button></td>
        </tr>
    `).join('');
}

async function approveAdminTransaction(id) {
    await supabaseClient.from('task_responses').update({reward_status: 'paid'}).eq('id', id);
    loadAdminTransactions();
}

// Show admin dashboard for admin users
function showAdminDashboard() {
    document.getElementById('adminDashboard').style.display = 'block';
    showAdminTab('transactions');
}