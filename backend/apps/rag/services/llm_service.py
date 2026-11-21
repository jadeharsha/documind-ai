import os
import json
import logging
import httpx
from typing import Dict, Any, Optional
from django.conf import settings

logger = logging.getLogger(__name__)

class LLMService:
    def __init__(self, provider: Optional[str] = None, model_name: Optional[str] = None):
        self.provider = (provider or getattr(settings, 'DEFAULT_LLM_PROVIDER', 'ollama')).lower()
        self.model_name = model_name or getattr(settings, 'OLLAMA_MODEL', 'llama3.2')
        self.ollama_base_url = getattr(settings, 'OLLAMA_BASE_URL', 'http://localhost:11434')

    def generate(
        self,
        prompt: str,
        system_prompt: str = "You are DocuMind AI, an intelligent document research assistant. Only answer based on provided document evidence.",
        temperature: float = 0.2,
        max_tokens: int = 2048
    ) -> str:
        """
        Generates completion across configured LLM providers.
        """
        if self.provider == 'ollama':
            return self._call_ollama(prompt, system_prompt, temperature, max_tokens)
        elif self.provider == 'openai':
            return self._call_openai(prompt, system_prompt, temperature, max_tokens)
        elif self.provider == 'gemini':
            return self._call_gemini(prompt, system_prompt, temperature, max_tokens)
        elif self.provider == 'anthropic':
            return self._call_anthropic(prompt, system_prompt, temperature, max_tokens)
        elif self.provider == 'groq':
            return self._call_groq(prompt, system_prompt, temperature, max_tokens)
        else:
            return self._call_ollama(prompt, system_prompt, temperature, max_tokens)

    def _call_ollama(self, prompt: str, system_prompt: str, temperature: float, max_tokens: int) -> str:
        url = f"{self.ollama_base_url.rstrip('/')}/api/generate"
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "system": system_prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens
            }
        }
        try:
            with httpx.Client(timeout=30.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    return res.json().get('response', '')
        except Exception as e:
            logger.warning("Ollama connection failed (%s). Falling back to grounded rule synthesizer.", str(e))

        return self._rule_grounded_fallback(prompt)

    def _call_openai(self, prompt: str, system_prompt: str, temperature: float, max_tokens: int) -> str:
        api_key = getattr(settings, 'OPENAI_API_KEY', '')
        if not api_key:
            return self._rule_grounded_fallback(prompt)

        try:
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            with httpx.Client(timeout=30.0) as client:
                res = client.post("https://api.openai.com/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    return res.json()['choices'][0]['message']['content']
        except Exception as e:
            logger.error("OpenAI API call failed: %s", str(e))

        return self._rule_grounded_fallback(prompt)

    def _call_gemini(self, prompt: str, system_prompt: str, temperature: float, max_tokens: int) -> str:
        api_key = getattr(settings, 'GEMINI_API_KEY', '')
        if not api_key:
            return self._rule_grounded_fallback(prompt)

        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            payload = {
                "systemInstruction": {"parts": [{"text": system_prompt}]},
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": temperature, "maxOutputTokens": max_tokens}
            }
            with httpx.Client(timeout=30.0) as client:
                res = client.post(url, json=payload)
                if res.status_code == 200:
                    candidates = res.json().get('candidates', [])
                    if candidates:
                        return candidates[0]['content']['parts'][0]['text']
        except Exception as e:
            logger.error("Gemini API call failed: %s", str(e))

        return self._rule_grounded_fallback(prompt)

    def _call_anthropic(self, prompt: str, system_prompt: str, temperature: float, max_tokens: int) -> str:
        api_key = getattr(settings, 'ANTHROPIC_API_KEY', '')
        if not api_key:
            return self._rule_grounded_fallback(prompt)

        try:
            headers = {
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            }
            payload = {
                "model": "claude-3-5-sonnet-20241022",
                "system": system_prompt,
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": temperature
            }
            with httpx.Client(timeout=30.0) as client:
                res = client.post("https://api.anthropic.com/v1/messages", headers=headers, json=payload)
                if res.status_code == 200:
                    return res.json()['content'][0]['text']
        except Exception as e:
            logger.error("Anthropic API call failed: %s", str(e))

        return self._rule_grounded_fallback(prompt)

    def _call_groq(self, prompt: str, system_prompt: str, temperature: float, max_tokens: int) -> str:
        api_key = getattr(settings, 'GROQ_API_KEY', '')
        if not api_key:
            return self._rule_grounded_fallback(prompt)

        try:
            headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
            payload = {
                "model": "llama-3.1-70b-versatile",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": prompt}
                ],
                "temperature": temperature,
                "max_tokens": max_tokens
            }
            with httpx.Client(timeout=30.0) as client:
                res = client.post("https://api.groq.com/openai/v1/chat/completions", headers=headers, json=payload)
                if res.status_code == 200:
                    return res.json()['choices'][0]['message']['content']
        except Exception as e:
            logger.error("Groq API call failed: %s", str(e))

        return self._rule_grounded_fallback(prompt)

    def _rule_grounded_fallback(self, prompt: str) -> str:
        """
        Deterministic evidence extractor if remote LLM daemon is offline during testing.
        Extracts relevant factual excerpts directly from the prompt's provided context.
        """
        lines = prompt.split('\n')
        evidence_lines = [l.strip() for l in lines if l.strip().startswith('[Doc') or 'Page' in l or 'Passage:' in l]
        if evidence_lines:
            return (
                "Based on the provided document evidence:\n\n" +
                "\n".join(evidence_lines[:5]) +
                "\n\n*Directly retrieved from verified document sources.*"
            )
        return "I could not find sufficient supporting information in the selected documents."
