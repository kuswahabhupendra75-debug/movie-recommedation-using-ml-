from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import csv
import os

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
movie_titles = []
movie_genres = []

def load_movies():
    global movies, movie_titles, movie_genres
    try:
        # Check if CSV exists
        csv_path = 'movies.csv'
        if not os.path.exists(csv_path):
            print(f"❌ CSV file not found at {csv_path}")
            return False
            
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                movies.append(row)
                movie_titles.append(row.get('title', ''))
                movie_genres.append(row.get('genres', ''))
        
        print(f"✅ Loaded {len(movies)} movies")
        return True
    except Exception as e:
        print(f"❌ Error loading movies: {e}")
        return False

def build_recommendation_engine():
    global cosine_sim, indices
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        
        tfidf = TfidfVectorizer(stop_words='english')
        tfidf_matrix = tfidf.fit_transform(movie_genres)
        cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
        
        global indices
        indices = {movie['title'].lower(): idx for idx, movie in enumerate(movies)}
        
        print("✅ Recommendation engine built!")
        return True
    except Exception as e:
        print(f"❌ Error building engine: {e}")
        return False

# Load on startup
@app.on_event("startup")
async def startup_event():
    if load_movies():
        build_recommendation_engine()

@app.get("/")
async def root():
    return {"message": "Movie Recommendation API", "movies": len(movies)}

@app.get("/movies")
async def get_movies():
    return [{"title": m.get('title', ''), "genres": m.get('genres', '')} for m in movies[:100]]

@app.get("/search/{query}")
async def search_movies(query: str):
    results = [m for m in movies if query.lower() in m.get('title', '').lower()]
    return [{"title": m.get('title', ''), "genres": m.get('genres', '')} for m in results[:10]]

@app.get("/recommend/{movie_title}")
async def recommend_movies(movie_title: str):
    try:
        from sklearn.metrics.pairwise import cosine_similarity
        
        movie_title_lower = movie_title.lower()
        if movie_title_lower not in indices:
            return JSONResponse(status_code=404, content={"error": f"Movie '{movie_title}' not found"})
        
        idx = indices[movie_title_lower]
        sim_scores = list(enumerate(cosine_sim[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
        sim_scores = sim_scores[1:11]
        
        recommendations = []
        for i in sim_scores:
            recommendations.append({
                "title": movies[i[0]].get('title', ''),
                "genres": movies[i[0]].get('genres', '')
            })
        
        return {"movie": movie_title, "recommendations": recommendations}
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "movies_loaded": len(movies),
        "csv_exists": os.path.exists('movies.csv')
    }