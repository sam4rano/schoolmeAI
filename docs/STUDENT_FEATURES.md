# Student Features Guide

This document outlines all the features and capabilities available to students in EduRepo-NG-AI.

---

## 🎓 Overview

EduRepo-NG-AI provides comprehensive tools and resources to help Nigerian students make informed admission decisions. Students can browse institutions, calculate eligibility, get AI-powered recommendations, and track their admission journey.

---

## 📋 Available Features

### 1. **Browse Institutions** (`/institutions`)

**What students can do:**
- Browse all 1,135 Nigerian higher institutions
- Search institutions by name
- Filter by:
  - **Type:** University, Polytechnic, College, Nursing School, Military
  - **Ownership:** Federal, State, Private
  - **State:** All 36 states + FCT
- View institution details:
  - Name, type, ownership
  - Location (state, city)
  - Website (if available)
  - Accreditation status
  - Data quality score
  - Tuition fees (if available)
- Access institution pages with full details

**Features:**
- Pagination (12 institutions per page)
- Real-time search
- Responsive design (mobile-friendly)

---

### 2. **Browse Programs** (`/programs`)

**What students can do:**
- Browse all 3,050 programs across Nigerian institutions
- Search programs by institution name
- Filter by:
  - **Course:** Select specific courses (e.g., Medicine, Computer Science)
  - **Degree Type:** BSc, BA, BEng, MBBS, ND, HND, etc.
  - **Institution:** Filter by specific institution
- View program details:
  - Program name and institution
  - Degree type and duration
  - Faculty/department
  - UTME and O-level subject requirements
  - Latest cutoff scores
  - Application deadlines
  - Tuition fees (if available)
- Rank programs by difficulty when filtering by course

**Features:**
- Pagination (18 programs per page)
- Course-based ranking (most competitive to least)
- Real-time search
- Direct links to calculator and program details

---

### 3. **Eligibility Calculator** (`/calculator`)

**What students can do:**
- Calculate admission probability for specific programs
- Enter:
  - **UTME Score** (0-400)
  - **O-level Grades** (A1, B2, B3, C4, C5, C6, D7, E8, F9)
  - **Program** (search and select)
  - **Post-UTME Score** (optional)
- View results:
  - **Composite Score** (calculated from UTME + O-level)
  - **Admission Probability** (0-100%)
  - **Category:** Safe, Target, or Reach
  - **Confidence Interval** (±15%)
  - **Rationale** (explanation of calculation)
  - **Data Quality** (confidence level, historical data years)

**Additional Features:**
- **Calculation History:** Save and view past calculations (stored in browser)
- **What-If Scenarios:** Explore different score combinations
- **Comparison:** Compare eligibility across multiple programs
- **Export:** Export calculation history as CSV

**How it works:**
1. Enter UTME score and O-level grades
2. Select a program (optional)
3. Click "Calculate Eligibility"
4. View detailed results with probability and rationale

---

### 4. **Program Recommendations** (`/recommendations`)

**What students can do:**
- Get personalized program recommendations based on scores
- Enter:
  - **UTME Score** (0-400)
  - **O-level Grades**
  - **State of Origin** (optional)
  - **Post-UTME Score** (optional)
- Receive recommendations:
  - **Top 10-50 programs** ranked by suitability
  - **Categorized as:** Safe, Target, or Reach
  - **Accreditation Status** with warnings
  - **Admission Probability** for each program
  - **Composite Score** comparison

**Filtering Options:**
- Filter by state
- Filter by institution type
- Filter by category (safe/target/reach)
- Filter by minimum probability

**Additional Features:**
- **Export:** Export recommendations as CSV
- **Share:** Share recommendations via link
- **Copy Link:** Copy recommendation link to clipboard
- **Ranking Explanation:** View how ranking works

**How it works:**
1. Enter UTME score and O-level grades
2. Click "Get Recommendations"
3. View ranked list of suitable programs
4. Filter and explore recommendations
5. Export or share results

---

### 5. **AI Assistant** (`/ai`)

**What students can do:**
- Ask questions about institutions, programs, and admissions
- Get AI-powered answers with:
  - **Contextual responses** based on database
  - **Source citations** [1], [2], etc.
  - **Clickable links** to institutions/programs
  - **Personalized guidance** based on scores (if provided)

**Example Questions:**
- "What are the best universities in Lagos?"
- "What programs can I apply for with 240 UTME score?"
- "What are the admission requirements for Medicine?"
- "Which universities offer Computer Science?"
- "What is the cutoff mark for Law at UNILAG?"

**Features:**
- **Guest Mode:** Limited access (5 messages) without sign-in
- **Full Access:** Unlimited messages with sign-in
- **Conversation History:** Save and manage conversations (signed-in users)
- **Export Conversations:** Export chat history as JSON
- **Suggested Questions:** Quick-start questions
- **Context Awareness:** AI remembers conversation history

**How it works:**
1. Type your question
2. AI searches database for relevant information
3. Generates contextual answer with sources
4. View answer with citations and links

---

### 6. **Analytics** (`/analytics`)

**What students can do:**
- View comprehensive analytics and trends
- **Database Statistics:**
  - Total institutions and programs
  - Institutions by type and ownership
  - Programs by degree type
- **Trend Analysis:**
  - Historical cutoff trends
  - Admission pattern visualization
  - Predictive insights
- **Data Visualization:**
  - Bar charts for trends
  - Statistics breakdowns
  - Exportable data

**Features:**
- Real-time statistics
- Historical data visualization
- Trend predictions
- Export capabilities

---

### 7. **Watchlist** (`/watchlist`) - **Requires Sign-In**

**What students can do:**
- Track programs of interest
- Add programs to watchlist with priority (High, Medium, Low)
- View tracked programs with:
  - Program and institution details
  - Application deadlines
  - Days remaining
  - Priority level
- Manage watchlist:
  - Add/remove programs
  - Update priorities
  - Compare programs (up to 5)
  - Export watchlist as CSV

**Features:**
- Deadline tracking with urgency indicators
- Priority management
- Program comparison
- Export functionality

---

### 8. **Program Comparison** (`/comparison`)

**What students can do:**
- Compare up to 5 programs side-by-side
- Compare attributes:
  - Institution details
  - Degree type and duration
  - Faculty/department
  - UTME and O-level requirements
  - Latest cutoff scores
  - Tuition fees
  - Application deadlines
- Share comparison via link

**Features:**
- Side-by-side comparison table
- Shareable comparison links
- Direct links to program details and calculator

---

### 9. **Dashboard** (`/dashboard`) - **Requires Sign-In**

**What students can do:**
- View personalized admission journey overview
- Quick access to:
  - **My Watchlist:** Tracked programs
  - **Recent Calculations:** Eligibility calculations
  - **AI Recommendations:** Get personalized recommendations
  - **My Profile:** Account information

**Features:**
- Personalized dashboard
- Quick navigation to key features
- Admission journey tracking

---

### 10. **Community** (`/community`)

**What students can do:**
- **Forums:** Participate in discussions
- **Q&A:** Ask and answer questions
- **Stories:** Share admission experiences
- **Engage:** Connect with other students

**Features:**
- Community discussions
- Peer support
- Experience sharing
- Knowledge sharing

---

## 🔐 Authentication

### Guest Access
- **Limited Features:**
  - Browse institutions and programs
  - Use calculator (results not saved)
  - AI Assistant (5 messages limit)
  - View analytics
- **No Access:**
  - Watchlist
  - Dashboard
  - Conversation history
  - Unlimited AI messages

### Signed-In Access
- **Full Features:**
  - All guest features
  - Watchlist management
  - Dashboard access
  - Unlimited AI messages
  - Conversation history
  - Saved calculations
  - Profile management

---

## 📊 Data Available

### Institutions
- **1,135 institutions** across Nigeria
- **Types:** Universities, Polytechnics, Colleges, Nursing Schools, Military
- **Ownership:** Federal, State, Private
- **Accreditation:** 98.3% accredited
- **Data Quality:** Quality scores for each institution

### Programs
- **3,050 programs** across all institutions
- **Accreditation:** 100% with accreditation status
- **Cutoff History:** Historical admission cutoffs
- **Requirements:** UTME and O-level subject requirements
- **Deadlines:** Application deadlines (when available)
- **Fees:** Tuition fees (when available)

---

## 🎯 Use Cases

### 1. **Finding Suitable Programs**
- Use **Recommendations** to find programs matching your scores
- Browse **Programs** to explore options
- Use **AI Assistant** to ask specific questions

### 2. **Checking Eligibility**
- Use **Calculator** to check admission probability for specific programs
- Compare eligibility across multiple programs
- Explore "what-if" scenarios with different scores

### 3. **Researching Institutions**
- Browse **Institutions** to find schools
- Filter by location, type, and ownership
- View institution details and accreditation status

### 4. **Tracking Applications**
- Add programs to **Watchlist** to track deadlines
- Set priorities for programs
- Compare programs side-by-side

### 5. **Getting Guidance**
- Use **AI Assistant** for personalized advice
- Ask questions about requirements, cutoffs, and programs
- Get recommendations based on your scores

### 6. **Analyzing Trends**
- View **Analytics** for historical data
- Understand admission trends
- Make data-driven decisions

---

## 🚀 Getting Started

### For New Students

1. **Explore Homepage** (`/`)
   - Learn about features
   - View statistics
   - Access quick links

2. **Browse Programs** (`/programs`)
   - Explore available programs
   - Filter by course or institution
   - View program details

3. **Calculate Eligibility** (`/calculator`)
   - Enter your scores
   - Select a program
   - View admission probability

4. **Get Recommendations** (`/recommendations`)
   - Enter your scores
   - Get personalized recommendations
   - Filter and explore options

5. **Sign In** (Optional but Recommended)
   - Create account for full access
   - Save watchlist and calculations
   - Access unlimited AI messages

---

## 💡 Tips for Students

1. **Start with Recommendations**
   - Get a broad view of suitable programs
   - Use filters to narrow down options

2. **Use Calculator for Specific Programs**
   - Check eligibility for programs you're interested in
   - Compare probabilities across programs

3. **Track Programs in Watchlist**
   - Add programs you're considering
   - Set priorities (High, Medium, Low)
   - Monitor deadlines

4. **Ask AI Assistant Questions**
   - Get quick answers about requirements
   - Ask about specific programs or institutions
   - Get personalized guidance

5. **Compare Programs**
   - Use comparison tool to evaluate options
   - Compare cutoffs, fees, and requirements
   - Make informed decisions

6. **Check Analytics**
   - Understand admission trends
   - View historical data
   - Make data-driven choices

---

## 📱 Mobile-Friendly

All features are fully responsive and work on:
- **Desktop:** Full-featured experience
- **Tablet:** Optimized layout
- **Mobile:** Touch-friendly interface

---

## 🔗 Quick Links

- **Home:** `/`
- **Institutions:** `/institutions`
- **Programs:** `/programs`
- **Calculator:** `/calculator`
- **Recommendations:** `/recommendations`
- **AI Assistant:** `/ai`
- **Analytics:** `/analytics`
- **Watchlist:** `/watchlist` (requires sign-in)
- **Dashboard:** `/dashboard` (requires sign-in)
- **Comparison:** `/comparison`
- **Community:** `/community`

---

## 📚 See Also

- [HOW_IT_WORKS.md](./HOW_IT_WORKS.md) - Technical details
- [README.md](../README.md) - Project overview
- [ACCREDITATION.md](./ACCREDITATION.md) - Accreditation information

