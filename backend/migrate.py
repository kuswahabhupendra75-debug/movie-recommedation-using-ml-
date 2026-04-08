import csv
import os
import psycopg2
from psycopg2.extras import execute_values
import re

# SECURITY: Load from environment variable only — never hardcode credentials
# Set DATABASE_URL in your shell: $env:DATABASE_URL="postgresql://postgres:PASSWORD@..."
DB_URL = os.getenv("DATABASE_URL")
if not DB_URL:
    raise RuntimeError("Set DATABASE_URL env var before running migrate.py")

def migrate():
    print("🚀 Starting migration to Supabase...")
    
    try:
        conn = psycopg2.connect(DB_URL)
        cur = conn.cursor()
        
        # 1. Setup Tables
        print("🔨 Setting up tables...")
        # (Removed destructive drops for stability)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS movies (
                id SERIAL PRIMARY KEY,
                movieId TEXT UNIQUE,
                title TEXT,
                genres TEXT,
                year TEXT,
                region TEXT
            );
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ratings (
                id SERIAL PRIMARY KEY,
                userId INTEGER,
                movieId TEXT,
                rating FLOAT,
                timestamp BIGINT
            );
        """)
        
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username TEXT UNIQUE,
                email TEXT UNIQUE,
                password TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # 2. Migrate Movies
        print("📦 Migrating movies...")
        csv_path = 'backend/movies.csv' if os.path.exists('backend/movies.csv') else 'data/movies.csv'
        movies_data = []
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                mid = row.get('movieId', '')
                title = row.get('title', '')
                genres = row.get('genres', '')
                
                # Dynamic Region Logic (Sync with main.py)
                year_match = re.findall(r'\((\d{4})\)', title)
                year = year_match[-1] if year_match else ""
                
                genres_lower = genres.lower()
                if 'south-indian' in genres_lower:
                    region = 'south-indian'
                elif 'hindi' in genres_lower:
                    region = 'hindi'
                elif 'hollywood' in genres_lower or int(mid or 0) < 200000:
                    region = 'hollywood'
                else:
                    region = 'unknown'
                
                movies_data.append((mid, title, genres, year, region))
        
        execute_values(cur, 
            "INSERT INTO movies (movieId, title, genres, year, region) VALUES %s ON CONFLICT (movieId) DO NOTHING", 
            movies_data)
        print(f"✅ Migrated {len(movies_data)} movies")

        # 3. Migrate Ratings
        print("📊 Migrating ratings (this may take a minute)...")
        ratings_path = 'data/ratings.csv'
        if os.path.exists(ratings_path):
            ratings_data = []
            with open(ratings_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    ratings_data.append((
                        int(row.get('userId', 0)),
                        row.get('movieId', ''),
                        float(row.get('rating', 0)),
                        int(row.get('timestamp', 0))
                    ))
                    if len(ratings_data) >= 10000: # Batch insert for performance
                        execute_values(cur, 
                            "INSERT INTO ratings (userId, movieId, rating, timestamp) VALUES %s", 
                            ratings_data)
                        ratings_data = []
            
            if ratings_data:
                execute_values(cur, 
                    "INSERT INTO ratings (userId, movieId, rating, timestamp) VALUES %s", 
                    ratings_data)
            print(f"✅ Migrated ratings database")
        
        conn.commit()
        cur.close()
        conn.close()
        print("🎉 Migration successful!")
        
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    migrate()
