# 🌱 PocketBase Setup & Data Seeding Guide

**Quick Start**: Get your platform running with complete sample data in minutes!

---

## 📋 Prerequisites

1. **PocketBase Running**: `http://127.0.0.1:8090`
2. **Node.js Installed**: v16 or higher
3. **Admin Account Created**: In PocketBase

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Install Dependencies
```bash
npm install pocketbase
```

### Step 2: Run Auto-Seed Script
```bash
node seed-all-data.cjs
```

### Step 3: Login & Explore!
Open `http://localhost:3002` and login with:
- **Admin**: `admin@school.com` / `Admin123!@#`
- **Teacher**: `john.teacher@school.com` / `Teacher123!@#`
- **Student**: `alice.student@school.com` / `Student123!@#`

---

## 📊 What Gets Created

The auto-seed script creates:

### Users (7)
- 1 Admin
- 2 Teachers  
- 3 Students
- 1 Parent

### School System
- ✅ 3 Classes (Grade 10, 11, 12)
- ✅ 5 Subjects (Math, Physics, Chemistry, English, CS)
- ✅ Teacher-Student relationships

### Gamification
- ✅ 5 Achievements (Common → Legendary)
- ✅ 4 Rewards (Avatars, Themes, Power-ups)
- ✅ Student progress & XP
- ✅ Unlocked achievements

### Sport App
- ✅ 3 Teams with stats
- ✅ 2 Venues
- ✅ Team memberships

### Travel App
- ✅ 3 Featured destinations (Tokyo, Paris, Dubai)
- ✅ Pricing & activities

### Help Center
- ✅ 4 FAQs across categories
- ✅ 2 Knowledge base articles

### Religion App
- ✅ 2 Events (prayers, community)
- ✅ 2 Quran verses (Al-Fatihah, Al-Ikhlas)

---

## 🔧 Manual Collection Creation

If you need to create collections manually, see individual setup guides:

- `SPORT_APP_SETUP.md`
- `GAMIFICATION_APP_SETUP.md`
- `TRAVEL_APP_SETUP.md`
- `HELP_CENTER_SETUP.md`
- Plus 4 more...

---

## 🎯 Testing Your Setup

After seeding:

1. **Login as Student**
   - See gamification progress
   - View unlocked achievements
   - Check class assignments

2. **Login as Teacher**
   - See assigned classes
   - View students
   - Create content

3. **Login as Admin**
   - Access all features
   - Manage users
   - View analytics

---

## 📱 Explore All Apps

Navigate using the footer icons:
- ⚽ Sport - See teams and matches
- 🏆 Gamification - View achievements
- ✈️ Travel - Browse destinations
- 💬 Help Center - Read FAQs
- 🎨 Hobbies - Track projects
- 🕌 Religion - Prayer times

---

## 🔄 Re-seeding

To reset and re-seed:

1. Delete existing data in PocketBase Admin
2. Run: `node seed-all-data.cjs`

---

## ⚡ Advanced: Custom Data

Edit `seed-all-data.cjs` to customize:
- Add more users
- Create additional classes
- Add custom achievements
- Modify sample content

---

## 🐛 Troubleshooting

**"Collection not found"**
→ Create collections first (see manual setup guides)

**"Duplicate entry"**
→ Data already exists, script will skip

**"Authentication failed"**
→ Check admin credentials in script

---

## 📈 Next Steps

1. ✅ Data seeded
2. 🧪 Test all features
3. 📱 Customize for your needs
4. 🚀 Deploy to production

---

**Your platform is ready to use!** 🎉

All features are populated with realistic data. Start exploring!
