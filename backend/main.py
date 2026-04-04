from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import csv
import os
import random

app = FastAPI()

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables
movies = []

def load_movies():
    global movies
    try:
        csv_path = 'movies.csv'
        if not os.path.exists(csv_path):
            print(f"❌ CSV file not found at {csv_path}")
            return False
            
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                movies.append({
                    'title': row.get('title', ''),
                    'genres': row.get('genres', '')
                })
        
        print(f"✅ Loaded {len(movies)} movies")
        return True
    except Exception as e:
        print(f"❌ Error loading movies: {e}")
        return False

@app.on_event("startup")
async def startup_event():
    load_movies()

@app.get("/")
async def root():
    return {"message": "Movie Recommendation API", "movies": len(movies)}

@app.get("/movies")
async def get_movies():
    return movies[:100]

@app.get("/search/{query}")
async def search_movies(query: str):
    results = [m for m in movies if query.lower() in m['title'].lower()]
    return results[:10]

@app.get("/recommend/{movie_title}")
async def recommend_movies(movie_title: str):
    # Simple genre-based recommendation
    movie = next((m for m in movies if m['title'].lower() == movie_title.lower()), None)
    
    if not movie:
        return JSONResponse(status_code=404, content={"error": f"Movie '{movie_title}' not found"})
    
    # Find movies with same genre
    genres = movie['genres'].split('|')
    recommendations = []
    
    for m in movies:
        if m['title'].lower() != movie_title.lower():
            m_genres = m['genres'].split('|')
            if any(g in m_genres for g in genres):
                recommendations.append(m)
            if len(recommendations) >= 10:
                break
    
    # If not enough recommendations, add random movies
    if len(recommendations) < 5:
        remaining = [m for m in movies if m not in recommendations and m['title'].lower() != movie_title.lower()]
        recommendations.extend(random.sample(remaining, min(10 - len(recommendations), len(remaining))))
    
    return {"movie": movie_title, "recommendations": recommendations[:10]}

@app.get("/popular")
async def get_popular():
    return movies[:20]

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "movies_loaded": len(movies),
        "csv_exists": os.path.exists('movies.csv')
    }