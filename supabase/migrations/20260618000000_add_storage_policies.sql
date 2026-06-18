-- RLS policies for storage.objects to allow field workers to upload and manage dog images
-- Note: bucket_id is 'dog-images'

-- Allow anyone to view images
CREATE POLICY "Allow public select on dog-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'dog-images');

-- Allow anyone to upload images
CREATE POLICY "Allow public insert on dog-images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'dog-images');

-- Allow anyone to update images (needed for metadata/overwrites)
CREATE POLICY "Allow public update on dog-images"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'dog-images');

-- Allow anyone to delete images (if cleanup is needed)
CREATE POLICY "Allow public delete on dog-images"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'dog-images');
