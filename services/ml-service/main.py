from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.features.organize.routes import router as organize_router
from dotenv import load_dotenv
import os

# Load environment variables from .env file
load_dotenv()

app = FastAPI(
    title="Really Nicca ML Service",
    description="ML service for entity extraction and relationship classification",
    version="0.1.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(organize_router)


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    has_api_key = bool(os.getenv("GEMINI_API_KEY"))
    return {
        "status": "ok",
        "service": "ml-service",
        "gemini_configured": has_api_key
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
