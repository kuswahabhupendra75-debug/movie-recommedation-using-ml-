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
    score: Optional[float] = 0.0
    explanation: Optional[str] = None

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
async def recommend_movies(movie_title: str, n: int = 10):
    if not movies:
        return JSONResponse(status_code=500, content={"error": "Movies not loaded"})
    
    # Find the movie
    base_movie = None
    for m in movies:
        if m['title'].lower() == movie_title.lower():
            base_movie = m
            break
    
    # If not found exactly, try substring match
    if not base_movie:
        for m in movies:
            if movie_title.lower() in m['title'].lower():
                base_movie = m
                break
    
    if not base_movie:
        return JSONResponse(status_code=404, content={"error": f"Movie '{movie_title}' not found"})
    
    # Genre and Region-based recommendation
    movie_genres = base_movie.get('genres', '').split('|')
    base_regions = [g.lower() for g in movie_genres if g.lower() in ['hindi', 'south-indian', 'hollywood']]
    
    # Score each movie
    scored = []
    for m in movies:
        if m['title'].lower() == movie_title.lower():
            continue
        
        matches = []
        if movie_genres and m.get('genres'):
            m_genres = m['genres'].split('|')
            m_regions = [g.lower() for g in m_genres if g.lower() in ['hindi', 'south-indian', 'hollywood']]
            
            for g in movie_genres:
                # Genres like Action, Comedy, etc.
                if g in m_genres:
                    matches.append(g)
            
            # Calculate Score
            score = len(matches) / len(movie_genres) if movie_genres else 0
            
            # LANGUAGE BOOST: If regions match, give a massive boost
            region_match = False
            for r in base_regions:
                if r in m_regions:
                    region_match = True
                    break
            
            if region_match:
                score += 2.0  # Ensure same region movies always appear first
            
        scored.append((score, matches, m))
    
    # Sort by score and get top n
    scored.sort(reverse=True, key=lambda x: x[0])
    recommendations = []
    for score, matches, m in scored[:n]:
        # Filter matches to remove the region tag from the UI tags
        clean_matches = [g for g in matches if g.lower() not in ['hindi', 'south-indian', 'hollywood']]
        expl = f"Matches: {', '.join(clean_matches)}" if clean_matches else "Recommended for you"
        recommendations.append({
            'title': m.get('title', ''),
            'genres': m.get('genres', ''),
            'movieId': m.get('movieId', ''),
            'year': m.get('year', ''),
            'score': min(1.0, score / 3.0) if score > 1.0 else round(score, 2),
            'explanation': expl
        })
    
    # If not enough, add random movies
    if len(recommendations) < 5:
        remaining = [m for m in movies 
                    if m['title'].lower() != movie_title.lower() 
                    and m['title'] not in [r['title'] for r in recommendations]]
        random.shuffle(remaining)
        for m in remaining[:n-len(recommendations)]:
            recommendations.append({
                'title': m.get('title', ''),
                'genres': m.get('genres', ''),
                'movieId': m.get('movieId', ''),
                'year': m.get('year', ''),
                'score': 0.1,
                'explanation': "Popular recommendation"
            })
    
    return {"movie": movie_title, "recommendations": recommendations}

@app.post("/recommend")
async def recommend_movies_post(request: RecommendRequest):
    return await recommend_movies(request.movie_title, n=request.n or 10)

@app.get("/region/{region}")
async def get_by_region(region: str):
    # Map regions to internal genre search terms
    region_map = {
        'Bollywood': 'Hindi',
        'South Indian': 'South-Indian',
        'Hollywood': 'Hollywood'
    }
    
    search_term = region_map.get(region, region).lower()
    if not movies:
        return {"movies": []}
    
    results = []
    for m in movies:
        if search_term in m.get('genres', '').lower():
            results.append({
                'title': m['title'],
                'genres': m['genres'],
                'movieId': m.get('movieId'),
                'year': m.get('year'),
                'score': 0.8,
                'explanation': f"Top pick in {region}"
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