"""Start the API for local development.

Use this instead of `uvicorn main:app --reload` while running analyses.
Auto-reload kills in-flight jobs when Python files change.
"""

import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        reload_excludes=["storage", "storage/*", "**/storage/**"],
    )
