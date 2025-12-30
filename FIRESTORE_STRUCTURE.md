# Firestore Database Structure

## Collections Overview

### 1. places
Stores all the laptop-friendly places submitted by users.

```javascript
{
  name: "Angela Cafe",
  category: "cafe",
  description: "Great place for working with laptop",
  location: {
    latitude: 9.0365,
    longitude: 38.7612
  },
  media: {
    images: [
      "https://supabase.url/image1.jpg",
      "https://supabase.url/image2.jpg"
    ],
    videos: [
      "https://supabase.url/video1.mp4"
    ] // or null if no video
  },
  rating: {
    overall: 4.5,
    wifi: 4.0,
    power: 4.5,
    customer_service: 4.8
  },
  status: "approved", // "pending", "approved", "rejected"
  tag: "popular", // "new", "popular", "all"
  created_at: Timestamp,
  contributed_by: "user_uid"
}
```

### 2. users
Stores user information from Firebase Authentication.

```javascript
{
  name: "John Doe",
  email: "john@example.com",
  created_at: Timestamp
}
```

### 3. contributors
Tracks user contributions and statistics.

```javascript
{
  contributors_id: "user_uid", // Reference to users collection
  places_id: [
    "place_doc_id_1",
    "place_doc_id_2",
    "place_doc_id_3"
  ],
  total_contributions: 3
}
```

### 4. reports
Stores reports submitted by users about places.

```javascript
{
  place_id: "place_doc_id",
  reported_by: "user_uid",
  status: "pending", // "pending", "resolved", "dismissed"
  reason: "incorrect_info", // "incorrect_info", "spam", "inappropriate_content", "other"
  message: "Description of the issue",
  created_at: Timestamp
}
```

## Indexes Required

For optimal performance, create these composite indexes:

### places collection
- `status` (Ascending) + `tag` (Ascending)
- `status` (Ascending) + `created_at` (Descending)

### contributors collection
- `total_contributions` (Descending)

## Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Places collection
    match /places/{placeId} {
      // Anyone can read approved places
      allow read: if resource.data.status == 'approved';
      
      // Authenticated users can create places (pending approval)
      allow create: if request.auth != null;
      
      // Only admins can update/delete
      allow update, delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      // Users can read their own data
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Users can create their own profile
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Users can update their own profile
      allow update: if request.auth != null && request.auth.uid == userId;
    }
    
    // Contributors collection
    match /contributors/{contributorId} {
      // Anyone can read
      allow read: if true;
      
      // Only system/admin can write
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Reports collection
    match /reports/{reportId} {
      // Authenticated users can create reports
      allow create: if request.auth != null;
      
      // Only admins can read/update reports
      allow read, update: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

## How to Update Contributors

When a place is approved by admin, you should:

1. Check if contributor exists in `contributors` collection
2. If exists: 
   - Add the place_id to `places_id` array
   - Increment `total_contributions` by 1
3. If not exists:
   - Create new document with contributor's user_id
   - Set `places_id` array with the new place_id
   - Set `total_contributions` to 1

Example Cloud Function (optional):

```javascript
exports.updateContributorStats = functions.firestore
  .document('places/{placeId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const oldData = change.before.data();
    
    // Check if status changed to approved
    if (oldData.status !== 'approved' && newData.status === 'approved') {
      const contributorId = newData.contributed_by;
      const placeId = context.params.placeId;
      
      const contributorRef = admin.firestore()
        .collection('contributors')
        .doc(contributorId);
      
      const contributorDoc = await contributorRef.get();
      
      if (contributorDoc.exists) {
        // Update existing contributor
        await contributorRef.update({
          places_id: admin.firestore.FieldValue.arrayUnion(placeId),
          total_contributions: admin.firestore.FieldValue.increment(1)
        });
      } else {
        // Create new contributor
        await contributorRef.set({
          contributors_id: contributorId,
          places_id: [placeId],
          total_contributions: 1
        });
      }
    }
  });
```
