-- Create policies for the 'chat-files' bucket
-- Note: This assumes the bucket 'chat-files' has been created and is public.

-- 1. Allow authenticated users to view all files in the bucket.
-- This is a simple policy for a public bucket. For more granular control,
-- you might check against a user's room or ID.
CREATE POLICY "Allow authenticated read access"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'chat-files' );

-- 2. Allow authenticated users to upload files.
-- The policy checks that the user is who they say they are.
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'chat-files' AND auth.uid() = (storage.foldername(name))[2]::uuid );

-- 3. Allow users to update their own files.
-- The user's ID must match the second folder in the file path.
CREATE POLICY "Allow users to update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'chat-files' AND auth.uid() = (storage.foldername(name))[2]::uuid );

-- 4. Allow users to delete their own files.
CREATE POLICY "Allow users to delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'chat-files' AND auth.uid() = (storage.foldername(name))[2]::uuid ); 