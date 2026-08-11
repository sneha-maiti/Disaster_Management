import sys
import os

# Add Backend root directory to python path for modular imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from utils.config import HOST, PORT, DEBUG
import uvicorn

if __name__ == "__main__":
    uvicorn.run("main:app", host=HOST, port=PORT, reload=DEBUG)