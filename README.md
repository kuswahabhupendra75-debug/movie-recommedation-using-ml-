# 🎬 CineHybrid: Next-Gen Movie Recommendation System

## 📖 Introduction
Welcome to **CineHybrid**, a full-stack, production-ready movie recommendation system. 
This project was born out of a desire to create a modern, zero-latency recommendation engine that doesn't just suggest movies but provides a seamless, immersive experience. It bridges the gap between state-of-the-art Machine Learning models and a sleek, user-friendly interface.

## 🚀 Why was this built? (The "Kyu" & "Kis Liye")
Most movie recommendation tutorials or engines out there are either too slow, have outdated data, or lack a premium frontend. The core goals for building CineHybrid were:
1. **Solve Cold-Start Issues:** Free hosting services (like Render) often put idle backends to sleep. I built a robust "keep-alive" mechanism (via GitHub Actions) and a queueing system so users never face a broken app during these cold starts.
2. **Real-time Trending Data:** Integrated the latest 2024-2026 movie catalogs with authentic IMDb ratings to keep the system relevant.
3. **Hybrid Recommendations:** Combined advanced ML techniques (CineHybrid V3.0) to give highly accurate and personalized movie suggestions based on user input.
4. **Premium UI/UX:** Provided users with a dynamic, sleek, and responsive experience that feels like a top-tier premium streaming service instead of a basic MVP.

## 🕰️ When and How? (The "Kab" & "Kaise")
This project was developed through multiple intensive iterations, focusing heavily on bridging backend ML logic with frontend performance:
- **Phase 1 (The Core ML):** Built the core recommendation engine using Python, Pandas, and Scikit-learn. Processed massive CSV datasets to extract features and compute similarities.
- **Phase 2 (The API):** Developed a fast REST API using Python to serve these machine learning recommendations instantly to the client.
- **Phase 3 (The Frontend):** Designed a responsive React-based interface (via Vite), complete with region-based trending tabs, search logic, and sleek animations.
- **Phase 4 (Production & Optimization):** Deployed the frontend to Vercel and the backend to Render. Implemented automated GitHub Actions for 24/7 "keep-alive" cron jobs to ensure zero-latency.

## ✨ Key Features (Kya Kiya)
- **Zero-Latency Architecture:** Employs clever frontend data-merging strategies and fallback mechanisms to ensure the UI is always loaded, even when the API is waking up.
- **CineHybrid v3.0 Engine:** Tailored recommendations using a sophisticated hybrid algorithm.
- **Live Regional Data:** Region tabs that always show trending movies with correct localized information.
- **Automated Workflow:** Uses GitHub Action cron jobs to prevent backend sleep (bypassing the Render 15-minute idle limit).
- **Production Grade:** Resolved deployment errors, path resolutions, and environment variables across multiple hosting platforms.

## 🛠️ Tech Stack & Architecture
- **Frontend:** React.js, Vite, JavaScript, CSS (`vercel.json` configured for Vercel deployment)
- **Backend:** Python, API configuration (`render.yaml` configured for Render deployment)
- **Data ML:** Scikit-Learn, Pandas (handling CSV dataset logic)
- **CI/CD & DevOps:** GitHub Actions (Keep-alive backend scripts)

## 💻 Local Development Setup

Want to run this massive project locally? Here is how:

### 1. Backend (The Engine)
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

pip install -r requirements.txt
python main.py
```

### 2. Frontend (The Interface)
```bash
cd frontend
npm install
npm run dev
```

## 📈 What I Achieved
Through building CineHybrid, I successfully dealt with production-level bugs (like CSS Vite builds, backend CSV path resolution, rendering cold-starts), learned how to write CRON workflows in GitHub, and seamlessly managed a detached frontend-backend architecture scaling across Vercel and Render. This is a complete, portfolio-ready product.
