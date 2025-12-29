"""
FastAPI service for Zop Agent.

This service provides HTTP endpoints for the AI agent functionality,
designed to run as a Tauri sidecar.
"""

import os
import sys
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from .sop_agent import SopGeneratorAgent, SopGeneratorOutputSchema, SopStep


class AiConfig(BaseModel):
    """AI configuration for the agent."""

    base_url: str = Field(default="https://api.openai.com/v1")
    api_key: str
    model_name: str = Field(default="gpt-4o")


class GenerateSopRequest(BaseModel):
    """Request body for SOP generation."""

    prompt: str = Field(description="Description of the process to automate")
    config: AiConfig = Field(description="AI configuration")


class HealthResponse(BaseModel):
    """Health check response."""

    status: str
    version: str


# Global agent instance (will be created per request with config)
_current_agent: Optional[SopGeneratorAgent] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    print("Zop Agent starting...", file=sys.stderr)
    yield
    print("Zop Agent shutting down...", file=sys.stderr)


app = FastAPI(
    title="Zop Agent",
    description="AI Agent sidecar for Zop application",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(status="ok", version="0.1.0")


@app.post("/generate-sop", response_model=SopGeneratorOutputSchema)
async def generate_sop(request: GenerateSopRequest):
    """
    Generate an SOP from a natural language description.

    This endpoint creates an agent with the provided configuration
    and generates a structured SOP.
    """
    try:
        agent = SopGeneratorAgent(
            base_url=request.config.base_url,
            api_key=request.config.api_key,
            model_name=request.config.model_name,
        )

        result = agent.generate(request.prompt)
        return result

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate SOP: {str(e)}"
        )


def main():
    """Entry point for the sidecar."""
    import uvicorn

    # Get port from environment or command line, default to 19820
    port = int(os.environ.get("ZOP_AGENT_PORT", "19820"))

    # Check for command line port argument
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            pass

    print(f"Starting Zop Agent on port {port}...", file=sys.stderr)

    uvicorn.run(
        app,
        host="127.0.0.1",
        port=port,
        log_level="warning",
    )


if __name__ == "__main__":
    main()
