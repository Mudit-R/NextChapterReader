import os
import math
import threading
from collections import deque
from typing import Any, Dict, Optional


def _rate(name: str) -> float:
    try:
        return max(0.0, float(os.getenv(name, "0")))
    except ValueError:
        return 0.0


class UsageTracker:
    """Thread-safe token, estimated-cost, and bounded latency accounting."""

    _LATENCY_WINDOW_SIZE = 10_000
    _LATENCY_STAGES = (
        "retrieval_ms",
        "model_ms",
        "time_to_first_token_ms",
        "total_ms",
    )

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._totals = {"requests": 0, "prompt_tokens": 0, "completion_tokens": 0, "total_tokens": 0, "estimated_cost_usd": 0.0}
        self._latency_requests = 0
        self._latencies = {
            stage: deque(maxlen=self._LATENCY_WINDOW_SIZE)
            for stage in self._LATENCY_STAGES
        }

    @staticmethod
    def _value(usage: Any, *names: str) -> int:
        for name in names:
            value = usage.get(name) if isinstance(usage, dict) else getattr(usage, name, None)
            if value is not None:
                try:
                    return max(0, int(value))
                except (TypeError, ValueError):
                    pass
        return 0

    def record(self, usage: Optional[Any], model: str, source: str = "groq") -> Optional[Dict[str, Any]]:
        if usage is None:
            return None

        prompt = self._value(usage, "prompt_tokens", "input_tokens")
        completion = self._value(usage, "completion_tokens", "output_tokens")
        reported_total = self._value(usage, "total_tokens")
        if not any((prompt, completion, reported_total)):
            return None
        total = reported_total or prompt + completion
        cost = (prompt / 1_000_000) * _rate("GROQ_INPUT_COST_PER_1M") + (completion / 1_000_000) * _rate("GROQ_OUTPUT_COST_PER_1M")
        with self._lock:
            self._totals["requests"] += 1
            self._totals["prompt_tokens"] += prompt
            self._totals["completion_tokens"] += completion
            self._totals["total_tokens"] += total
            self._totals["estimated_cost_usd"] += cost
        return {"model": model, "source": source, "prompt_tokens": prompt, "completion_tokens": completion, "total_tokens": total, "estimated_cost_usd": round(cost, 8)}

    def record_latency(self, timings_ms: Dict[str, float]) -> None:
        """Record query stages without retaining request content."""
        with self._lock:
            self._latency_requests += 1
            for stage in self._LATENCY_STAGES:
                value = timings_ms.get(stage)
                if value is not None:
                    self._latencies[stage].append(max(0.0, float(value)))

    @staticmethod
    def _percentile(sorted_values: list[float], percentile: float) -> float:
        if not sorted_values:
            return 0.0
        index = max(0, math.ceil(percentile * len(sorted_values)) - 1)
        return sorted_values[min(index, len(sorted_values) - 1)]

    def report(self) -> Dict[str, Any]:
        with self._lock:
            totals = dict(self._totals)
            latency_requests = self._latency_requests
            latency_samples = {
                stage: sorted(values)
                for stage, values in self._latencies.items()
            }

        totals["estimated_cost_usd"] = round(totals["estimated_cost_usd"], 8)
        latency = {
            "request_count": latency_requests,
            "window_size": self._LATENCY_WINDOW_SIZE,
            "stages": {},
        }
        for stage, values in latency_samples.items():
            latency["stages"][stage] = {
                "sample_count": len(values),
                "mean_ms": round(sum(values) / len(values), 3) if values else 0.0,
                "p50_ms": round(self._percentile(values, 0.50), 3),
                "p95_ms": round(self._percentile(values, 0.95), 3),
                "p99_ms": round(self._percentile(values, 0.99), 3),
            }

        return {
            "totals": totals,
            "latency": latency,
            "pricing": {
                "input_cost_per_1m_usd": _rate("GROQ_INPUT_COST_PER_1M"),
                "output_cost_per_1m_usd": _rate("GROQ_OUTPUT_COST_PER_1M"),
            },
        }
