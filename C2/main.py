"""AOSL C2 Core Engine Main Entrypoint.

Launches the Uvicorn server hosting the C2 FastAPI server.
"""

import uvicorn
import config
from server.routes.server import app

def main() -> None:
    """Start the C2 HTTP application server on 0.0.0.0 using configured port."""
    uvicorn.run(app, host="0.0.0.0", port=config.DEFAULT_PORT)


if __name__ == "__main__":
    main()
