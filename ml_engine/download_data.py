import os
import requests
import zipfile
import io

DATA_URL = "https://files.grouplens.org/datasets/movielens/ml-latest.zip"
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")


def download_movielens():
    movies_path = os.path.join(DATA_DIR, "movies.csv")
    ratings_path = os.path.join(DATA_DIR, "ratings.csv")

    if os.path.exists(movies_path) and os.path.exists(ratings_path):
        print("✅ Dataset already exists, skipping download.")
        return movies_path, ratings_path

    os.makedirs(DATA_DIR, exist_ok=True)
    print("⬇️  Downloading MovieLens Small Dataset (~3MB)...")

    response = requests.get(DATA_URL, stream=True, timeout=60)
    response.raise_for_status()

    with zipfile.ZipFile(io.BytesIO(response.content)) as z:
        for name in z.namelist():
            if name.endswith("movies.csv"):
                with z.open(name) as src, open(movies_path, "wb") as dst:
                    dst.write(src.read())
            elif name.endswith("ratings.csv"):
                with z.open(name) as src, open(ratings_path, "wb") as dst:
                    dst.write(src.read())

    print("✅ Dataset downloaded and extracted successfully!")
    return movies_path, ratings_path


if __name__ == "__main__":
    download_movielens()
