# Laptop Friendly Places (LFP)
Find and share laptop-friendly spots around your area!
These are places with good Wi-Fi, a peaceful environment, and great customer service — perfect for working or studying.

## Features
- **Browse Places**: Discover nearby places that are suitable for working with your laptop
- **Detailed Information**: View photos, videos, ratings (WiFi, Power, Service), and descriptions
- **Favorites**: Save your favorite places for quick access
- **Interactive Map**: View all places on an interactive map with detailed popups
- **Contribute**: Add new places by uploading images/videos and providing details
- **Filter & Sort**: Filter places by All, New, or Popular
- **User Profiles**: View your profile with favorites count and contributions
- **Report System**: Report inappropriate or incorrect place information

## Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Firebase (Authentication, Firestore Database)
- **Maps**: Leaflet.js with OpenStreetMap
- **Icons**: Font Awesome 6

## Project Structure
```
├── Admin-dashboard/        # Admin panel for managing places
├── assets/                 # Images and static assets
├── css/                    # Stylesheets
├── js/                     # JavaScript files
│   ├── firebase/          # Firebase configuration and initialization
│   ├── supabase/          # Supabase client (if used)
│   ├── places.js          # Places page logic
│   ├── fav.js             # Favorites page logic
│   ├── map-view.js        # Map view logic
│   ├── profile.js         # User profile logic
│   └── login.js           # Authentication logic
├── pages/                  # HTML pages
│   ├── home.html          # Dashboard/Home page
│   ├── places.html        # Browse all places
│   ├── fav.html           # Favorite places
│   ├── map-view.html      # Map view
│   ├── profile.html       # User profile
│   ├── login.html         # Login/Signup
│   └── contribute-location.html  # Add new place
└── index.html             # Landing page

```

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/laptop-friendly-places.git
cd laptop-friendly-places
```

### 2. Firebase Configuration
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication (Email/Password)
3. Create a Firestore Database
4. Copy `js/firebase/config.example.js` to `js/firebase/config.js`
5. Replace the placeholder values with your Firebase credentials:

```javascript
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 3. Firestore Database Structure

Create the following collections in Firestore:

**places** collection:
```javascript
{
  name: "Place Name",
  description: "Description",
  category: "cafe",
  location: {
    latitude: 9.0365,
    longitude: 38.7612
  },
  media: {
    images: ["url1", "url2"],
    videos: ["url1"] // or null if no video
  },
  rating: {
    overall: 4.5,
    wifi: 4.0,
    power: 4.5,
    customer_service: 4.8
  },
  status: "approved",
  tag: "popular", // "new", "popular", or "all"
  created_at: timestamp
}
```

**users** collection:
```javascript
{
  name: "User Name",
  email: "user@example.com",
  created_at: timestamp
}
```

**reports** collection:
```javascript
{
  place_id: "place_doc_id",
  reported_by: "user_uid",
  status: "pending",
  reason: "incorrect_info",
  message: "Description of issue",
  created_at: timestamp
}
```

### 4. Run the Project
Since this is a static web application, you can run it using:

**Option 1: Live Server (VS Code)**
- Install the "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

**Option 2: Python HTTP Server**
```bash
python -m http.server 8000
```
Then open `http://localhost:8000` in your browser

**Option 3: Node.js HTTP Server**
```bash
npx http-server
```

### 5. Default Login
Create a user account through the signup page, or use Firebase Console to add test users.

## Features Overview

### User Features
- **Authentication**: Secure login/signup with Firebase Auth
- **Browse Places**: View all laptop-friendly places with ratings
- **Favorites**: Save places to your favorites list (stored in localStorage)
- **Map View**: Interactive map showing all approved places
- **Place Details**: Side sheet with images/videos, ratings, and actions
- **Contribute**: Submit new places for approval
- **Profile**: View your account info and statistics

### Admin Features (Admin Dashboard)
- Manage places (approve/reject submissions)
- View contributors
- Handle reported places
- Add places directly

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## Group Members
- Amen Teshome.............ETS 0165/16
- Amir Abduljelil..........ETS 0167/16
- Betsegaw Tesfaye.........ETS 0285/16
- Biniyam Kinfe............ETS 0304/16
- Binyam Yalew.............ETS 0297/15
- Degaga Desta.............ETS 0352/16

## License
This project is open source and available under the [MIT License](LICENSE).

## Support
For issues and questions, please open an issue on GitHub.
