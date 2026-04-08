import os
import psycopg2
from psycopg2.extras import execute_values

# SECURITY: Load from environment variable only — never hardcode credentials
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise RuntimeError("Set DATABASE_URL env var before running this script")

MOVIES_TO_ADD = [
    # Bollywood Hits
    ("Saiyaara (2025)", "Musical|Romance|Drama", "2025", "Bollywood", "1000001"),
    ("Stree 2 (2024)", "Horror|Comedy", "2024", "Bollywood", "1000002"),
    ("Animal (2023)", "Action|Drama|Thriller", "2023", "Bollywood", "1000003"),
    ("Pathaan (2023)", "Action|Thriller", "2023", "Bollywood", "1000004"),
    ("Jawan (2023)", "Action|Thriller", "2023", "Bollywood", "1000005"),
    ("Fighter (2024)", "Action|Thriller", "2024", "Bollywood", "1000006"),
    ("Drishyam 2 (2022)", "Thriller|Crime", "2022", "Bollywood", "1000007"),
    ("Tu Jhoothi Main Makkaar (2023)", "Romance|Comedy", "2023", "Bollywood", "1000008"),
    
    # South Indian Blockbusters
    ("Sita Ramam (2022)", "Romance|Drama|War", "2022", "South Indian", "2000001"),
    ("Kalki 2898 AD (2024)", "Sci-Fi|Action|Mythology", "2024", "South Indian", "2000002"),
    ("Pushpa 2: The Rule (2024)", "Action|Drama", "2024", "South Indian", "2000003"),
    ("Leo (2023)", "Action|Thriller", "2023", "South Indian", "2000004"),
    ("Jailer (2023)", "Action|Comedy|Thriller", "2023", "South Indian", "2000005"),
    ("Kantara (2022)", "Action|Fantasy|Thriller", "2022", "South Indian", "2000006"),
    ("Vikram (2022)", "Action|Thriller|Crime", "2022", "South Indian", "2000007"),
    ("Salaar: Part 1 - Ceasefire (2023)", "Action|Crime|Drama", "2023", "South Indian", "2000008"),
    
    # Hollywood/International
    ("Dune: Part Two (2024)", "Sci-Fi|Action|Adventure", "2024", "Hollywood", "3000001"),
    ("Oppenheimer (2023)", "Biography|Drama|History", "2023", "Hollywood", "3000002"),
    ("Deadpool & Wolverine (2024)", "Action|Comedy|Adventure", "2024", "Hollywood", "3000003"),
    ("Inside Out 2 (2024)", "Animation|Comedy|Family", "2024", "Hollywood", "3000004"),
    ("Godzilla x Kong: The New Empire (2024)", "Action|Adventure|Sci-Fi", "2024", "Hollywood", "3000005"),
    ("The Batman (2022)", "Action|Crime|Drama", "2022", "Hollywood", "3000006"),
    ("Avatar: The Way of Water (2022)", "Sci-Fi|Action|Adventure", "2022", "Hollywood", "3000007"),
    ("John Wick: Chapter 4 (2023)", "Action|Crime|Thriller", "2023", "Hollywood", "3000008"),
]

def add_movies():
    print("📈 Connecting to Supabase...")
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # Format for INSERT: (movieId, title, genres, year, region)
        data = [(m[4], m[0], m[1], m[2], m[3]) for m in MOVIES_TO_ADD]
        
        print(f"📦 Adding {len(data)} new movies to catalog...")
        execute_values(cur, 
            "INSERT INTO movies (movieId, title, genres, year, region) VALUES %s ON CONFLICT (movieId) DO NOTHING", 
            data)
        
        conn.commit()
        cur.close()
        conn.close()
        print("🎉 Movies successfully added to your CineHybrid catalog!")
        
    except Exception as e:
        print(f"❌ Failed to add movies: {e}")

if __name__ == "__main__":
    add_movies()
