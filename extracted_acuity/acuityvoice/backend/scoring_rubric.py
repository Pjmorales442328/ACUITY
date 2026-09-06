"""
AcuityVoice - Evaluation Rubrics, System Prompts & AssemblyAI Tool Schemas
"""

# Available Interview Scenarios
SCENARIOS = {
    "fintech_dispute": {
        "title": "Fintech Card Dispute & Unauthorized Charge",
        "description": "Simulates a customer who noticed an unexpected $45.00 recurring charge on their credit card. Tests de-escalation, verification, and problem-solving.",
        "difficulty": "Intermediate / High Stakes",
        "customer_persona": (
            "You are Jordan Reynolds, a busy and frustrated cardholder calling ApexPay customer care. "
            "You just noticed a strange $45.00 transaction on your statement from an unknown vendor called 'CloudStream Pro'. "
            "You are stressed because your rent is due and you suspect fraud. "
            "Your behavior rules:\n"
            "1. Start firm and anxious: State your problem clearly in 1-2 sentences.\n"
            "2. If the agent interrupts you politely or shows genuine empathy ('I completely understand how stressful this is, Jordan'), soften your tone.\n"
            "3. If the agent is robotic, dismissive, or uses scripted platitudes without listening, become more impatient.\n"
            "4. Follow turn-taking: Keep every spoken turn strictly under 2 sentences (15-25 words max) so the candidate has room to speak.\n"
            "5. After 3-4 turns, if the candidate offers to block the card, reverse the fee, or initiate an investigation, express relief and thank them.\n"
            "6. Call the provided tools whenever you detect linguistic markers, shift your sentiment, or end the call."
        )
    },
    "ecommerce_delivery": {
        "title": "E-Commerce Lost Birthday Gift",
        "description": "A customer whose high-priority gift order was marked 'Delivered' but cannot be found. Tests active listening, reassurance, and solution-oriented recovery.",
        "difficulty": "Standard Customer Care",
        "customer_persona": (
            "You are Taylor Brooks. You ordered a custom smartwatch as a birthday present for your daughter. "
            "The tracking number said it was delivered to your front porch 2 hours ago, but you checked everywhere and nothing is there. "
            "The birthday party is tomorrow evening. You are distressed and need an immediate replacement or expedited solution.\n"
            "Keep turns concise (1-2 sentences). Respond warmly if the agent takes ownership; press for immediate answers if they ask you to just 'wait 48 hours'."
        )
    },
    "telecom_technical": {
        "title": "Broadband Internet Outage During Remote Work",
        "description": "A home-office professional whose fiber connection went down right before an executive board meeting. Tests technical de-escalation and composure under time pressure.",
        "difficulty": "Technical Support",
        "customer_persona": (
            "You are Alex Chen, a software engineering manager working remotely. "
            "Your fiber connection suddenly dropped red optical light 15 minutes before a company board presentation. "
            "You are on your phone hotspot, agitated, and asking why the network failed and how fast it can be restored.\n"
            "Keep turns concise (1-2 sentences). Welcome troubleshooting steps, but express urgency."
        )
    }
}

# AssemblyAI Voice Agent API Tool Definitions
ASSEMBLYAI_TOOLS = [
    {
        "name": "log_conversational_marker",
        "description": "Logs an observable linguistic, communicative, or behavioral marker exhibited by the candidate during their spoken turn.",
        "parameters": {
            "type": "object",
            "properties": {
                "marker_type": {
                    "type": "string",
                    "enum": [
                        "EMPATHY_DEMONSTRATED",
                        "ACTIVE_LISTENING",
                        "PROFESSIONAL_DE_ESCALATION",
                        "ADVANCED_VOCABULARY",
                        "GRAMMATICAL_ACCURACY",
                        "GRAMMAR_LAPSE",
                        "HESITATION_OR_FILLER",
                        "ROBOTIC_PHRASING"
                    ],
                    "description": "The category of behavioral or linguistic marker observed."
                },
                "candidate_quote": {
                    "type": "string",
                    "description": "The specific phrase or sentence spoken by the candidate that triggered this evaluation."
                },
                "impact": {
                    "type": "string",
                    "enum": ["POSITIVE", "NEGATIVE", "NEUTRAL"],
                    "description": "Whether this marker positively or negatively impacts customer interaction."
                },
                "coaching_note": {
                    "type": "string",
                    "description": "Short diagnostic comment explaining why this marker was logged."
                }
            },
            "required": ["marker_type", "candidate_quote", "impact", "coaching_note"]
        }
    },
    {
        "name": "update_customer_temperament",
        "description": "Updates the internal emotional and temperament state of the customer persona based on how the candidate is handling the interaction.",
        "parameters": {
            "type": "object",
            "properties": {
                "new_temperament": {
                    "type": "string",
                    "enum": ["AGITATED_ANXIOUS", "DEFENSIVE", "NEUTRAL_ATTENTIVE", "REASSURED_CALMED", "SATISFIED_GRATEFUL"],
                    "description": "The updated customer emotional state."
                },
                "trigger_reason": {
                    "type": "string",
                    "description": "The candidate action or words that caused this emotional change."
                },
                "sentiment_score": {
                    "type": "integer",
                    "description": "Numeric sentiment rating from 0 (extremely angry) to 100 (fully delighted/calmed)."
                }
            },
            "required": ["new_temperament", "trigger_reason", "sentiment_score"]
        }
    },
    {
        "name": "generate_candidate_scorecard",
        "description": "Called at the end of the interview or when wrap-up is reached to compile the candidate's final CEFR score and hiring assessment.",
        "parameters": {
            "type": "object",
            "properties": {
                "overall_cefr_level": {
                    "type": "string",
                    "enum": ["A2", "B1", "B2", "C1", "C2"],
                    "description": "Overall Spoken English proficiency mapped to the Common European Framework of Reference for Languages."
                },
                "fluency_score": {
                    "type": "integer",
                    "description": "Fluency and conversational flow score (0-100)."
                },
                "lexical_score": {
                    "type": "integer",
                    "description": "Vocabulary range, accuracy, and domain appropriateness (0-100)."
                },
                "grammar_score": {
                    "type": "integer",
                    "description": "Grammatical range, syntax, and accuracy (0-100)."
                },
                "pronunciation_score": {
                    "type": "integer",
                    "description": "Phonetic intelligibility and clarity (0-100)."
                },
                "empathy_score": {
                    "type": "integer",
                    "description": "Customer de-escalation, composure, and emotional intelligence (0-100)."
                },
                "key_strengths": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Top 2-3 observed strengths of the candidate."
                },
                "development_areas": {
                    "type": "array",
                    "items": {"type": "string"},
                    "description": "Top 2-3 coaching or training recommendations."
                },
                "hiring_recommendation": {
                    "type": "string",
                    "enum": ["STRONG_HIRE", "HIRE", "HIRE_WITH_TRAINING", "DO_NOT_HIRE"],
                    "description": "Final recommendation for recruiter/hiring manager."
                },
                "summary_verdict": {
                    "type": "string",
                    "description": "Concise executive summary of candidate suitability for voice customer support roles."
                }
            },
            "required": [
                "overall_cefr_level",
                "fluency_score",
                "lexical_score",
                "grammar_score",
                "pronunciation_score",
                "empathy_score",
                "key_strengths",
                "development_areas",
                "hiring_recommendation",
                "summary_verdict"
            ]
        }
    }
]

def build_agent_system_prompt(scenario_key: str = "fintech_dispute") -> str:
    scenario = SCENARIOS.get(scenario_key, SCENARIOS["fintech_dispute"])
    prompt = f"""You are the voice evaluation engine for AcuityVoice. 
Your job is to conduct an interactive 3-minute oral roleplay interview with a job candidate applying for a customer service / BPO specialist role.

SCENARIO: {scenario['title']}
CUSTOMER PERSONA:
{scenario['customer_persona']}

ASSESSMENT INSTRUCTIONS:
1. Conduct yourself 100% in-character as the customer. Never break character or say 'As an AI'.
2. Speak concisely: Limit every turn to 1-2 sentences (under 25 words).
3. If the candidate speaks or interrupts while you are speaking, handle the turn naturally and acknowledge what they said.
4. Concurrently, use the provided tools to evaluate the candidate in real-time:
   - Call `log_conversational_marker` whenever the candidate says something notable (grammar error, great empathy, hesitation, advanced vocabulary).
   - Call `update_customer_temperament` as their statements change your simulated mood.
   - When the issue is resolved or after about 5-6 conversational turns, thank the candidate, state that you're satisfied with their help, and call `generate_candidate_scorecard` with their final comprehensive evaluation.
5. Voice & Tone: Natural, reactive, clear American English voice.
"""
    return prompt
