import os
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Verify environment variables are loaded
print("\n" + "="*80)
print("ML SERVICE STARTUP - Environment Check")
print("="*80)
gemini_key = os.getenv("GEMINI_API_KEY")
if gemini_key:
    print(f"✓ GEMINI_API_KEY is set (length: {len(gemini_key)})")
    print(f"  First 10 chars: {gemini_key[:10]}...")
else:
    print("✗ GEMINI_API_KEY is NOT set!")
    print("  Gemini features will be disabled")
print("="*80 + "\n")

app = FastAPI(
    title="Really Nicca ML Service",
    description="ML Service for Accurate Graph Extraction",
    version="0.1.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ml-service"}

# Import and include routers
from app.features.organize.routes import router as organize_router
app.include_router(organize_router, prefix="/organize", tags=["organize"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
