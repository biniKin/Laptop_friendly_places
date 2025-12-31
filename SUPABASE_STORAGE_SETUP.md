# Supabase Storage Setup Guide

## Setting up the placeImages Bucket

### Step 1: Create the Bucket
1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **New bucket**
4. Name it: `placeImages`
5. Make it **Public** (so images can be viewed by anyone)
6. Click **Create bucket**

### Step 2: Create Folder Structure
1. Click on the `placeImages` bucket
2. Create two folders:
   - `images`
   - `videos`

### Step 3: Set Up Storage Policies

Go to **Storage** → **Policies** and add these policies:

#### Policy 1: Allow Authenticated Users to Upload
```sql
CREATE POLICY "Allow authenticated users to upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'placeImages' AND
  (storage.foldername(name))[1] IN ('images', 'videos')
);
```

#### Policy 2: Allow Public to View/Download
```sql
CREATE POLICY "Allow public to view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'placeImages');
```

#### Policy 3: Allow Users to Update Their Own Files (Optional)
```sql
CREATE POLICY "Allow users to update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'placeImages')
WITH CHECK (bucket_id = 'placeImages');
```

#### Policy 4: Allow Users to Delete Their Own Files (Optional)
```sql
CREATE POLICY "Allow users to delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'placeImages');
```

### Alternative: Simple Public Upload (Less Secure)

If you want to allow anyone to upload without authentication:

```sql
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'placeImages');
```

**Warning:** This is not recommended for production as anyone can upload files to your bucket.

### Step 4: Configure Bucket Settings

1. Go to **Storage** → **placeImages** → **Configuration**
2. Set the following:
   - **File size limit**: 50 MB (or your preferred limit)
   - **Allowed MIME types**: 
     - For images: `image/jpeg`, `image/png`, `image/jpg`, `image/webp`
     - For videos: `video/mp4`, `video/quicktime`, `video/x-msvideo`

### Step 5: Test the Setup

Try uploading a file through your contribute page. If you still get errors:

1. Check the browser console for detailed error messages
2. Verify the bucket name is exactly `placeImages` (case-sensitive)
3. Ensure your Supabase client is properly initialized with the correct URL and anon key
4. Make sure the user is authenticated (logged in with Firebase Auth)

### Troubleshooting

**Error: "new row violates row-level security policy"**
- Solution: Make sure you've created the INSERT policy for authenticated users
- Or temporarily disable RLS to test (not recommended for production)

**Error: "Bucket not found"**
- Solution: Check the bucket name spelling (case-sensitive)

**Error: "File size too large"**
- Solution: Increase the file size limit in bucket configuration

**Error: "Invalid MIME type"**
- Solution: Add the file's MIME type to the allowed types list

### Quick Fix for Development

If you just want to test quickly, you can disable RLS:

1. Go to **Storage** → **placeImages**
2. Click on **Policies**
3. Click **Disable RLS** (toggle switch)

**Remember to enable RLS and set proper policies before going to production!**
