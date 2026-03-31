import numpy as np
import pandas as pd
from typing import List, Dict, Optional

from .content_engine import ContentEngine
from .collab_engine import CollabEngine


class HybridEngine:
    """
    Hybrid Movie Recommendation Engine.
    Combines Content-Based (TF-IDF genres) and Collaborative Filtering
    (Item-Item cosine similarity) via weighted fusion.

    Weighted Hybrid Score:
        Hybrid_Score = (α × Content_Score) + (β × Collaborative_Score)

    Cold Start: if user has < 5 ratings → α=1.0, β=0.0 (pure content-based)
    """

    COLD_START_THRESHOLD = 5

    def __init__(self, movies: pd.DataFrame, ratings: pd.DataFrame):
        self.movies = movies.reset_index(drop=True)
        self.ratings = ratings

        # Title → movieId lookup (lowercase)
        self.title_to_id: Dict[str, int] = {
            row["title"].lower().strip(): int(row["movieId"])
            for _, row in self.movies.iterrows()
        }
        self.id_to_movie: Dict[int, pd.Series] = {
            int(row["movieId"]): row for _, row in self.movies.iterrows()
        }

        print("🎬 Building Content Engine…")
        self.content_engine = ContentEngine(self.movies)

        print("👥 Building Collaborative Engine…")
        self.collab_engine = CollabEngine(self.ratings, self.movies)

        print("✅ Hybrid Engine ready!\n")

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def find_movie_id(self, title: str) -> Optional[int]:
        """Fuzzy title lookup — exact → startswith → substring."""
        key = title.lower().strip()

        if key in self.title_to_id:
            return self.title_to_id[key]

        # Remove year suffix for matching  e.g. "Toy Story (1995)" → "toy story"
        base = key.split("(")[0].strip()
        for stored_key, mid in self.title_to_id.items():
            stored_base = stored_key.split("(")[0].strip()
            if base == stored_base or stored_base.startswith(base):
                return mid

        # Substring fallback
        for stored_key, mid in self.title_to_id.items():
            if key in stored_key:
                return mid

        return None

    def get_hybrid_recommendations(
        self,
        movie_title: str,
        user_id: Optional[int] = None,
        alpha: float = 0.5,
        beta: float = 0.5,
        n: int = 10,
    ) -> List[Dict]:

        movie_id = self.find_movie_id(movie_title)
        if movie_id is None:
            return []

        # ---- Cold Start Logic ----------------------------------------
        is_cold_start = False
        user_genres: List[str] = []

        if user_id is not None:
            rating_count = self.collab_engine.get_user_rating_count(user_id)
            if rating_count < self.COLD_START_THRESHOLD:
                alpha, beta = 1.0, 0.0
                is_cold_start = True
            else:
                user_genres = self.collab_engine.get_user_top_genres(
                    user_id, self.movies
                )
        else:
            alpha, beta = 1.0, 0.0
            is_cold_start = True

        # Normalise weights
        total = alpha + beta if (alpha + beta) > 0 else 1.0
        alpha /= total
        beta /= total

        # ---- Scores --------------------------------------------------
        content_scores = self.content_engine.get_scores(movie_id)
        collab_scores = self.collab_engine.get_scores(movie_id)

        input_idx = self.content_engine.movie_id_to_idx.get(int(movie_id))

        # ---- Fuse & Rank ---------------------------------------------
        recommendations: List[Dict] = []

        for i, row in self.movies.iterrows():
            mid = int(row["movieId"])
            if mid == movie_id:
                continue

            c_score = float(content_scores[i])
            cf_score = float(collab_scores.get(mid, 0.0))
            hybrid_score = (alpha * c_score) + (beta * cf_score)

            # Build explanation
            explanation = self._build_explanation(
                row, c_score, cf_score, user_genres, is_cold_start, alpha, beta
            )

            recommendations.append(
                {
                    "movieId": mid,
                    "title": row["title"],
                    "genres": row["genres"],
                    "region": row.get("region", "Hollywood"),
                    "content_score": round(c_score, 4),
                    "collab_score": round(cf_score, 4),
                    "hybrid_score": round(hybrid_score, 4),
                    "alpha": round(alpha, 2),
                    "beta": round(beta, 2),
                    "is_cold_start": is_cold_start,
                    "explanation": explanation,
                }
            )

        recommendations.sort(key=lambda x: x["hybrid_score"], reverse=True)
        return recommendations[:n]

    def search_movies(self, query: str, limit: int = 15, region: str = None) -> List[Dict]:
        """Search movies by partial title match with optional region filter."""
        query_lower = query.lower().strip()
        results = []
        for _, row in self.movies.iterrows():
            if query_lower in row["title"].lower():
                row_region = row.get("region", "Hollywood")
                if region and row_region != region:
                    continue
                results.append(
                    {
                        "movieId": int(row["movieId"]),
                        "title": row["title"],
                        "genres": row["genres"],
                        "region": row_region,
                    }
                )
            if len(results) >= limit:
                break
        return results

    def get_all_movies(self) -> List[Dict]:
        return [
            {
                "movieId": int(row["movieId"]),
                "title": row["title"],
                "genres": row["genres"],
                "region": row.get("region", "Hollywood"),
            }
            for _, row in self.movies.iterrows()
        ]

    def get_movies_by_region(self, region: str, limit: int = 50) -> List[Dict]:
        """Return top movies for a given region (Bollywood / South Indian / Hollywood)."""
        filtered = self.movies[self.movies.get("region", "Hollywood") == region] if "region" in self.movies.columns else self.movies
        filtered = self.movies[self.movies["region"] == region] if "region" in self.movies.columns else self.movies
        results = [
            {
                "movieId": int(row["movieId"]),
                "title": row["title"],
                "genres": row["genres"],
                "region": row.get("region", "Hollywood"),
            }
            for _, row in filtered.head(limit).iterrows()
        ]
        return results

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _build_explanation(
        self,
        movie_row: pd.Series,
        c_score: float,
        cf_score: float,
        user_genres: List[str],
        is_cold_start: bool,
        alpha: float,
        beta: float,
    ) -> str:
        genres = movie_row["genres"].replace("|", ", ")

        if is_cold_start:
            return (
                f"Recommended because it shares similar genres ({genres}) "
                "with your search. (Content-Based — no user history)"
            )

        parts = []
        if alpha > 0 and c_score > 0.1:
            parts.append(f"shares genres ({genres}) with your search")
        if beta > 0 and cf_score > 0.1:
            if user_genres:
                parts.append(
                    f"users who enjoyed {', '.join(user_genres)} movies also liked this"
                )
            else:
                parts.append("users similar to you enjoyed this")

        if parts:
            return "Recommended because it " + " and ".join(parts) + "."
        return f"Matched via Hybrid Score (α={alpha:.0%} Content, β={beta:.0%} Collab)."
