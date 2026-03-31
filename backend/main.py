import sys
import os

# Ensure the project root is in path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import uvicorn

from ml_engine.download_data import download_movielens
from ml_engine.preprocessor import load_data
from ml_engine.hybrid_engine import HybridEngine
from ml_engine.evaluator import calculate_rmse

# -----------------------------------------------------------------------
app = FastAPI(
    title="Hybrid Movie Recommender API",
    description="Research paper: Bhupendra Sinh Rajgopal Kushwaha (March 2026)",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global singletons (loaded once at startup)
engine: HybridEngine = None
metrics_cache: dict = None


# -----------------------------------------------------------------------
# Startup
# -----------------------------------------------------------------------
@app.on_event("startup")
async def startup_event():
    global engine, metrics_cache

    print("\n🚀  Hybrid Movie Recommender — starting up…\n")

    # 1. Download dataset if missing
    download_movielens()

    # 2. Load & preprocess data
    movies, ratings = load_data()
    print(f"📦  Loaded {len(movies)} movies | {len(ratings)} ratings\n")

    # 3. Build recommendation engines
    engine = HybridEngine(movies, ratings)

    # 4. Compute RMSE metrics (background — small dataset so it's fast)
    print("📊  Computing RMSE metrics…")
    metrics_cache = calculate_rmse(ratings)
    print(f"    RMSE = {metrics_cache['rmse']}\n")

    print("🎉  API ready at http://localhost:8000\n")


# -----------------------------------------------------------------------
# Request / Response models
# -----------------------------------------------------------------------
class RecommendRequest(BaseModel):
    movie_title: str = Field(..., example="Toy Story")
    user_id: Optional[int] = Field(None, example=1, description="MovieLens user ID (1-610). Omit for cold-start.")
    alpha: float = Field(0.5, ge=0.0, le=1.0, description="Content weight (0-1)")
    beta: float = Field(0.5, ge=0.0, le=1.0, description="Collaborative weight (0-1)")
    n: int = Field(10, ge=1, le=50, description="Number of recommendations")


# -----------------------------------------------------------------------
# Endpoints
# -----------------------------------------------------------------------
@app.get("/", tags=["Status"])
def root():
    return {
        "status": "ok",
        "message": "Hybrid Movie Recommender API — ready!",
        "endpoints": ["/movies", "/search", "/recommend", "/metrics"],
    }


@app.get("/movies", tags=["Data"])
def get_all_movies():
    """Return all available movies (for autocomplete pre-loading)."""
    _require_engine()
    return engine.get_all_movies()


@app.get("/search", tags=["Data"])
def search_movies(
    q: str = Query(..., min_length=1, description="Partial movie title"),
    limit: int = Query(10, ge=1, le=50),
    region: str = Query(None, description="Filter by region: Bollywood, South Indian, Hollywood"),
):
    """Real-time title search with partial matching and optional region filter."""
    _require_engine()
    results = engine.search_movies(q, limit, region=region)
    return {"query": q, "results": results, "count": len(results)}


@app.post("/recommend", tags=["Recommendation"])
def recommend(req: RecommendRequest):
    """
    Core endpoint — returns top-N hybrid recommendations.

    Hybrid Score = (α × Content_Score) + (β × Collaborative_Score)
    Cold Start:  if user_id is absent or has < 5 ratings → α=1, β=0
    """
    _require_engine()

    results = engine.get_hybrid_recommendations(
        movie_title=req.movie_title,
        user_id=req.user_id,
        alpha=req.alpha,
        beta=req.beta,
        n=req.n,
    )

    if not results:
        raise HTTPException(
            status_code=404,
            detail={
                "error": "Movie not found",
                "message": f"'{req.movie_title}' was not found in the MovieLens dataset. "
                           "Please check the spelling or use /search to find the exact title.",
                "suggestion": "Try searching: /search?q=toy",
            },
        )

    return {
        "query": req.movie_title,
        "user_id": req.user_id,
        "alpha": req.alpha,
        "beta": req.beta,
        "recommendations": results,
        "count": len(results),
    }


@app.get("/metrics", tags=["Evaluation"])
def get_metrics():
    """Return RMSE, dataset statistics, and accuracy metrics."""
    if metrics_cache is None:
        raise HTTPException(status_code=503, detail="Metrics not yet computed. Server is still starting.")
    return metrics_cache


@app.get("/region/{region_name}", tags=["Data"])
def get_by_region(region_name: str, limit: int = Query(50, ge=1, le=200)):
    """
    Return movies filtered by region.
    region_name: Bollywood | South Indian | Hollywood
    """
    _require_engine()
    valid = ["Bollywood", "South Indian", "Hollywood"]
    if region_name not in valid:
        raise HTTPException(status_code=400, detail=f"region must be one of {valid}")
    movies = engine.get_movies_by_region(region_name, limit)
    return {"region": region_name, "movies": movies, "count": len(movies)}


# -----------------------------------------------------------------------
# Helper
# -----------------------------------------------------------------------
def _require_engine():
    if engine is None:
        raise HTTPException(status_code=503, detail="Recommendation engine not yet loaded.")


# -----------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
