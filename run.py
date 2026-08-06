import uvicorn
import os
import sys

# Ensure repository root is on sys.path so the top-level `ai` package is importable
REPO_ROOT = os.path.dirname(os.path.abspath(__file__))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

# Also add backend/ to allow importing `app` when Uvicorn loads app.main
BACKEND_DIR = os.path.join(REPO_ROOT, "backend")
if os.path.isdir(BACKEND_DIR) and BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
