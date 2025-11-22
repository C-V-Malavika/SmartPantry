"""
SmartPantry Backend Server
"""

import uvicorn
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

if __name__ == "__main__":
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    
    print(f"Starting SmartPantry API server...")
    print(f"Server will be available at: http://{host}:{port}")
    print(f"API documentation: http://{host}:{port}/docs")
    
    uvicorn.run(
        "app:app", 
        host=host,
        port=port,
        reload=True,
        log_level="info"
    )