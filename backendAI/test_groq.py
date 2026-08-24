from groq import Groq
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv('GROQ_API_KEY')
print(f'API Key: {api_key[:20]}...')

def get_preferred_model(client):
    PREFERRED_MODELS = [
        "openai/gpt-oss-20b",
        "qwen/qwen3.6-27b",
        "openai/gpt-oss-120b",
        "llama-3.3-70b-versatile",
        "llama-3.1-8b-instant",
        "llama3-8b-8192"
    ]
    try:
        available = {m.id for m in client.models.list().data}
        for pm in PREFERRED_MODELS:
            if pm in available:
                return pm
        return list(available)[0] if available else "openai/gpt-oss-20b"
    except Exception:
        return "openai/gpt-oss-20b"

try:
    client = Groq(api_key=api_key)
    model = get_preferred_model(client)
    print(f"Selected Model: {model}")
    res = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": "Say hello from NextChapter in one sentence."}],
        max_tokens=30
    )
    print("Groq Response:", res.choices[0].message.content)
except Exception as e:
    print(f"Error: {e}")

