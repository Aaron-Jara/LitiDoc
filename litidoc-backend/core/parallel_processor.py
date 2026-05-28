from __future__ import annotations

import asyncio
from typing import Any

import aiohttp

from config import settings
from core.claude_client import ClaudeClient


class ParallelProcessor:
    """Process document chunks in parallel with concurrency limits."""

    def __init__(
        self,
        client: ClaudeClient | None = None,
        max_concurrent: int | None = None,
        max_tokens: int = 4000,
    ) -> None:
        self.client = client or ClaudeClient()
        self.max_concurrent = max_concurrent or settings.MAX_CONCURRENT
        self.max_tokens = max_tokens

    def process_chunks(
        self,
        chunks: list[dict],
        prompt_template: str,
        system_prompt: str,
    ) -> list[dict]:
        """Run async chunk processing from sync code."""
        return asyncio.run(
            self.process_chunks_async(chunks, prompt_template, system_prompt)
        )

    async def process_chunks_async(
        self,
        chunks: list[dict],
        prompt_template: str,
        system_prompt: str,
    ) -> list[dict]:
        if not chunks:
            return []

        semaphore = asyncio.Semaphore(self.max_concurrent)
        print(
            f"[ParallelProcessor] starting chunks={len(chunks)} "
            f"max_concurrent={self.max_concurrent}"
        )

        async with aiohttp.ClientSession() as session:
            tasks = [
                self._process_single_chunk(
                    session=session,
                    semaphore=semaphore,
                    chunk=chunk,
                    prompt_template=prompt_template,
                    system_prompt=system_prompt,
                )
                for chunk in chunks
            ]
            results = await asyncio.gather(*tasks)

        print(
            f"[ParallelProcessor] completed success="
            f"{sum(1 for r in results if not r.get('error'))}/{len(results)}"
        )
        return results

    async def _process_single_chunk(
        self,
        session: aiohttp.ClientSession,
        semaphore: asyncio.Semaphore,
        chunk: dict,
        prompt_template: str,
        system_prompt: str,
    ) -> dict:
        chunk_id = chunk.get("chunk_id", "unknown")
        result: dict[str, Any] = {**chunk, "response": None, "error": None}

        async with semaphore:
            try:
                prompt = self._format_prompt(prompt_template, chunk)
                response_text = await self.client.generate_async(
                    session=session,
                    prompt=prompt,
                    system_prompt=system_prompt,
                    max_tokens=self.max_tokens,
                )
                result["response"] = response_text
            except Exception as error:
                result["error"] = str(error)
                print(
                    f"[ParallelProcessor] chunk failed id={chunk_id} "
                    f"error={type(error).__name__}: {error}"
                )

        return result

    @staticmethod
    def _format_prompt(prompt_template: str, chunk: dict) -> str:
        chunk_text = chunk.get("chunk_text", chunk.get("text", ""))
        replacements = {
            "chunk_id": str(chunk.get("chunk_id", "")),
            "text": chunk_text,
            "chunk_text": chunk_text,
            "page_range": str(chunk.get("page_range", "")),
            "start_word": str(chunk.get("start_word", 0)),
            "end_word": str(chunk.get("end_word", 0)),
        }
        prompt = prompt_template
        for key, value in replacements.items():
            prompt = prompt.replace(f"{{{key}}}", value)
        return prompt
