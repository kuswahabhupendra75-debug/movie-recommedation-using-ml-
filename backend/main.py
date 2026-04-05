from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import csv
import os
import random
from pydantic import BaseModel
from typing import Optional, List

app = FastAPI()

# CORS setup - Most important for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

class RecommendRequest(BaseModel):
    movie_title: str
    n: Optional[int] = 10

class MovieResponse(BaseModel):
    title: str
    genres: str
    movieId: Optional[str] = None
    year: Optional[str] = None

# Global variable for movies
movies = []

def load_movies():
    global movies
    try:
        # Try multiple possible paths
        possible_paths = [
            'movies.csv',
            '../movies.csv',
            './data/movies.csv',
            '/opt/render/project/src/backend/movies.csv'
        ]
        
        csv_path = None
        for path in possible_paths:
            if os.path.exists(path):
                csv_path = path
                break
        
        if not csv_path:
            print("❌ CSV file not found in any path")
            return False
        
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            movies = []
            for row in reader:
                movies.append({
                    'title': row.get('title', ''),
                    'genres': row.get('genres', ''),
                    'movieId': row.get('movieId', ''),
                    'year': row.get('year', '')
                })
        
        print(f"✅ Loaded {len(movies)} movies from {csv_path}")
        return True
    except Exception as e:
        print(f"❌ Error loading movies: {e}")
        return False

# Load movies when server starts
@app.on_event("startup")
async def startup_event():
    load_movies()
    print("🚀 Server is ready!")

@app.get("/")
async def root():
    return {"message": "Movie Recommendation API is running!", "movies_loaded": len(movies)}

@app.get("/health")
async def health():
    return {
        "status": "healthy", 
        "movies_loaded": len(movies),
        "server": "running"
    }

@app.get("/movies")
async def get_movies():
    return movies[:100]

@app.get("/search/{query}")
async def search_movies(query: str):
    if not movies:
        return []
    
    results = []
    for m in movies:
        if query.lower() in m['title'].lower():
            results.append({
                'title': m['title'],
                'genres': m['genres']
            })
        if len(results) >= 10:
            break
    return results

@app.get("/recommend/{movie_title}")
async def recommend_movies(movie_title: str):
    if not movies:
        return JSONResponse(status_code=500, content={"error": "Movies not loaded"})
    
    # Find the movie
    movie = None
    for m in movies:
        if m['title'].lower() == movie_title.lower():
            movie = m
            break
    
    if not movie:
        return JSONResponse(status_code=404, content={"error": f"Movie '{movie_title}' not found"})
    
    # Genre-based recommendation
    movie_genres = movie.get('genres', '').lower()
    
    # Score each movie based on genre match
    scored = []
    for m in movies:
        if m['title'].lower() == movie_title.lower():
            continue
        
        score = 0
        if movie_genres and m.get('genres'):
            m_genres = m['genres'].lower()
            for g in movie_genres.split('|'):
                if g in m_genres:
                    score += 1
        
        scored.append((score, m))
    
    # Sort by score and get top 10
    scored.sort(reverse=True, key=lambda x: x[0])
    recommendations = [{'title': m['title'], 'genres': m['genres']} for score, m in scored[:10]]
    
    # If not enough, add random movies
    if len(recommendations) < 5:
        remaining = [{'title': m['title'], 'genres': m['genres']} for m in movies 
                    if m['title'].lower() != movie_title.lower() 
                    and {'title': m['title'], 'genres': m['genres']} not in recommendations]
        random.shuffle(remaining)
        recommendations.extend(remaining[:10-len(recommendations)])
    
    return {"movie": movie_title, "recommendations": recommendations}

@app.post("/recommend")
async def recommend_movies_post(request: RecommendRequest):
    return await recommend_movies(request.movie_title)

@app.get("/region/{region}")
async def get_by_region(region: str):
    # Map regions to internal genre search terms
    region_map = {
        'Bollywood': 'Hindi',
        'South Indian': 'South', # Assuming 'South' or similar in genres
        'Hollywood': 'English'
    }
    
    search_term = region_map.get(region, region)
    if not movies:
        return {"movies": []}
    
    results = []
    for m in movies:
        if search_term.lower() in m.get('genres', '').lower():
            results.append({
                'title': m['title'],
                'genres': m['genres'],
                'movieId': m.get('movieId')
            })
        if len(results) >= 20:
            break
    return {"movies": results}

@app.get("/popular")
async def get_popular():
    if not movies:
        return []
    return movies[:20]

@app.get("/genres/{genre}")
async def get_by_genre(genre: str):
    if not movies:
        return []
    
    results = []
    for m in movies:
        if genre.lower() in m.get('genres', '').lower():
            results.append({
                'title': m['title'],
                'genres': m['genres']
            })
        if len(results) >= 20:
            break
    return results