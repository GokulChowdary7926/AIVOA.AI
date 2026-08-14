from pathlib import Path
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

logger = logging.getLogger(__name__)

db_url = settings.DATABASE_URL
try:
    engine = create_engine(db_url, pool_pre_ping=True)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception:
    sqlite_path = Path(__file__).resolve().parent.parent / "aivoa_complaints.db"
    db_url = f"sqlite:///{sqlite_path}"
    engine = create_engine(db_url, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

