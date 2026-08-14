import json
import re
import logging
from langchain_groq import ChatGroq
from app.config import settings

logger = logging.getLogger(__name__)


def _get_llm(use_large: bool = False):
    api_key = settings.GROQ_API_KEY.strip()
    if not api_key:
        return None
    model_name = settings.GROQ_MODEL_LARGE if use_large else settings.GROQ_MODEL
    try:
        return ChatGroq(
            api_key=api_key,
            model=model_name,
            temperature=0.2,
        )
    except Exception as e:
        logger.warning(f"Failed to initialize ChatGroq ({model_name}): {e}")
        return None


def call_llm_json(prompt: str, use_large: bool = False) -> dict:
    """
    Calls Groq LLM and forces JSON-only output.
    Returns a parsed dict; falls back to robust parsed state if API key is unconfigured or fails.
    """
    llm = _get_llm(use_large)
    if llm:
        system = (
            "You are an expert assistant in a pharmaceutical Quality Management System (QMS) "
            "complying with GMP, 21 CFR Part 211, and ICH Q10 guidelines. "
            "Always respond with STRICT valid JSON only. No markdown, no commentary, "
            "no ```json fences — just the raw JSON object."
        )
        try:
            response = llm.invoke([
                ("system", system),
                ("human", prompt),
            ])
            text = response.content.strip()
            # Clean markdown codeblocks
            text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.MULTILINE)
            text = re.sub(r"\s*```$", "", text, flags=re.MULTILINE).strip()
            
            # Find json block if surrounded by extra text
            match = re.search(r"(\{.*\}|\[.*\])", text, re.DOTALL)
            if match:
                text = match.group(1)

            return json.loads(text)
        except Exception as e:
            logger.warning(f"Groq API call or JSON parse failed: {e}")

    # Fallback response strategy if Groq API key is omitted or failed
    return {"raw_fallback": True}

