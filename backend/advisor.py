from __future__ import annotations

import os
import json
from typing import Any

import requests

MAX_MESSAGE_LENGTH = 1200
MAX_HISTORY_ITEMS = 8
LLM_TIMEOUT_SECONDS = 30


def _response_json(response: requests.Response, provider: str) -> dict[str, Any]:
    try:
        data = response.json()
    except (ValueError, json.JSONDecodeError) as error:
        excerpt = response.text[:300].replace("\n", " ")
        raise RuntimeError(
            f"{provider} returned HTTP {response.status_code} with non-JSON response: {excerpt}"
        ) from error
    if not isinstance(data, dict):
        raise RuntimeError(f"{provider} returned an invalid response body")
    return data


def _fallback_answer(message: str, context: dict[str, Any]) -> str:
    question = message.lower()
    farm = context.get("farm_name", "your farm")
    nasa = context.get("nasa", {})
    moisture = nasa.get("root_moisture_pct", "unavailable")
    rainfall = nasa.get("annual_rain_mm", "unavailable")
    strategy = context.get("active_rotation", "the selected rotation")
    if any(word in question for word in ("water", "dry", "drought", "irrigat", "rain")):
        return (
            f"For {farm}, NASA POWER reports {moisture}% root-zone wetness and "
            f"{rainfall} mm/year of rainfall. Use the selected {strategy} and check "
            "soil moisture before irrigation; local soil testing should confirm the final schedule."
        )
    if any(word in question for word in ("rotation", "crop", "plant", "sow", "fertiliz", "nitrogen")):
        return (
            f"The backend ranked {strategy} using NASA climate data, soil priorities, "
            "water demand, nitrogen contribution, and erosion protection. Keep the "
            "rotation score as the decision baseline and validate seed availability locally."
        )
    return (
        f"I can help interpret the NASA POWER and Earth Engine results for {farm}. "
        "Ask about water, sowing, fertilizer, erosion, or comparing rotations."
    )


def _messages(system_prompt: str, history: list[dict[str, str]], message: str) -> list[dict[str, str]]:
    result = [{"role": "system", "content": system_prompt}]
    for item in history[-MAX_HISTORY_ITEMS:]:
        if item.get("role") in {"user", "assistant"} and isinstance(item.get("content"), str):
            result.append({"role": item["role"], "content": item["content"][:MAX_MESSAGE_LENGTH]})
    result.append({"role": "user", "content": message})
    return result


def _system_prompt(context: dict[str, Any]) -> str:
    return (
        "You are Tadawol, a cautious agricultural advisor. Explain only the supplied "
        "farm context and computed rotation results. Never invent weather, crop prices, "
        "or scores. Do not change or recalculate backend scores. State when data is "
        "missing, mention that NASA POWER and Earth Engine are regional/modelled "
        "products, and recommend local agronomist or soil-test validation for high-risk "
        f"decisions. Answer in the user's language when clear. Context JSON: {context}"
    )


def _call_openai(messages: list[dict[str, str]]) -> tuple[str, str]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured")
    response = requests.post(
        os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1/chat/completions"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        json={"model": os.getenv("OPENAI_MODEL", "gpt-4o-mini"), "messages": messages, "temperature": 0.2},
        timeout=LLM_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    data = _response_json(response, "OpenAI")
    answer = data.get("choices", [{}])[0].get("message", {}).get("content")
    if not isinstance(answer, str) or not answer.strip():
        raise RuntimeError("LLM returned an empty answer")
    return answer.strip(), "openai"


def _call_github_models(messages: list[dict[str, str]]) -> tuple[str, str]:
    token = os.getenv("GITHUB_TOKEN")
    if not token:
        raise RuntimeError("GITHUB_TOKEN is not configured")
    response = requests.post(
        os.getenv(
            "GITHUB_MODELS_URL",
            "https://models.github.ai/inference/chat/completions",
        ),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={
            "model": os.getenv("GITHUB_MODELS_MODEL", "openai/gpt-4o-mini"),
            "messages": messages,
            "temperature": 0.2,
        },
        timeout=LLM_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    data = _response_json(response, "GitHub Models")
    answer = data.get("choices", [{}])[0].get("message", {}).get("content")
    if not isinstance(answer, str) or not answer.strip():
        raise RuntimeError("GitHub Models returned an empty answer")
    return answer.strip(), "github-models"


def _call_azure(messages: list[dict[str, str]]) -> tuple[str, str]:
    endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
    api_key = os.getenv("AZURE_OPENAI_API_KEY")
    deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
    if not endpoint or not api_key or not deployment:
        raise RuntimeError("Azure OpenAI is not fully configured")
    url = f"{endpoint.rstrip('/')}/openai/deployments/{deployment}/chat/completions"
    response = requests.post(
        url,
        params={"api-version": os.getenv("AZURE_OPENAI_API_VERSION", "2024-10-21")},
        headers={"api-key": api_key, "Content-Type": "application/json"},
        json={"messages": messages, "temperature": 0.2},
        timeout=LLM_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    data = _response_json(response, "Azure OpenAI")
    answer = data.get("choices", [{}])[0].get("message", {}).get("content")
    if not isinstance(answer, str) or not answer.strip():
        raise RuntimeError("LLM returned an empty answer")
    return answer.strip(), "azure-openai"


def answer(message: str, context: dict[str, Any], history: list[dict[str, str]]) -> dict[str, Any]:
    clean_message = message.strip()
    if not clean_message or len(clean_message) > MAX_MESSAGE_LENGTH:
        raise ValueError(f"message must contain 1-{MAX_MESSAGE_LENGTH} characters")
    safe_history = history if isinstance(history, list) else []
    messages = _messages(_system_prompt(context), safe_history, clean_message)
    provider_errors: list[str] = []
    for provider in (_call_github_models, _call_azure, _call_openai):
        try:
            response, name = provider(messages)
            return {"answer": response, "provider": name, "fallback": False, "fallback_reason": None}
        except (requests.RequestException, RuntimeError) as error:
            provider_errors.append(str(error))
    return {
        "answer": _fallback_answer(clean_message, context),
        "provider": "deterministic-fallback",
        "fallback": True,
        "fallback_reason": "; ".join(provider_errors),
    }
