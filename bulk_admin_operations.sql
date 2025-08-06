-- Bulk approve all pending transactions
UPDATE wallet_transactions 
SET status = 'accepted' 
WHERE status = 'pending';

-- Bulk approve transactions for specific task
UPDATE wallet_transactions 
SET status = 'accepted' 
WHERE task_id = 'TASK_ID_HERE' AND status = 'pending';

-- Bulk approve transactions by date range
UPDATE wallet_transactions 
SET status = 'accepted' 
WHERE status = 'pending' 
AND created_at >= '2025-01-01' 
AND created_at <= '2025-01-31';

-- Bulk approve transactions by amount range
UPDATE wallet_transactions 
SET status = 'accepted' 
WHERE status = 'pending' 
AND amount >= 10 AND amount <= 50;

-- Bulk reject low amount transactions
UPDATE wallet_transactions 
SET status = 'rejected' 
WHERE status = 'pending' 
AND amount < 5;

-- View pending transactions for review
SELECT 
  wt.id,
  wt.user_id,
  up.name as user_name,
  bt.brand_name,
  bt.question,
  wt.amount,
  wt.created_at,
  tr.comment
FROM wallet_transactions wt
JOIN user_profiles up ON wt.user_id = up.user_id
JOIN brand_tasks bt ON wt.task_id = bt.id
LEFT JOIN task_responses tr ON wt.task_id = tr.task_id AND wt.user_id = tr.user_id
WHERE wt.status = 'pending'
ORDER BY wt.created_at DESC;
