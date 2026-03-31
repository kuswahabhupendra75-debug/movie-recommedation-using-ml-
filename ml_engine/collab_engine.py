import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from scipy.sparse import csr_matrix
from typing import Dict, List


class CollabEngine:
    """
    Item-Item Collaborative Filtering using cosine similarity
    on the User-Item rating matrix.
    """

    def __init__(self, ratings: pd.DataFrame, movies: pd.DataFrame):
        self.ratings = ratings
        self.movies = movies
        self.movie_ids: List[int] = []
        self.movie_id_to_col: Dict[int, int] = {}
        self.sim_matrix: np.ndarray = None
        self._build()

    def _build(self):
        # Build User × Movie pivot
        user_item = self.ratings.pivot_table(
            index="userId",
            columns="movieId",
            values="rating",
            fill_value=0,
        )
        self.movie_ids = [int(mid) for mid in user_item.columns]
        self.movie_id_to_col = {mid: i for i, mid in enumerate(self.movie_ids)}

        # Item-Item similarity: transpose → shape (movies, users)
        item_matrix = csr_matrix(user_item.values.T)
        print(f"   🤝 Computing Collab similarity matrix ({len(self.movie_ids)} movies)…")
        self.sim_matrix = cosine_similarity(item_matrix)

    def get_scores(self, movie_id: int) -> Dict[int, float]:
        """Return {movieId: similarity_score} for all movies in the collab space."""
        col_idx = self.movie_id_to_col.get(int(movie_id))
        if col_idx is None:
            return {}
        row = self.sim_matrix[col_idx]
        return {self.movie_ids[i]: float(row[i]) for i in range(len(self.movie_ids))}

    def get_user_rating_count(self, user_id: int) -> int:
        return len(self.ratings[self.ratings["userId"] == user_id])

    def get_user_top_genres(self, user_id: int, movies: pd.DataFrame, n: int = 3) -> List[str]:
        """Return the top N genres a user has highly rated."""
        user_ratings = self.ratings[self.ratings["userId"] == user_id]
        if user_ratings.empty:
            return []

        top_movie_ids = user_ratings.nlargest(20, "rating")["movieId"].tolist()
        top_movies = movies[movies["movieId"].isin(top_movie_ids)]

        genre_counts: Dict[str, int] = {}
        for g_str in top_movies["genres"]:
            for g in g_str.split("|"):
                genre_counts[g] = genre_counts.get(g, 0) + 1

        sorted_genres = sorted(genre_counts, key=genre_counts.get, reverse=True)
        return sorted_genres[:n]
