from __future__ import annotations

import json
import os
from typing import Any

import requests

MAX_MESSAGE_LENGTH = 1200
MAX_HISTORY_ITEMS = 8
LLM_TIMEOUT_SECONDS = 30


def _response_json(response: requests.Response, provider: str = "LLM") -> dict[str, Any]:
    try:
        data = response.json()
    except (ValueError, json.JSONDecodeError) as error:
        raise RuntimeError(
            f"{provider} returned HTTP {response.status_code} with an invalid JSON response"
        ) from error
    if not isinstance(data, dict):
        raise RuntimeError(f"{provider} returned an invalid response body")
    return data


def _messages(history: list[dict[str, str]], message: str) -> list[dict[str, str]]:
    result: list[dict[str, str]] = []
    for item in history[-MAX_HISTORY_ITEMS:]:
        if item.get("role") in {"user", "assistant"} and isinstance(item.get("content"), str):
            result.append({"role": item["role"], "content": item["content"][:MAX_MESSAGE_LENGTH]})
    result.append({"role": "user", "content": message})
    return result


def _system_prompt(context: dict[str, Any]) -> str:
    return (
        "You are Tadawol, a cautious agricultural advisor. Explain only the supplied "
        "farm context and computed rotation results. Never invent weather, crop prices, "
        "or scores. Do not change backend scores. State when data is missing, mention "
        "that NASA POWER and Earth Engine are regional/modelled products, and recommend "
        "local agronomist or soil-test validation for high-risk decisions. Answer in "
        f"the user's language when clear. Context JSON: {context}"
    )


def _call_groq(
    system_prompt: str, messages: list[dict[str, str]]
) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    response = requests.post(
        os.getenv("OPENAI_BASE_URL", "https://api.groq.com/openai/v1").rstrip("/")
        + "/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        json={
            "model": os.getenv("OPENAI_MODEL", "llama-3.3-70b-versatile"),
            "messages": [{"role": "system", "content": system_prompt}, *messages],
            "max_tokens": 700,
            "temperature": 0.2,
        },
        timeout=LLM_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    data = _response_json(response, "Groq")
    answer = data.get("choices", [{}])[0].get("message", {}).get("content")
    if not isinstance(answer, str) or not answer.strip():
        raise RuntimeError("Groq returned an empty answer")
    return answer.strip()


def answer(
    message: str, context: dict[str, Any], history: list[dict[str, str]]
) -> dict[str, Any]:
    clean_message = message.strip()
    if not clean_message or len(clean_message) > MAX_MESSAGE_LENGTH:
        raise ValueError(f"message must contain 1-{MAX_MESSAGE_LENGTH} characters")
    if not isinstance(history, list):
        history = []
    try:
        response = _call_groq(
            _system_prompt(context),
            _messages(history, clean_message),
        )
    except (requests.RequestException, RuntimeError) as error:
        raise RuntimeError(f"Groq advisor unavailable: {error}") from error
    return {
        "answer": response,
        "provider": "groq",
        "fallback": False,
        "fallback_reason": None,
    }
