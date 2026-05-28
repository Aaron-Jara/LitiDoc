from __future__ import annotations

import asyncio
import time
from typing import Any

import aiohttp
import anthropic
from anthropic import APIConnectionError, APIStatusError, RateLimitError

from config import settings

ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
ANTHROPIC_VERSION = "2023-06-01"
DEFAULT_MODEL = "claude-sonnet-4-6"
MAX_RETRIES = 3


class ClaudeClient:
    """Wrapper around Anthropic Claude with retries and request logging."""

    def __init__(self, api_key: str | None = None, model: str = DEFAULT_MODEL) -> None:
        self.api_key = api_key or settings.ANTHROPIC_API_KEY
        self.model = model
        self._sync_client = anthropic.Anthropic(api_key=self.api_key)

    def generate(
        self,
        prompt: str,
        system_prompt: str | None = None,
        max_tokens: int = 4000,
    ) -> str:
        self._log_call(
            mode="sync",
            model=self.model,
            max_tokens=max_tokens,
            prompt_chars=len(prompt),
            has_system=bool(system_prompt),
        )

        last_error: Exception | None = None

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                kwargs: dict[str, Any] = {
                    "model": self.model,
                    "max_tokens": max_tokens,
                    "messages": [{"role": "user", "content": prompt}],
                }
                if system_prompt:
                    kwargs["system"] = system_prompt

                response = self._sync_client.messages.create(**kwargs)
                text = self._extract_text(response)
                self._log_success(mode="sync", attempt=attempt, response_chars=len(text))
                return text
            except (RateLimitError, APIConnectionError, APIStatusError) as error:
                last_error = error
                if attempt >= MAX_RETRIES or not self._is_retryable(error):
                    break
                delay = self._backoff_seconds(attempt)
                self._log_retry(mode="sync", attempt=attempt, delay=delay, error=error)
                time.sleep(delay)

        raise RuntimeError(
            f"Claude API request failed after {MAX_RETRIES} attempts: {last_error}"
        ) from last_error

    async def generate_async(
        self,
        session: aiohttp.ClientSession,
        prompt: str,
        system_prompt: str | None = None,
        max_tokens: int = 4000,
    ) -> str:
        self._log_call(
            mode="async",
            model=self.model,
            max_tokens=max_tokens,
            prompt_chars=len(prompt),
            has_system=bool(system_prompt),
        )

        payload = self._build_payload(prompt, system_prompt, max_tokens)
        headers = self._build_headers()
        last_error: Exception | None = None

        for attempt in range(1, MAX_RETRIES + 1):
            try:
                async with session.post(
                    ANTHROPIC_API_URL,
                    headers=headers,
                    json=payload,
                    timeout=aiohttp.ClientTimeout(total=120),
                ) as response:
                    body = await response.json(content_type=None)

                    if response.status == 429 or response.status >= 500:
                        raise aiohttp.ClientResponseError(
                            request_info=response.request_info,
                            history=response.history,
                            status=response.status,
                            message=body.get("error", {}).get(
                                "message", f"HTTP {response.status}"
                            ),
                        )

                    if response.status >= 400:
                        message = body.get("error", {}).get(
                            "message", f"HTTP {response.status}"
                        )
                        raise RuntimeError(message)

                    text = self._extract_text_from_body(body)
                    self._log_success(
                        mode="async", attempt=attempt, response_chars=len(text)
                    )
                    return text
            except (aiohttp.ClientError, asyncio.TimeoutError, RuntimeError) as error:
                last_error = error
                if attempt >= MAX_RETRIES or not self._is_retryable(error):
                    break
                delay = self._backoff_seconds(attempt)
                self._log_retry(mode="async", attempt=attempt, delay=delay, error=error)
                await asyncio.sleep(delay)

        raise RuntimeError(
            f"Claude async request failed after {MAX_RETRIES} attempts: {last_error}"
        ) from last_error

    def _build_payload(
        self,
        prompt: str,
        system_prompt: str | None,
        max_tokens: int,
    ) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": self.model,
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}],
        }
        if system_prompt:
            payload["system"] = system_prompt
        return payload

    def _build_headers(self) -> dict[str, str]:
        return {
            "x-api-key": self.api_key,
            "anthropic-version": ANTHROPIC_VERSION,
            "content-type": "application/json",
        }

    @staticmethod
    def _extract_text(response: Any) -> str:
        if not response.content:
            return ""
        first_block = response.content[0]
        return getattr(first_block, "text", str(first_block))

    @staticmethod
    def _extract_text_from_body(body: dict[str, Any]) -> str:
        content = body.get("content", [])
        if not content:
            return ""
        return content[0].get("text", "")

    @staticmethod
    def _backoff_seconds(attempt: int) -> float:
        return float(2 ** (attempt - 1))

    @staticmethod
    def _is_retryable(error: Exception) -> bool:
        if isinstance(error, RateLimitError):
            return True
        if isinstance(error, APIConnectionError):
            return True
        if isinstance(error, APIStatusError):
            return error.status_code in {429, 500, 502, 503, 504}
        if isinstance(error, aiohttp.ClientResponseError):
            return error.status in {429, 500, 502, 503, 504}
        if isinstance(error, (aiohttp.ClientError, asyncio.TimeoutError)):
            return True
        return False

    @staticmethod
    def _log_call(
        *,
        mode: str,
        model: str,
        max_tokens: int,
        prompt_chars: int,
        has_system: bool,
    ) -> None:
        print(
            f"[ClaudeClient:{mode}] model={model} max_tokens={max_tokens} "
            f"prompt_chars={prompt_chars} system={has_system}"
        )

    @staticmethod
    def _log_success(*, mode: str, attempt: int, response_chars: int) -> None:
        print(
            f"[ClaudeClient:{mode}] success attempt={attempt} "
            f"response_chars={response_chars}"
        )

    @staticmethod
    def _log_retry(*, mode: str, attempt: int, delay: float, error: Exception) -> None:
        print(
            f"[ClaudeClient:{mode}] retry attempt={attempt} "
            f"delay={delay}s error={type(error).__name__}: {error}"
        )
