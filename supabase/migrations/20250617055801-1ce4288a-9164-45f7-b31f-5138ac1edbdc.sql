
-- Update the storage policies to fix the file upload issues
-- First, drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own files" ON storage.objects;

-- Create new, more permissive policies for chat file uploads
CREATE POLICY "Allow authenticated users to view chat files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'chat-files');

CREATE POLICY "Allow authenticated users to upload chat files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update their chat files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to delete their chat files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'chat-files' AND auth.uid() IS NOT NULL);
