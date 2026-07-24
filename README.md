# First Step Jobs

A decision-support platform that helps job seekers compare opportunities using personalised match scoring, realistic commute insights and intelligent filtering.

[Live application](https://first-step-jobs-i7z9.vercel.app/) · [Portfolio](https://joshbingham.dev/) · [GitHub repository](https://github.com/joshbingham/first-step-jobs)

## Overview

First Step Jobs brings vacancies from several job sources into one interface, then adds context that ordinary listings often leave out.

Instead of only showing available roles, the application helps users understand:

- how closely a vacancy matches their preferences
- why it received its match score
- how far away it is
- how long the commute could take by different travel modes
- which opportunities they have already saved

The aim is to make job searching more structured and reduce the effort involved in comparing roles across multiple platforms.

## Why I built it

This project grew from my own experience of job searching.

Most job platforms present large numbers of vacancies, but users still have to work out for themselves whether each role is relevant, realistically commutable or worth revisiting. Comparing information across several websites also makes the process fragmented.

I wanted to build an application that:

- combines vacancies from multiple sources
- explains why an opportunity may be suitable
- includes location and commute information in the decision
- keeps saved roles and preferences available between sessions
- makes a large set of results easier to review

Rather than building another listings page, I focused on creating a transparent decision-support tool.

## Key features

### Aggregated job search

The backend retrieves vacancies from:

- Adzuna
- Remotive
- Arbeitnow

Because each service returns different field names and data structures, the results are normalised into a shared job format before being sent to the frontend.

Composite keys are used to identify likely duplicates so that the user sees a cleaner combined result set.

### Match scoring

Each vacancy is assessed against several user preferences, including:

- keyword relevance
- salary overlap
- distance
- posting recency
- remote-working suitability

The interface shows both a percentage score and the reasons behind it. This keeps the recommendation logic visible instead of presenting an unexplained ranking.

### Distance and commute insights

The application converts UK postcodes into coordinates using Postcodes.io and calculates straight-line distance with the Haversine formula.

Users can also compare estimated commute times for:

- driving
- walking
- cycling
- public transport

Commute responses are cached to avoid repeating the same request unnecessarily.

### Saved jobs

Users can save vacancies for later review.

A saved job retains:

- the job information
- its match score at the time it was saved
- the reasons behind that score
- the date it was saved

Saved jobs are stored in `localStorage`, allowing the saved view to be reconstructed without requesting the original vacancy again.

### Backend-driven pagination

Local and remote results are paginated by the backend.

This keeps the amount of data rendered at one time manageable and gives the frontend a consistent paging model across different vacancy sources.

### Responsive filtering

Users can refine results by:

- keyword
- postcode
- search radius
- minimum salary
- maximum salary
- travel mode

The interface includes clear loading feedback while asynchronous searches and commute requests are running.

## Technical decisions

### Normalising external data

The job APIs do not return identical schemas. The backend maps each source into a common structure so that React components can work with one predictable data shape.

This separates provider-specific processing from presentation logic and makes it easier to add another source later.

### De-duplicating combined results

Vacancies from different services can describe the same role differently.

The backend creates composite identifiers from job information such as title, company and location, then removes likely duplicates before pagination.

### Keeping recommendation logic explainable

The matching system uses weighted factors, but it also produces plain-language reasons for the score.

This was an important product decision: users should be able to understand why a job has been ranked highly rather than having to trust an opaque number.

### Separating local, remote and saved workflows

The React frontend maintains distinct views for local roles, remote roles and saved jobs while sharing the search preferences and reusable presentation logic they need.

Derived values such as sorting and scoring are calculated from the relevant source state rather than being copied into several competing state variables.

### Caching commute requests

Commute calculations can be slower and more expensive than ordinary UI updates.

Previously requested journeys are cached so that revisiting a job or changing views does not automatically trigger the same external request again.

### Testing smaller units

The backend uses Jest and Supertest. Tests cover important processing logic, including job handling, distance calculations and commute-related behaviour.

Breaking the application into smaller functions made those areas easier to verify and debug.

## Architecture

```text
React frontend
     |
     | search filters and commute requests
     v
Node.js and Express API
     |
     | retrieves, normalises, de-duplicates,
     | scores, filters and paginates vacancies
     v
Adzuna · Remotive · Arbeitnow · Postcodes.io · commute service

Browser storage
     |
     └── saved jobs, saved match information and user preferences
```

## Tech stack

### Frontend

- React
- JavaScript (ES6+)
- Vite
- CSS
- `localStorage`

### Backend

- Node.js
- Express
- Axios
- REST APIs
- ESM modules

### External services

- Adzuna API
- Remotive API
- Arbeitnow API
- Postcodes.io
- commute-time service

### Testing and deployment

- Jest
- Supertest
- Vercel
- Render
- Git
- GitHub

## Repository structure

```text
first-step-jobs/
├── backend/
├── frontend/
└── README.md
```

The repository is divided into separate frontend and backend applications.

## Getting started

### Prerequisites

- Node.js
- npm
- Adzuna developer credentials

### 1. Clone the repository

```bash
git clone https://github.com/joshbingham/first-step-jobs.git
cd first-step-jobs
```

### 2. Install and run the backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend`:

```env
ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key
```

Start the backend:

```bash
npm start
```

For development with Nodemon:

```bash
npx nodemon server.js
```

### 3. Install and run the frontend

Open another terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Vite will display the local frontend address in the terminal.

## API endpoints

### `GET /jobs`

Retrieves processed vacancies.

Supported query parameters include:

| Parameter | Purpose |
|---|---|
| `what` | Search keyword |
| `location` | UK postcode or location |
| `distance` | Search radius |
| `salary_min` | Minimum salary |
| `salary_max` | Maximum salary |
| `page` | Results page |
| `limit` | Results per page |

Example:

```http
GET /jobs?what=react&location=BN11&distance=25&page=1&limit=8
```

### `GET /commute`

Retrieves an estimated journey time.

| Parameter | Purpose |
|---|---|
| `originLat` | Origin latitude |
| `originLon` | Origin longitude |
| `destLat` | Destination latitude |
| `destLon` | Destination longitude |
| `mode` | `driving`, `walking`, `bicycling` or `transit` |

## Testing

Run the backend test suite from the `backend` directory:

```bash
npm test
```

## Key learnings

This project strengthened my understanding of:

- normalising inconsistent third-party API responses
- designing transparent recommendation logic
- separating source data from derived React state
- preserving state across several application views
- balancing cached data with fresh requests
- debugging asynchronous UI behaviour
- designing backend pagination for combined datasets
- testing logic as small, focused units
- deploying and connecting separate frontend and backend services

## Future improvements

Potential next steps include:

- user accounts and cloud-based saved jobs
- stronger salary normalisation
- improved remote-role classification
- map-based vacancy exploration
- filters for experience level and technology
- configurable match-score weighting
- more extensive API and interface tests
- clearer handling when an external provider is unavailable

## Author

**Joshua Bingham**  
Frontend & Full-Stack Developer

[Portfolio](https://joshbingham.dev/) · [GitHub](https://github.com/joshbingham) · [LinkedIn](https://www.linkedin.com/in/joshua-bingham-48961112b)
