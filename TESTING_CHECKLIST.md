# Testing Checklist for Laptop Friendly Places

## ✅ Fixed Issues

### 1. Login & Signup
- ✅ User saved to Firestore with UID as document ID
- ✅ Redirects to home.html after successful login
- ✅ Redirects to home.html after successful signup
- ✅ Proper error messages for invalid credentials
- ✅ Uses Firestore Timestamp for created_at

### 2. Supabase Image Upload
- ✅ Fixed public URL retrieval method
- ✅ Sanitized filenames (removed spaces)
- ✅ Added console logging for debugging
- ✅ Proper error handling

### 3. Report Submission
- ✅ Saves to Firestore with correct structure
- ✅ Uses Firestore Timestamp
- ✅ Includes all required fields

### 4. Places Filtering
- ✅ Only shows approved places on places page
- ✅ Query uses where("status", "==", "approved")

## 🧪 Testing Steps

### Test 1: User Registration & Login

**Signup Test:**
1. Go to `pages/login.html`
2. Click "Sign Up"
3. Fill in:
   - Name: Test User
   - Email: test@example.com
   - Password: Test123!
   - Confirm Password: Test123!
4. Click "Sign Up"
5. ✅ Should see "Account created successfully! Redirecting..."
6. ✅ Should redirect to home.html
7. ✅ Check Firestore `users` collection - should have document with user's UID containing:
   ```javascript
   {
     name: "Test User",
     email: "test@example.com",
     created_at: Timestamp
   }
   ```

**Login Test:**
1. Logout (if logged in)
2. Go to `pages/login.html`
3. Enter:
   - Email: test@example.com
   - Password: Test123!
4. Click "Login"
5. ✅ Should redirect to home.html
6. ✅ Should see user profile icon in header/sidebar

**Error Handling Test:**
1. Try logging in with wrong password
   - ✅ Should show "Invalid email or password"
2. Try signing up with existing email
   - ✅ Should show "Email already in use"
3. Try weak password (less than 6 characters)
   - ✅ Should show "Password must be at least 6 characters"

### Test 2: Contribute Place with Media Upload

**Prerequisites:**
- Ensure Supabase bucket "placeImages" exists
- Ensure folders "images" and "videos" exist in bucket
- Ensure RLS policies are set up (see SUPABASE_STORAGE_SETUP.md)

**Test Steps:**
1. Login to the application
2. Go to `pages/contribute-location.html`
3. Fill in the form:
   - Place Name: "Test Cafe"
   - Category: "Cafe"
   - Description: "Great place for working"
   - Click on map to set location
   - Overall Rating: 4 stars
   - WiFi: Good
   - Power: Good
   - Service: Good
4. Upload 2 images (JPG/PNG)
5. Upload 1 video (MP4) - optional
6. Click "Submit Place"
7. ✅ Should see loading spinner
8. ✅ Should see success message
9. ✅ Should redirect to places.html after 2 seconds

**Verify in Supabase:**
1. Go to Supabase Storage → placeImages
2. ✅ Check `images/` folder - should have 2 uploaded images
3. ✅ Check `videos/` folder - should have 1 uploaded video (if uploaded)
4. ✅ Click on each file - should be accessible/downloadable

**Verify in Firestore:**
1. Go to Firestore → places collection
2. ✅ Find the new place document
3. ✅ Verify structure:
   ```javascript
   {
     name: "Test Cafe",
     category: "cafe",
     description: "Great place for working",
     location: GeoPoint(lat, lng),
     rating: {
       overall: 4,
       wifi: 4,
       power: 4,
       customer_service: 4
     },
     media: {
       images: [
         "https://...supabase.co/storage/v1/object/public/placeImages/images/timestamp-filename.jpg",
         "https://...supabase.co/storage/v1/object/public/placeImages/images/timestamp-filename2.jpg"
       ],
       videos: [
         "https://...supabase.co/storage/v1/object/public/placeImages/videos/timestamp-filename.mp4"
       ] // or null if no video
     },
     status: "pending",
     tag: "new",
     created_at: Timestamp,
     contributed_by: "user_uid"
   }
   ```
4. ✅ Copy one image URL and paste in browser - should load the image
5. ✅ Copy video URL and paste in browser - should play the video

### Test 3: Places Page (Approved Only)

**Setup:**
1. In Firestore, manually change the test place status to "approved"

**Test Steps:**
1. Go to `pages/places.html`
2. ✅ Should only see places with status="approved"
3. ✅ Should NOT see places with status="pending" or "rejected"
4. Click on a place card
5. ✅ Side sheet should open from left
6. ✅ Should see all images and videos in carousel
7. ✅ Click prev/next buttons to navigate through media
8. ✅ Videos should have controls and be playable

### Test 4: Favorites Functionality

**Test Steps:**
1. On places page, click heart icon on a place
2. ✅ Heart should turn solid red
3. ✅ Badge should appear saying "Favorite"
4. Go to `pages/fav.html`
5. ✅ Should see the favorited place
6. Click the place card
7. ✅ Side sheet should open with media carousel
8. Click "X" button on favorite card
9. ✅ Place should be removed from favorites

### Test 5: Report Functionality

**Test Steps:**
1. On places page, click a place to open side sheet
2. Click "Report" button
3. ✅ Side sheet should close
4. ✅ Report modal should open
5. Fill in:
   - Issue Type: "Incorrect Information"
   - Description: "Wrong address"
6. Click "Submit"
7. ✅ Should see "Report submitted successfully!"
8. ✅ Modal should close

**Verify in Firestore:**
1. Go to Firestore → reports collection
2. ✅ Should have new document:
   ```javascript
   {
     place_id: "place_doc_id",
     reported_by: "user_uid",
     status: "pending",
     reason: "incorrect_info",
     message: "Wrong address",
     created_at: Timestamp
   }
   ```

### Test 6: Map View

**Test Steps:**
1. On places page, click a place to open side sheet
2. Click "View Map" button
3. ✅ Should navigate to map-view.html with URL parameters
4. ✅ Map should zoom to the place location
5. ✅ Place should have RED marker (different from others)
6. ✅ Popup should auto-open showing place details
7. Click on other markers
8. ✅ Should show place details in popup

### Test 7: Contributors List

**Setup:**
1. Ensure you have contributors in Firestore:
   ```javascript
   {
     contributors_id: "user_uid",
     places_id: ["place1", "place2"],
     total_contributions: 2
   }
   ```

**Test Steps:**
1. Go to `pages/contribute-location.html`
2. ✅ Should see "Top Contributors" sidebar on the right
3. ✅ Should show top 10 contributors
4. ✅ Top 3 should have special colored badges (gold, silver, bronze)
5. ✅ Should show contributor name and contribution count

### Test 8: Profile Page

**Test Steps:**
1. Click profile icon (sidebar or header)
2. ✅ Should navigate to profile.html
3. ✅ Should show user name and email
4. ✅ Should show favorites count
5. ✅ Should show member since date
6. Click "Logout"
7. ✅ Should redirect to login.html
8. ✅ Should not be able to access protected pages

### Test 9: Responsive Design

**Test Steps:**
1. Resize browser to mobile size (< 768px)
2. ✅ Sidebar should move to bottom
3. ✅ Profile icon should appear in header
4. ✅ Sidebar profile icon should hide
5. ✅ Contributors sidebar should move to top on contribute page
6. ✅ Side sheet should take full width
7. ✅ All pages should be usable on mobile

## 🐛 Common Issues & Solutions

### Issue: Images not loading from Supabase
**Solution:**
1. Check Supabase RLS policies
2. Ensure bucket is public
3. Verify file was actually uploaded (check Supabase dashboard)
4. Check browser console for CORS errors

### Issue: User not saved to Firestore
**Solution:**
1. Check Firebase console for errors
2. Verify Firestore rules allow writes
3. Check browser console for error messages

### Issue: Places not showing
**Solution:**
1. Verify places have status="approved"
2. Check browser console for query errors
3. Verify Firebase connection

### Issue: Report not submitting
**Solution:**
1. Check if user is authenticated
2. Verify Firestore rules allow writes to reports collection
3. Check browser console for errors

## 📝 Notes

- All timestamps use Firestore `Timestamp.now()`
- User documents use UID as document ID
- Images/videos stored in Supabase, URLs stored in Firestore
- Only approved places show on places page
- Favorites stored in localStorage
- Contributors must be manually added to Firestore (or use Cloud Functions)
