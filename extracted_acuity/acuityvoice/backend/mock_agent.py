"""
AcuityVoice - Mock Simulation Engine (Zero Credit Consumption)
Allows complete testing of the browser UI, audio streams, transcript flow,
radar charts, and scorecard generation without calling AssemblyAI API.
"""

import asyncio
import json
import random
import time
from typing import Callable, Awaitable

class MockVoiceAgentSession:
    def __init__(self, scenario_key: str, send_to_client: Callable[[dict], Awaitable[None]]):
        self.scenario_key = scenario_key
        self.send_to_client = send_to_client
        self.is_active = False
        self.current_turn = 0
        self.scores = {
            "fluency": 78,
            "lexical": 82,
            "grammar": 80,
            "pronunciation": 85,
            "empathy": 75
        }
        
        # Scripted conversational turns for mock mode
        self.mock_script = [
            {
                "speaker": "AI Customer",
                "text": "Hi, yes! I just looked at my ApexPay mobile app, and there's a $45.00 charge from 'CloudStream Pro' that I never authorized! What is going on here?",
                "temperament": "AGITATED_ANXIOUS",
                "sentiment_score": 25,
                "temperament_reason": "Customer opened call panicked about unexpected recurring deduction."
            },
            {
                "speaker": "AI Customer",
                "text": "My name is Jordan Reynolds. Look, my rent is due tomorrow morning and I really can't afford mysterious charges right now. Can you reverse this immediately?",
                "temperament": "DEFENSIVE",
                "sentiment_score": 38,
                "temperament_reason": "Customer expressed anxiety over bank balance; waiting for agent reassurance."
            },
            {
                "speaker": "AI Customer",
                "text": "Okay, thank you for checking that. Yes, I do see that it was processed 3 hours ago. Can you freeze that vendor so they don't bill me again?",
                "temperament": "NEUTRAL_ATTENTIVE",
                "sentiment_score": 62,
                "temperament_reason": "Candidate verified transaction details and showed reassuring tone."
            },
            {
                "speaker": "AI Customer",
                "text": "That would be fantastic. If you can issue the provisional credit and lock the card from that merchant, that solves everything. I really appreciate your quick help today!",
                "temperament": "SATISFIED_GRATEFUL",
                "sentiment_score": 92,
                "temperament_reason": "Candidate proposed clear resolution and de-escalated customer completely."
            }
        ]

    async def start(self):
        self.is_active = True
        print("[MockAgent] Simulation started for scenario:", self.scenario_key)
        
        # Initial greeting event from AI Customer
        await asyncio.sleep(1.0)
        await self._play_turn(0)

    async def _play_turn(self, turn_idx: int):
        if not self.is_active or turn_idx >= len(self.mock_script):
            return
            
        turn_data = self.mock_script[turn_idx]
        
        # 1. Send Transcript Event
        await self.send_to_client({
            "type": "transcript",
            "speaker": "AI Customer (AssemblyAI Simulation)",
            "text": turn_data["text"],
            "timestamp": time.time(),
            "is_final": True
        })
        
        # 2. Update Temperament Tool Call
        await self.send_to_client({
            "type": "tool_call",
            "tool_name": "update_customer_temperament",
            "args": {
                "new_temperament": turn_data["temperament"],
                "trigger_reason": turn_data["temperament_reason"],
                "sentiment_score": turn_data["sentiment_score"]
            }
        })
        
        # 3. Simulate a candidate response window
        self.current_turn = turn_idx + 1

    async def handle_candidate_audio_chunk(self, chunk_bytes: bytes):
        """In mock mode, incoming audio is acknowledged to drive state forward."""
        pass

    async def trigger_candidate_turn_completed(self, simulated_text: str = None):
        """Called when user pauses or speaks in mock mode."""
        if not self.is_active:
            return
            
        # Log a mock marker based on candidate's turn
        markers = [
            {
                "marker_type": "EMPATHY_DEMONSTRATED",
                "candidate_quote": "I completely understand how alarming an unexpected charge is, Jordan. Let me look into this right now.",
                "impact": "POSITIVE",
                "coaching_note": "Excellent acknowledgment of customer emotional state before diving into verification."
            },
            {
                "marker_type": "ADVANCED_VOCABULARY",
                "candidate_quote": "I can initiate an immediate merchant block and issue a provisional dispute credit.",
                "impact": "POSITIVE",
                "coaching_note": "Accurate domain-specific terminology applied seamlessly."
            },
            {
                "marker_type": "GRAMMATICAL_ACCURACY",
                "candidate_quote": "Could you please confirm the last four digits of the card that was charged?",
                "impact": "POSITIVE",
                "coaching_note": "Polite conditional phrasing used properly."
            }
        ]
        
        marker = random.choice(markers)
        await self.send_to_client({
            "type": "tool_call",
            "tool_name": "log_conversational_marker",
            "args": marker
        })
        
        # Adjust real-time radar metrics slightly
        self.scores["fluency"] = min(98, self.scores["fluency"] + random.randint(2, 5))
        self.scores["empathy"] = min(95, self.scores["empathy"] + random.randint(3, 6))
        self.scores["grammar"] = min(96, self.scores["grammar"] + random.randint(1, 4))
        
        await self.send_to_client({
            "type": "score_update",
            "scores": self.scores
        })
        
        # Advance to next customer turn if available
        if self.current_turn < len(self.mock_script):
            await asyncio.sleep(1.5)
            await self._play_turn(self.current_turn)
        else:
            # End of scenario -> Generate final scorecard
            await asyncio.sleep(1.0)
            await self.generate_final_scorecard()

    async def generate_final_scorecard(self):
        scorecard = {
            "overall_cefr_level": "C1",
            "fluency_score": self.scores["fluency"],
            "lexical_score": self.scores["lexical"],
            "grammar_score": self.scores["grammar"],
            "pronunciation_score": self.scores["pronunciation"],
            "empathy_score": self.scores["empathy"],
            "key_strengths": [
                "Exceptional active listening and immediate validation of customer panic.",
                "Clear, concise explanation of the dispute and card-locking procedure.",
                "Fluid conversational cadence without prolonged hesitation or unnatural pauses."
            ],
            "development_areas": [
                "Minor opportunity to offer self-service alerts for future unauthorized activity.",
                "Ensure standard wrap-up compliance phrasing is recited verbatim."
            ],
            "hiring_recommendation": "STRONG_HIRE",
            "summary_verdict": (
                "Candidate demonstrates advanced C1 spoken English proficiency, high empathy, "
                "and strong de-escalation capability under pressure. Recommended for Tier-2 customer advocacy or high-value accounts."
            )
        }
        
        await self.send_to_client({
            "type": "tool_call",
            "tool_name": "generate_candidate_scorecard",
            "args": scorecard
        })
        
        await self.send_to_client({
            "type": "interview_completed",
            "scorecard": scorecard
        })

    async def stop(self):
        self.is_active = False
        print("[MockAgent] Simulation stopped.")
