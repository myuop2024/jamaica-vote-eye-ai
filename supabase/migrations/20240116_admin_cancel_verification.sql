-- Create RPC function for admins to cancel verifications
CREATE OR REPLACE FUNCTION admin_cancel_verification(verification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Check if the current user is an admin
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  
  IF user_role != 'admin' THEN
    RAISE EXCEPTION 'Only admins can cancel verifications';
  END IF;
  
  -- Update the verification status
  UPDATE didit_verifications
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id = verification_id
    AND status = 'pending';
  
  -- Return true if a row was updated
  RETURN FOUND;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION admin_cancel_verification TO authenticated; 