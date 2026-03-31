import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import pandas as pd


def calculate_rmse(ratings: pd.DataFrame) -> dict:
    """
    Evaluate collaborative filtering accuracy with RMSE
    using an 80/20 train-test split.

    Strategy:
    - Train: build per-user mean rating predictor
    - Test:  predict using user mean (or global mean for unseen users)
    """
    train, test = train_test_split(ratings, test_size=0.2, random_state=42)

    user_means = train.groupby("userId")["rating"].mean().to_dict()
    global_mean = float(ratings["rating"].mean())

    predictions = []
    actuals = []

    for _, row in test.iterrows():
        uid = int(row["userId"])
        pred = user_means.get(uid, global_mean)
        predictions.append(pred)
        actuals.append(float(row["rating"]))

    rmse = float(np.sqrt(mean_squared_error(actuals, predictions)))

    return {
        "rmse": round(rmse, 4),
        "accuracy_pct": round(max(0.0, (1 - rmse / 5.0) * 100), 2),
        "test_samples": int(len(test)),
        "train_samples": int(len(train)),
        "total_ratings": int(len(ratings)),
        "unique_users": int(ratings["userId"].nunique()),
        "unique_movies": int(ratings["movieId"].nunique()),
        "avg_rating": round(global_mean, 3),
        "dataset": "MovieLens Latest Small (ml-latest-small)",
    }
