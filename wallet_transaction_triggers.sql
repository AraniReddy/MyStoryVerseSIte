-- Update wallet_transactions table to support new statuses
ALTER TABLE wallet_transactions DROP CONSTRAINT IF EXISTS wallet_transactions_status_check;
ALTER TABLE wallet_transactions ADD CONSTRAINT wallet_transactions_status_check 
CHECK (status IN ('pending', 'accepted', 'rejected', 'paid'));

-- Function to update wallet balance when status changes to 'accepted'
CREATE OR REPLACE FUNCTION update_wallet_on_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- If status changed from pending to accepted, add money to wallet
  IF OLD.status = 'pending' AND NEW.status = 'accepted' THEN
    UPDATE user_profiles 
    SET points_balance = points_balance + NEW.amount
    WHERE user_id = NEW.user_id;
  END IF;
  
  -- If status changed from accepted back to pending/rejected, subtract money
  IF OLD.status = 'accepted' AND NEW.status IN ('pending', 'rejected') THEN
    UPDATE user_profiles 
    SET points_balance = points_balance - NEW.amount
    WHERE user_id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS wallet_update_trigger ON wallet_transactions;
CREATE TRIGGER wallet_update_trigger
  AFTER UPDATE ON wallet_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_wallet_on_accepted();
