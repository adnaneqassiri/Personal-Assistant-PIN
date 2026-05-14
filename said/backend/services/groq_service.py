import json
import os
from groq import Groq
from dotenv import load_dotenv

from backend.services.prompt_service import build_intent_detection_prompt

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

client = Groq(api_key=GROQ_API_KEY)


def generate_answer_with_groq(system_prompt: str, user_prompt: str) -> str:
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is missing. Add it to your .env file.")

    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        temperature=0.3,
        max_completion_tokens=900
    )

    return completion.choices[0].message.content


def detect_intent_with_groq(question: str) -> str:
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY is missing. Add it to your .env file.")

    system_prompt, user_prompt = build_intent_detection_prompt(question)

    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {
                "role": "system",
                "content": system_prompt
            },
            {
                "role": "user",
                "content": user_prompt
            }
        ],
        temperature=0,
        max_completion_tokens=80
    )

    raw_response = completion.choices[0].message.content.strip()

    try:
        data = json.loads(raw_response)
        intent = data.get("intent", "general_contextual_question")

        allowed_intents = {
            "meeting_summary",
            "daily_summary",
            "contextual_recommendation",
            "action_items",
            "location_question",
            "general_contextual_question"
        }

        if intent not in allowed_intents:
            return "general_contextual_question"

        return intent

    except Exception:
        return "general_contextual_question"