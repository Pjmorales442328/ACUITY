"""
AcuityVoice - AssemblyAI Voice Agent API Live Session Manager
Manages real-time bi-directional WebSockets, audio streaming, tool callbacks,
and credit protection guardrails.
"""

import asyncio
import json
import os
import time
from typing import Callable, Awaitable
import websockets
from scoring_rubric import build_agent_system_prompt, ASSEMBLYAI_TOOLS

ASSEMBLYAI_WS_URL = "wss://agents.assemblyai.com/v1/ws"

class AssemblyAIVoiceAgentSession:
    def __init__(
        self,
        api_key: str,
        scenario_key: str,
        send_to_client: Callable[[dict], Awaitable[None]],
        send_audio_to_client: Callable[[bytes], Awaitable[None]],
        max_duration_seconds: int = 180
    ):
        self.api_key = api_key
        self.scenario_key = scenario_key
        self.send_to_client = send_to_client
        self.send_audio_to_client = send_audio_to_client
        self.max_duration_seconds = max_duration_seconds
        
        self.ws = None
        self.is_running = False
        self.start_time = None
        self.scorecard = None
        self.markers = []
        self.current_temperament = "AGITATED_ANXIOUS"
        self.current_sentiment_score = 30
        
        # Real-time running score estimates
        self.live_scores = {
            "fluency": 75,
            "lexical": 75,
            "grammar": 75,
            "pronunciation": 80,
            "empathy": 70
        }

    async def connect_and_run(self):
        headers = {
            "Authorization": self.api_key
        }
        
        self.start_time = time.time()
        self.is_running = True
        
        prompt = build_agent_system_prompt(self.scenario_key)
        
        init_payload = {
            "agent": {
                "prompt": prompt,
                "voice": "en_us_001",
                "temperature": 0.3,
                "turn_detection": {
                    "type": "server_vad",
                    "threshold": 0.5,
                    "prefix_padding_ms": 300,
                    "silence_duration_ms": 700
                },
                "tools": ASSEMBLYAI_TOOLS
            }
        }
        
        print(f"[AssemblyAI Session] Connecting to {ASSEMBLYAI_WS_URL}...")
        try:
            async with websockets.connect(
                ASSEMBLYAI_WS_URL,
                extra_headers=headers,
                ping_interval=20,
                ping_timeout=20
            ) as ws:
                self.ws = ws
                # Send configuration
                await ws.send(json.dumps(init_payload))
                print("[AssemblyAI Session] Session initialized and prompt configured.")
                
                await self.send_to_client({
                    "type": "session_connected",
                    "scenario": self.scenario_key,
                    "max_duration_seconds": self.max_duration_seconds
                })
                
                # Start safety timer task to strictly cap duration and protect credits
                safety_task = asyncio.create_task(self._session_watchdog())
                
                # Listen loop
                try:
                    while self.is_running:
                        msg = await ws.recv()
                        if isinstance(msg, bytes):
                            # Synthetic voice audio chunk returned from AssemblyAI
                            await self.send_audio_to_client(msg)
                        else:
                            # JSON Event message
                            data = json.loads(msg)
                            await self._handle_assemblyai_event(data)
                finally:
                    safety_task.cancel()
                    
        except websockets.exceptions.ConnectionClosed as e:
            print(f"[AssemblyAI Session] Connection closed: {e}")
        except Exception as e:
            print(f"[AssemblyAI Session] Error in session loop: {e}")
            await self.send_to_client({
                "type": "error",
                "message": str(e)
            })
        finally:
            self.is_running = False
            await self.cleanup()

    async def _handle_assemblyai_event(self, data: dict):
        event_type = data.get("type")
        
        if event_type == "transcript":
            speaker = data.get("speaker", "AI Customer")
            text = data.get("text", "")
            is_final = data.get("is_final", False)
            
            await self.send_to_client({
                "type": "transcript",
                "speaker": speaker,
                "text": text,
                "is_final": is_final,
                "timestamp": time.time()
            })
            
        elif event_type == "tool_call":
            tool = data.get("tool_call", {})
            call_id = tool.get("id")
            tool_name = tool.get("name")
            raw_args = tool.get("arguments", "{}")
            args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
            
            print(f"\n⚡ [AssemblyAI Tool Call] {tool_name}: {args}")
            
            # Process tool logic internally
            result = await self._execute_tool(tool_name, args)
            
            # Acknowledge tool call back to AssemblyAI Voice Agent
            tool_response = {
                "type": "tool_result",
                "call_id": call_id,
                "result": result
            }
            if self.ws:
                await self.ws.send(json.dumps(tool_response))
                
            # Broadcast tool update to frontend dashboard
            await self.send_to_client({
                "type": "tool_call",
                "tool_name": tool_name,
                "args": args
            })
            
        elif event_type == "error":
            print(f"[AssemblyAI Error Event]: {data}")
            await self.send_to_client({
                "type": "error",
                "message": data.get("message", "Unknown AssemblyAI error")
            })

    async def _execute_tool(self, tool_name: str, args: dict) -> dict:
        """Executes tool logic and dynamically shifts scores."""
        if tool_name == "log_conversational_marker":
            self.markers.append(args)
            marker_type = args.get("marker_type", "")
            impact = args.get("impact", "NEUTRAL")
            
            # Adjust live radar metrics based on impact
            delta = 3 if impact == "POSITIVE" else (-4 if impact == "NEGATIVE" else 0)
            if "EMPATHY" in marker_type:
                self.live_scores["empathy"] = max(20, min(99, self.live_scores["empathy"] + delta * 2))
            elif "VOCABULARY" in marker_type:
                self.live_scores["lexical"] = max(20, min(99, self.live_scores["lexical"] + delta))
            elif "GRAMMAR" in marker_type:
                self.live_scores["grammar"] = max(20, min(99, self.live_scores["grammar"] + delta))
            elif "HESITATION" in marker_type:
                self.live_scores["fluency"] = max(20, min(99, self.live_scores["fluency"] - 3))
                
            await self.send_to_client({
                "type": "score_update",
                "scores": self.live_scores
            })
            return {"status": "SUCCESS", "logged_count": len(self.markers)}
            
        elif tool_name == "update_customer_temperament":
            self.current_temperament = args.get("new_temperament", self.current_temperament)
            self.current_sentiment_score = args.get("sentiment_score", self.current_sentiment_score)
            return {"status": "SUCCESS", "current_temperament": self.current_temperament}
            
        elif tool_name == "generate_candidate_scorecard":
            self.scorecard = args
            await self.send_to_client({
                "type": "interview_completed",
                "scorecard": self.scorecard
            })
            # Trigger session wrap-up
            asyncio.create_task(self._delayed_close(seconds=2.0))
            return {"status": "SUCCESS", "scorecard_generated": True}
            
        return {"status": "UNKNOWN_TOOL"}

    async def send_audio_chunk(self, audio_bytes: bytes):
        """Streams incoming microphone PCM chunks from client to AssemblyAI."""
        if self.ws and self.is_running:
            try:
                await self.ws.send(audio_bytes)
            except Exception as e:
                print(f"[AssemblyAI Session] Failed to send audio chunk: {e}")

    async def _session_watchdog(self):
        """Protects API credits by terminating if duration exceeds limit."""
        while self.is_running:
            elapsed = time.time() - self.start_time
            remaining = max(0, self.max_duration_seconds - elapsed)
            
            # Send periodic pulse with remaining seconds
            if int(elapsed) % 5 == 0:
                await self.send_to_client({
                    "type": "timer_pulse",
                    "elapsed_seconds": int(elapsed),
                    "remaining_seconds": int(remaining)
                })
                
            if elapsed >= self.max_duration_seconds:
                print(f"[AssemblyAI Session] Safety limit reached ({self.max_duration_seconds}s). Auto-closing to preserve credit.")
                await self.send_to_client({
                    "type": "safety_timeout",
                    "message": "Interview session reached max allowed duration (3 minutes) to conserve API credits."
                })
                self.is_running = False
                break
                
            await asyncio.sleep(1.0)

    async def _delayed_close(self, seconds: float):
        await asyncio.sleep(seconds)
        self.is_running = False
        if self.ws:
            await self.ws.close()

    async def cleanup(self):
        self.is_running = False
        if self.ws:
            try:
                await self.ws.close()
            except Exception:
                pass
            self.ws = None
        print("[AssemblyAI Session] Cleaned up and resources released.")
