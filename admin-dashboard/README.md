# SecretShop Admin Dashboard

A web-based admin dashboard for managing SecretShop transactions, tasks, and promotions.

## Setup

1. **Update Supabase Configuration**
   Edit `script.js` and replace:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```

2. **Serve the Files**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx serve .
   
   # Using PHP
   php -S localhost:8000
   ```

3. **Access Dashboard**
   Open `http://localhost:8000` in your browser

## Features

### Pending Transactions
- View all pending reward transactions
- Approve transactions (updates `reward_status` to 'paid')
- Reject transactions (deletes the transaction)
- Automatic wallet balance update via database trigger

### Add Tasks
- Create new brand tasks
- Set reward amount and user target
- Add image URLs
- Enable secure mode
- Auto-expires in 30 days

### Add Promotions
- Create video promotions
- Set promotion rewards
- Add descriptions and video URLs

## Database Requirements

Ensure these tables exist in Supabase:
- `task_responses` (with `reward_status` column)
- `brand_tasks`
- `promotions`
- `user_profiles`

## Security Notes

- This is a basic admin interface
- Add authentication for production use
- Implement proper admin role checking
- Use environment variables for sensitive data

## Usage

1. **Approve Transactions**: Click "Approve" to pay users
2. **Add Tasks**: Fill form and submit to create new tasks
3. **Add Promotions**: Create video promotions for users

The dashboard automatically refreshes data and provides feedback on all operations.