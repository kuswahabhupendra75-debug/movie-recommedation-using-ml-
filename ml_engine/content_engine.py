import numpy as np
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class ContentEngine:
    """
    Content-Based Filtering using TF-IDF on movie genres.
    Pre-computes a full cosine similarity matrix on initialization.
    """

    def __init__(self, movies: pd.DataFrame):
        self.movies = movies.reset_index(drop=True)
        self.movie_id_to_idx = {
            int(row["movieId"]): idx for idx, row in self.movies.iterrows()
        }
        self.tfidf_matrix = None
        self.sim_matrix = None
        self._build()

    def _build(self):
        # Replace | separators with spaces so TF-IDF treats each genre as a token
        genre_strings = self.movies["genres"].str.replace("|", " ", regex=False)

        vectorizer = TfidfVectorizer(token_pattern=r"[^\s]+")
        self.tfidf_matrix = vectorizer.fit_transform(genre_strings)

        # Dense similarity matrix — fast O(1) lookups later
        print(f"   📐 Computing Content similarity matrix ({len(self.movies)} movies)…")
        self.sim_matrix = cosine_similarity(self.tfidf_matrix)

    def get_scores(self, movie_id: int) -> np.ndarray:
        """Return a vector of cosine-similarity scores against all movies."""
        idx = self.movie_id_to_idx.get(int(movie_id))
        if idx is None:
            return np.zeros(len(self.movies))
        return self.sim_matrix[idx]

    def get_top_similar(self, movie_id: int, n: int = 10):
        scores = self.get_scores(movie_id)
        idx = self.movie_id_to_idx.get(int(movie_id))
        if idx is None:
            return []

        results = [
            (int(self.movies.iloc[i]["movieId"]), float(scores[i]))
            for i in range(len(self.movies))
            if i != idx
        ]
        results.sort(key=lambda x: x[1], reverse=True)
        return results[:n]
