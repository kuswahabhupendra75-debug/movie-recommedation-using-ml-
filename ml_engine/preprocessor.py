import pandas as pd
import numpy as np
import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def load_data():
    """Load and preprocess movies.csv, then inject custom movies."""
    from .custom_movies import CUSTOM_MOVIES

    movies_path = os.path.join(DATA_DIR, "movies.csv")

    movies = pd.read_csv(movies_path)

    # Handle missing / blank genres
    movies["genres"] = movies["genres"].fillna("Unknown")
    movies["genres"] = movies["genres"].replace("(no genres listed)", "Unknown")

    # Add region column (Hollywood for all MovieLens entries)
    movies["region"] = "Hollywood"

    # Drop duplicate movieIds
    movies = movies.drop_duplicates(subset="movieId").reset_index(drop=True)

    # ── Inject curated Bollywood + South Indian + Modern Hollywood ──────────
    custom_df = pd.DataFrame(CUSTOM_MOVIES)
    # Only add if not already present (safe re-load)
    existing_ids = set(movies["movieId"].values)
    custom_df = custom_df[~custom_df["movieId"].isin(existing_ids)]
    movies = pd.concat([movies, custom_df], ignore_index=True)
    print(f"   🌍 Total movies after custom injection: {len(movies)}")

    return movies

