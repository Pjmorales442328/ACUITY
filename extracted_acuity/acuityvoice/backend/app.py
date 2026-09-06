"""
AcuityVoice - FastAPI Web Application & WebSocket Gateway
Cloud & Production Ready for Render, Railway, Fly.io, and Docker.
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

# Ensure backend directory is in python path
CURRENT_DIR = Path(__file__).resolve().parent
BASE_DIR = CURRENT_DIR.parent
if str(CURRENT_DIR) not in sys.path:
    sys.path.insert(0, str(CURRENT_DIR))

load_dotenv(BASE_DIR / ".env")

from scoring_rubric import SCENARIOS
from agent_session import AssemblyAIVoiceAgentSession
from mock_agent import MockVoiceAgentSession

ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY", "").strip()
MOCK_MODE_DEFAULT = os.getenv("MOCK_MODE", "false").lower() in ("true", "1", "yes")
MAX_SESSION_SECONDS = int(os.getenv("MAX_SESSION_SECONDS", "180"))

app = FastAPI(title="AcuityVoice", description="Autonomous Spoken English & Candidate Screening Agent")

# Mount static and template directories
app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
templates = Jinja2Templates(directory=str(BASE_DIR / "templates"))

@app.get("/", response_class=HTMLResponse)
async def serve_dashboard(request: Request):
    has_api_key = bool(ASSEMBLYAI_API_KEY and ASSEMBLYAI_API_KEY != "your_assemblyai_api_key_here")
    return templates.TemplateResponse(
        "index.html",
        {
            "request": request,
            "has_api_key": has_api_key,
            "mock_mode_default": MOCK_MODE_DEFAULT or not has_api_key,
            "max_duration": MAX_SESSION_SECONDS,
            "scenarios": SCENARIOS
        }
    )

@app.get("/api/health")
async def health_check():
    has_api_key = bool(ASSEMBLYAI_API_KEY and ASSEMBLYAI_API_KEY != "your_assemblyai_api_key_here")
    return {
        "status": "healthy",
        "assemblyai_configured": has_api_key,
        "mock_mode_default": MOCK_MODE_DEFAULT or not has_api_key,
        "max_session_seconds": MAX_SESSION_SECONDS
    }

@app.get("/api/scenarios")
async def list_scenarios():
    return SCENARIOS

@app.websocket("/ws/interview")
async def interview_websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("[WebSocket] Client connected to interview channel.")
    
    active_session = None
    use_mock = MOCK_MODE_DEFAULT or not bool(ASSEMBLYAI_API_KEY and ASSEMBLYAI_API_KEY != "your_assemblyai_api_key_here")
    selected_scenario = "fintech_dispute"
    
    async def send_json_to_client(payload: dict):
        try:
            await websocket.send_text(json.dumps(payload))
        except Exception:
            pass

    async def send_audio_to_client(audio_bytes: bytes):
        try:
            await websocket.send_bytes(audio_bytes)
        except Exception:
            pass

    try:
        while True:
            message = await websocket.receive()
            
            # Handle text commands (start, stop, change mode)
            if "text" in message:
                data = json.loads(message["text"])
                msg_type = data.get("type")
                
                if msg_type == "start_interview":
                    selected_scenario = data.get("scenario", "fintech_dispute")
                    client_requested_mock = data.get("mock_mode", use_mock)
                    
                    # If mock requested or no API key, start mock session
                    if client_requested_mock or not ASSEMBLYAI_API_KEY or ASSEMBLYAI_API_KEY == "your_assemblyai_api_key_here":
                        print("[WebSocket] Starting MOCK interview session...")
                        active_session = MockVoiceAgentSession(
                            scenario_key=selected_scenario,
                            send_to_client=send_json_to_client
                        )
                        asyncio.create_task(active_session.start())
                        await send_json_to_client({
                            "type": "session_connected",
                            "mode": "MOCK_SIMULATION",
                            "scenario": selected_scenario,
                            "max_duration_seconds": MAX_SESSION_SECONDS
                        })
                    else:
                        print("[WebSocket] Starting LIVE AssemblyAI Voice Agent API session...")
                        active_session = AssemblyAIVoiceAgentSession(
                            api_key=ASSEMBLYAI_API_KEY,
                            scenario_key=selected_scenario,
                            send_to_client=send_json_to_client,
                            send_audio_to_client=send_audio_to_client,
                            max_duration_seconds=MAX_SESSION_SECONDS
                        )
                        asyncio.create_task(active_session.connect_and_run())
                        
                elif msg_type == "stop_interview":
                    print("[WebSocket] Stop interview requested by client.")
                    if active_session:
                        if hasattr(active_session, "stop"):
                            await active_session.stop()
                        elif hasattr(active_session, "cleanup"):
                            await active_session.cleanup()
                        active_session = None
                    await send_json_to_client({"type": "session_stopped"})
                    
                elif msg_type == "candidate_spoke":
                    # Used in mock mode when candidate speaks/pauses
                    if active_session and isinstance(active_session, MockVoiceAgentSession):
                        asyncio.create_task(active_session.trigger_candidate_turn_completed())
                        
            # Handle binary audio streaming from microphone
            elif "bytes" in message:
                audio_bytes = message["bytes"]
                if active_session:
                    if isinstance(active_session, AssemblyAIVoiceAgentSession):
                        await active_session.send_audio_chunk(audio_bytes)
                    elif isinstance(active_session, MockVoiceAgentSession):
                        await active_session.handle_candidate_audio_chunk(audio_bytes)

    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected.")
    except Exception as e:
        print(f"[WebSocket] Error: {e}")
    finally:
        if active_session:
            if hasattr(active_session, "stop"):
                await active_session.stop()
            elif hasattr(active_session, "cleanup"):
                await active_session.cleanup()
            active_session = None

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    print(f"Starting AcuityVoice on http://0.0.0.0:{port}")
    uvicorn.run("backend.app:app", host="0.0.0.0", port=port, reload=True)
