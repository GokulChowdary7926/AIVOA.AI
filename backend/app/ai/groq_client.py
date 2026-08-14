import json
from langchain_groq import ChatGroq
from app.config import settings

# Fast/cheap model for most nodes (per assignment spec)
llm_fast = ChatGroq(
    api_key=settings.GROQ_API_KEY,
    model=settings.GROQ_MODEL,          # gemma2-9b-it
    temperature=0.2,
)

# Larger model available for nodes needing more reasoning (e.g. root cause / CAPA)
llm_large = ChatGroq(
    api_key=settings.GROQ_API_KEY,
    model=settings.GROQ_MODEL_LARGE,    # llama-3.3-70b-versatile
    temperature=0.2,
)


def call_llm_json(prompt: str, use_large: bool = False) -> dict:
    """
    Calls Groq LLM and forces JSON-only output.
    Returns a parsed dict; falls back to {"raw": text} if parsing fails.
    """
    llm = llm_large if use_large else llm_fast
    system = (
        "You are an assistant in a pharmaceutical Quality Management System (QMS). "
        "Always respond with STRICT valid JSON only. No markdown, no commentary, "
        "no ```json fences — just the raw JSON object."
    )
    response = llm.invoke([
        ("system", system),
        ("human", prompt),
    ])
    text = response.content.strip()
    text = text.replace("```json", "").replace("```", "").strip()
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return {"raw": text}
