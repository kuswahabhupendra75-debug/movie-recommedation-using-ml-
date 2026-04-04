import numpy as np
import pandas as pd
from typing import List, Dict, Optional

from .content_engine import ContentEngine


class HybridEngine:
    """
    Content-Based Movie Recommendation Engine.
    Uses TF-IDF on movie genres to find similar films.
    """

    def __init__(self, movies: pd.DataFrame):
        self.movies = movies.reset_index(drop=True)

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

        print("✅ engine ready!\n")

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

    def get_recommendations(
        self,
        movie_title: str,
        n: int = 10,
    ) -> List[Dict]:

        movie_id = self.find_movie_id(movie_title)
        if movie_id is None:
            return []

        # ---- Scores --------------------------------------------------
        content_scores = self.content_engine.get_scores(movie_id)

        # ---- Region-aware filtering -----------------------------------
        input_movie = self.id_to_movie.get(int(movie_id))
        input_region = input_movie.get("region", "Hollywood") if input_movie is not None else "Hollywood"

        # ---- Rank ----------------------------------------------------
        recommendations: List[Dict] = []

        for i, row in self.movies.iterrows():
            mid = int(row["movieId"])
            if mid == movie_id:
                continue

            # Region filter: only recommend movies from the same region
            movie_region = row.get("region", "Hollywood")
            if movie_region != input_region:
                continue

            score = float(content_scores[i])

            recommendations.append(
                {
                    "movieId": mid,
                    "title": row["title"],
                    "genres": row["genres"],
                    "region": movie_region,
                    "score": round(score, 4),
                    "explanation": f"Recommended because it shares similar genres ({row['genres'].replace('|', ', ')}) with your search.",
                }
            )

        recommendations.sort(key=lambda x: x["score"], reverse=True)
        return recommendations[:n]

    def search_movies(self, query: str, limit: int = 15, region: str = None) -> List[Dict]:
        """Search movies by partial title match with optional region filter."""
        query_lower = query.lower().strip()
        
        # Intercept keywords for implicit region search
        if not region:
            if any(k in query_lower for k in ["hindi", "bollywood"]):
                region = "Bollywood"
                query_lower = query_lower.replace("hindi", "").replace("bollywood", "").replace("movies", "").replace("movie", "").replace("film", "").replace("films", "").strip()
            elif any(k in query_lower for k in ["south", "tamil", "telugu", "tollywood", "indian"]):
                # if 'indian' is present but no south, verify it's not meant for something else.
                # but 'south indian' will map to here.
                region = "South Indian"
                query_lower = query_lower.replace("south", "").replace("indian", "").replace("tamil", "").replace("telugu", "").replace("tollywood", "").replace("movies", "").replace("movie", "").replace("film", "").replace("films", "").strip()
            elif any(k in query_lower for k in ["english", "hollywood"]):
                region = "Hollywood"
                query_lower = query_lower.replace("english", "").replace("hollywood", "").replace("movies", "").replace("movie", "").replace("film", "").replace("films", "").strip()

        # If query is mostly just the language keyword, return top movies of that region
        if not query_lower and region:
            return self.get_movies_by_region(region, limit)

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

