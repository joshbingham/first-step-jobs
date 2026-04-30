# **First Step Jobs 🚀**

A full-stack job search platform designed to make job discovery **simpler, clearer, and more data-driven**.

---

## **🔍 Overview**

**First Step Jobs** aggregates job listings from multiple sources and enhances them with:

- 📊 **Match scoring** (not just listings)
- 📍 **Distance-based ranking**
- 🚗 **Real-time commute insights**
- 💾 **Saved jobs with persistent state**

The goal is to help users quickly understand **how well a job fits them**, instead of manually comparing listings across multiple platforms.

---

## **💡 Why I Built This**

This project came from my own frustration with job searching.

Most platforms:
- Don’t show how well a job matches your preferences  
- Require switching between multiple sites  
- Don’t integrate commute time into decision-making  

I wanted to build something that:
- Combines multiple job sources into one place  
- Adds **transparent match scoring**  
- Integrates **location and commute insights directly into the UI**  
- Makes evaluating jobs faster and more intuitive  

---

## **✨ Key Features**

### 🔎 Aggregated Job Search
- Combines results from:
  - Adzuna API  
  - Remotive (remote jobs)  
  - Arbeitnow  
- Normalises and de-duplicates data into a unified format  

---

### ⭐ Match Scoring System
Each job is scored based on:
- Keyword relevance  
- Salary range overlap  
- Distance from user  
- Recency of posting  

Provides:
- A percentage match score  
- Clear reasons explaining the score  

---

### 📍 Location & Distance
- Converts UK postcodes → latitude/longitude (Postcodes.io)  
- Uses the **Haversine formula** to calculate distance  
- Ranks jobs by proximity  

---

### 🚗 Commute Time Integration
- Calculates travel time based on:
  - Car 🚗  
  - Walking 🚶  
  - Bike 🚴  
  - Public transport 🚆  
- Results cached client-side to avoid unnecessary requests  

---

### 💾 Saved Jobs (Persistent State)
- Save jobs with:
  - Match score at time of saving  
  - Match reasoning  
- Stored in `localStorage`  
- Fully reconstructable without relying on APIs  

---

### 🔄 Smart Pagination
- Backend-driven pagination for:
  - Local jobs  
  - Remote jobs  
- Prevents UI overload and improves performance  

---

### ⚡ Responsive Filtering
- Filters update dynamically:
  - Keywords  
  - Salary range  
  - Distance radius  
- Designed to balance:
  - **Controlled API calls**  
  - **Responsive UI updates**  

---

## **🧠 Technical Highlights**

### Backend (Node.js / Express)
- Multi-API data aggregation  
- Data normalisation across inconsistent schemas  
- De-duplication using composite keys  
- Location-based filtering + ranking  
- Centralised pagination logic  

---

### Frontend (React)
- Multi-view state management (local / remote / saved)  
- Derived state handling for sorting and scoring  
- Client-side caching (commute times)  
- Persistent state via `localStorage`  
- Dynamic UI updates based on user input  

---

### 🧮 Custom Algorithms
- Match scoring system combining multiple weighted factors  
- Distance calculation using Haversine formula  
- Progressive search radius fallback  

---

## **🧱 Tech Stack**

### Frontend
- React  
- JavaScript (ES6+)  
- CSS (custom styling)

### Backend
- Node.js  
- Express  

### APIs & Services
- Adzuna API  
- Remotive API  
- Arbeitnow API  
- Postcodes.io  
- Commute service (custom integration)

---

## **⚙️ Getting Started**

### 1. Clone the repository
```bash
git clone https://github.com/joshbingham/first-step-jobs
cd first-step-jobs
```

### 2. Install dependencies

**Server**
```bash
cd server
npm install
```

**Client**
```bash
cd client
npm install
```

### 3. Environment Variables

Create a `.env` file in `/server`:

```env
ADZUNA_APP_ID=your_id
ADZUNA_APP_KEY=your_key
```

### 4. Run the app

**Start backend**
```bash
npm run dev
```

**Start frontend**
```bash
npm start
```

---

## **📡 API Endpoints**

### `GET /jobs`
Fetch jobs with filters:
- `what` (keyword)
- `location` (postcode)
- `distance`
- `salary_min`
- `salary_max`
- `page`
- `limit`

---

### `GET /commute`
Calculate commute time:
- `originLat`, `originLon`
- `destLat`, `destLon`
- `mode` (driving, walking, bicycling, transit)

---

## **🧪 Key Learnings**

- Normalising data from multiple APIs is non-trivial  
- State persistence across views introduces subtle bugs  
- Caching vs fresh data requires clear boundaries  
- Debugging React requires understanding:
  - state → derived state → render flow  
- Smaller, testable units make debugging significantly easier  

---

## **🚀 Future Improvements**

- User accounts & cloud persistence  
- Better salary normalisation across APIs  
- Improved remote job classification  
- Map-based job visualisation  
- Enhanced filtering (experience level, tech stack, etc.)  

---

## **📬 Links**

- 🌐 Live Site: https://first-step-jobs-i7z9.vercel.app/  
- 💻 GitHub: https://github.com/joshbingham/first-step-jobs  

---

## **👤 Author**

**Joshua Bingham**  
Junior Full-Stack Developer  
React • Node.js • APIs • Data-driven UI  
