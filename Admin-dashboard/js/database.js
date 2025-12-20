// js/database.js
// Main database array
let database = {
  places: [
    {
      id: 1,
      name: "Tomoca Coffee",
      type: "cafe",
      location: "Bole, Addis Ababa",
      description:
        "One of the best coffee shops with excellent WiFi and comfortable seating. Plenty of power outlets available.",
      wifiSpeed: "Fast",
      powerOutlets: "Plentiful",
      noiseLevel: "Moderate",
      rating: 4.8,
      image:
        "https://images.unsplash.com/photo-1498804103079-a6351b050096?w=600&h=400&fit=crop",
      status: "verified",
      addedBy: "admin",
      contributorId: null,
      addedDate: "2024-01-15",
      reports: 0,
      latitude: 9.0227,
      longitude: 38.7469,
    },
    {
      id: 2,
      name: "Work Hub Co-working",
      type: "coworking",
      location: "Megenagna, Addis Ababa",
      description:
        "Modern co-working space with high-speed internet and ergonomic chairs.",
      wifiSpeed: "Very Fast",
      powerOutlets: "Plentiful",
      noiseLevel: "Quiet",
      rating: 4.5,
      image:
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=600&h=400&fit=crop",
      status: "verified",
      addedBy: "admin",
      contributorId: null,
      addedDate: "2024-01-10",
      reports: 0,
      latitude: 9.03,
      longitude: 38.77,
    },
    {
      id: 3,
      name: "New Coffee Spot",
      type: "cafe",
      location: "Piassa, Addis Ababa",
      description:
        "Recently opened coffee shop with good WiFi. Limited power outlets.",
      wifiSpeed: "Medium",
      powerOutlets: "Limited",
      noiseLevel: "Busy",
      rating: 3.5,
      image:
        "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&h=400&fit=crop",
      status: "pending",
      addedBy: "user123",
      contributorId: "user123",
      addedDate: "2024-01-25",
      reports: 0,
      latitude: 9.035,
      longitude: 38.76,
    },
    {
      id: 4,
      name: "Starbucks",
      type: "cafe",
      location: "Bole Road, Addis Ababa",
      description:
        "International coffee chain with reliable WiFi and ample seating.",
      wifiSpeed: "Fast",
      powerOutlets: "Available",
      noiseLevel: "Moderate",
      rating: 4.2,
      image:
        "https://images.unsplash.com/photo-1561047029-3000c68339ca?w=600&h=400&fit=crop",
      status: "verified",
      addedBy: "admin",
      contributorId: null,
      addedDate: "2024-01-20",
      reports: 1,
      latitude: 9.028,
      longitude: 38.75,
    },
  ],
  reports: [
    {
      id: 1,
      placeId: 1,
      placeName: "Tomoca Coffee",
      issueType: "Wrong Information",
      reportedBy: "user456",
      description:
        "WiFi speed is not as fast as mentioned. The speed test shows only 20Mbps instead of 50Mbps.",
      image:
        "https://images.unsplash.com/photo-1547658719-da2b51169166?w=600&h=400&fit=crop",
      reportedDate: "2024-01-20",
      status: "pending",
      latitude: 9.0227,
      longitude: 38.7469,
    },
    {
      id: 2,
      placeId: 2,
      placeName: "Work Hub Co-working",
      issueType: "Price Change",
      reportedBy: "user789",
      description:
        "Hourly rate has increased from $5 to $8 without notice. This makes it less affordable for students.",
      image:
        "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop",
      reportedDate: "2024-01-18",
      status: "resolved",
      latitude: 9.03,
      longitude: 38.77,
    },
    {
      id: 3,
      placeId: 4,
      placeName: "Starbucks",
      issueType: "Poor Service",
      reportedBy: "user101",
      description:
        "WiFi password changed without notice. Staff was unhelpful in providing the new password.",
      image:
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=600&h=400&fit=crop",
      reportedDate: "2024-01-22",
      status: "pending",
      latitude: 9.028,
      longitude: 38.75,
    },
  ],
  contributors: [
    {
      id: "user123",
      name: "John Doe",
      email: "john@example.com",
      placesAdded: 3,
      joinDate: "2024-01-01",
    },
    {
      id: "user456",
      name: "Jane Smith",
      email: "jane@example.com",
      placesAdded: 5,
      joinDate: "2024-01-05",
    },
    {
      id: "user789",
      name: "Alex Johnson",
      email: "alex@example.com",
      placesAdded: 2,
      joinDate: "2024-01-10",
    },
  ],
  activities: [
    {
      id: 1,
      type: "place_added",
      message: "Added new place 'Tomoca Coffee'",
      timestamp: "2024-01-15 10:30",
    },
    {
      id: 2,
      type: "place_verified",
      message: "Verified 'Work Hub Co-working'",
      timestamp: "2024-01-16 14:20",
    },
    {
      id: 3,
      type: "report_resolved",
      message: "Resolved report for 'Work Hub Co-working'",
      timestamp: "2024-01-18 09:15",
    },
    {
      id: 4,
      type: "place_added",
      message: "Added new place 'New Coffee Spot'",
      timestamp: "2024-01-25 16:45",
    },
  ],
};

// Database helper functions
const db = {
  get(table) {
    return Promise.resolve(database[table] || []);
  },

  add(table, item) {
    if (!database[table]) database[table] = [];
    database[table].push(item);
    return Promise.resolve(item);
  },

  update(table, id, updates) {
    if (!database[table]) return Promise.resolve(null);

    const index = database[table].findIndex((item) => item.id === id);
    if (index !== -1) {
      database[table][index] = { ...database[table][index], ...updates };
      return Promise.resolve(database[table][index]);
    }
    return Promise.resolve(null);
  },

  delete(table, id) {
    if (!database[table]) return Promise.resolve(false);

    const index = database[table].findIndex((item) => item.id === id);
    if (index !== -1) {
      database[table].splice(index, 1);
      return Promise.resolve(true);
    }
    return Promise.resolve(false);
  },

  query(table, condition) {
    const items = database[table] || [];
    return Promise.resolve(items.filter(condition));
  },
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = { database, db };
}
