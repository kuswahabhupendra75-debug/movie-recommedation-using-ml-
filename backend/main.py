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

# Global variables
movies = []
ratings_stats = {}  # movieId -> {"avg": float, "votes": int}

def load_ratings():
    global ratings_stats
    try:
        csv_path = 'data/ratings.csv' if os.path.exists('data/ratings.csv') else '../data/ratings.csv'
        if not os.path.exists(csv_path):
            print(f"⚠️ Ratings not found at {csv_path}")
            return
        
        sums = {}
        counts = {}
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                mid = row.get('movieId')
                rat = float(row.get('rating', 0))
                sums[mid] = sums.get(mid, 0) + rat
                counts[mid] = counts.get(mid, 0) + 1
        
        for mid in sums:
            # We normalize the score out of 5.0
            avg = sums[mid] / counts[mid]
            ratings_stats[mid] = {"avg": round(avg, 2), "votes": counts[mid]}
        
        print(f"✅ Pre-calculated ratings for {len(ratings_stats)} movies")
    except Exception as e:
        print(f"❌ Error loading ratings: {e}")

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
                mid = row.get('movieId', '')
                m = {
                    'title': row.get('title', ''),
                    'genres': row.get('genres', ''),
                    'movieId': mid,
                    'year': ""
                }
                
                # Add year and region
                m['year'] = re.findall(r'\((\d{4})\)', m.get('title', ''))
                m['year'] = m['year'][-1] if m['year'] else ""
                
                # Check for region strings
                genres_lower = m['genres'].lower()
                if 'south-indian' in genres_lower:
                    m['region'] = 'south-indian'
                elif 'hindi' in genres_lower:
                    m['region'] = 'hindi'
                elif 'hollywood' in genres_lower or int(mid or 0) < 200000:
                    m['region'] = 'hollywood'
                else:
                    m['region'] = 'unknown'
                
                movies.append(m)
        
        print(f"✅ Loaded {len(movies)} movies from {csv_path}")
        return True
    except Exception as e:
        print(f"❌ Error loading movies: {e}")
        return False
        
import re

# Load data when server starts
@app.on_event("startup")
async def startup_event():
    load_ratings()
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
    
    # Hybrid scoring logic (50/50 Content + Collaborative)
    base_genres = set(base_movie.get('genres', '').split('|'))
    base_region = base_movie.get('region', 'unknown')
    
    scored = []
    for m in movies:
        if m['title'].lower() == movie_title.lower():
            continue
        
        # STRICT REGION FILTER: 100% Accurate Language Separation
        if base_region != 'unknown' and m.get('region') != 'unknown':
            if m.get('region') != base_region:
                continue
        
        # Part 1: Content Similarity (Genre overlap)
        m_genres = set(m.get('genres', '').split('|'))
        matches = base_genres.intersection(m_genres)
        # Filter out region tags from "matching genres" for cleaner explanation
        clean_matches = [g for g in matches if g.lower() not in ['hindi', 'south-indian', 'hollywood']]
        
        content_score = len(matches) / len(base_genres) if base_genres else 0
        
        # Part 2: Collaborative/Popularity Score (Average Rating)
        m_id = m.get('movieId', '')
        stats = ratings_stats.get(m_id, {"avg": 3.0, "votes": 0})
        # Normalize rating (0-5) to 0-1 scale
        collab_score = stats['avg'] / 5.0
        
        # Weighted Final Score (50-50 Hybrid)
        final_score = (0.5 * content_score) + (0.5 * collab_score)
        
        scored.append((final_score, clean_matches, stats['avg'], m))
    
    # Sort and return top n
    scored.sort(reverse=True, key=lambda x: x[0])
    recommendations = []
    for score, matches, avg_rating, m in scored[:n]:
        expl = f"Hybrid Result: {len(matches)} matching genres + High Rating ({avg_rating}★)"
        recommendations.append({
            'title': m.get('title', ''),
            'genres': m.get('genres', ''),
            'movieId': m.get('movieId', ''),
            'year': m.get('year', ''),
            'score': round(score, 2),
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