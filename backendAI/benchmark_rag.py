"""Opt-in sequential benchmark for an already indexed NextChapter RAG API.

The report contains aggregate timings and provider usage only. Query text is
never printed or written to the report.
"""
import argparse
import json
import math
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List
from urllib.parse import urlsplit, urlunsplit

import httpx


def _percentile(values: Iterable[float], percentile: float) -> float:
    ordered = sorted(values)
    if not ordered:
        return 0.0
    index = max(0, math.ceil(percentile * len(ordered)) - 1)
    return round(ordered[min(index, len(ordered) - 1)], 3)


def _summary(values: List[float]) -> Dict[str, Any]:
    return {
        "sample_count": len(values),
        "mean_ms": round(sum(values) / len(values), 3) if values else 0.0,
        "p50_ms": _percentile(values, 0.50),
        "p95_ms": _percentile(values, 0.95),
        "p99_ms": _percentile(values, 0.99),
    }


def _read_queries(path: Path) -> List[Dict[str, Any]]:
    queries = []
    for line_number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), start=1):
        if not line.strip():
            continue
        try:
            request = json.loads(line)
        except json.JSONDecodeError as error:
            raise ValueError(f"Invalid JSON on line {line_number}.") from error
        if not isinstance(request, dict) or not isinstance(request.get("message"), str):
            raise ValueError(f"Line {line_number} must be an object with a string 'message'.")
        queries.append(request)
    if not queries:
        raise ValueError("The query file contains no requests.")
    return queries


def _safe_endpoint(endpoint: str) -> str:
    parts = urlsplit(endpoint)
    host = parts.hostname or ""
    if parts.port:
        host = f"{host}:{parts.port}"
    return urlunsplit((parts.scheme, host, parts.path, "", ""))


def _request_sample(
    client: httpx.Client,
    endpoint: str,
    request: Dict[str, Any],
    stream: bool = False,
) -> Dict[str, Any]:
    started_at = time.perf_counter()
    try:
        if stream:
            first_event_ms = None
            done_payload = None
            stream_error = False
            with client.stream("POST", endpoint, json=request) as response:
                elapsed_before_read_ms = (time.perf_counter() - started_at) * 1000
                if response.is_error:
                    return {
                        "ok": False,
                        "status_code": response.status_code,
                        "client_total_ms": round(elapsed_before_read_ms, 3),
                        "error_type": "http_error",
                    }
                for line in response.iter_lines():
                    if not line.startswith("data:"):
                        continue
                    raw_event = line[5:].strip()
                    if not raw_event:
                        continue
                    try:
                        event = json.loads(raw_event)
                    except json.JSONDecodeError:
                        stream_error = True
                        continue
                    if event.get("type") == "token" and first_event_ms is None:
                        first_event_ms = (time.perf_counter() - started_at) * 1000
                    elif event.get("type") == "error":
                        stream_error = True
                    elif event.get("type") == "done":
                        done_payload = event

            elapsed_ms = (time.perf_counter() - started_at) * 1000
            if done_payload is None:
                return {
                    "ok": False,
                    "status_code": response.status_code,
                    "client_total_ms": round(elapsed_ms, 3),
                    "client_time_to_first_event_ms": round(first_event_ms, 3) if first_event_ms is not None else None,
                    "error_type": "incomplete_stream",
                }
            timings = done_payload.get("timings_ms", {})
            return {
                "ok": not stream_error and not done_payload.get("stream_error", False),
                "status_code": response.status_code,
                "client_total_ms": round(elapsed_ms, 3),
                "client_time_to_first_event_ms": round(first_event_ms, 3) if first_event_ms is not None else None,
                "server_timings_ms": timings if isinstance(timings, dict) else {},
                "usage": done_payload.get("usage") if isinstance(done_payload.get("usage"), dict) else None,
                "model": done_payload.get("model_used"),
                "error_type": "stream_error" if stream_error or done_payload.get("stream_error", False) else None,
            }

        response = client.post(endpoint, json=request)
        elapsed_ms = (time.perf_counter() - started_at) * 1000
        if response.is_error:
            return {
                "ok": False,
                "status_code": response.status_code,
                "client_total_ms": round(elapsed_ms, 3),
                "error_type": "http_error",
            }

        payload = response.json()
        usage = payload.get("usage") if isinstance(payload, dict) else None
        timings = payload.get("timings_ms", {}) if isinstance(payload, dict) else {}
        return {
            "ok": True,
            "status_code": response.status_code,
            "client_total_ms": round(elapsed_ms, 3),
            "server_timings_ms": timings if isinstance(timings, dict) else {},
            "usage": usage if isinstance(usage, dict) else None,
            "model": payload.get("model_used") if isinstance(payload, dict) else None,
        }
    except httpx.HTTPError as error:
        return {
            "ok": False,
            "status_code": None,
            "client_total_ms": round((time.perf_counter() - started_at) * 1000, 3),
            "error_type": type(error).__name__,
        }
    except (ValueError, TypeError) as error:
        return {
            "ok": False,
            "status_code": response.status_code if "response" in locals() else None,
            "client_total_ms": round((time.perf_counter() - started_at) * 1000, 3),
            "error_type": type(error).__name__,
        }


def _build_report(
    endpoint: str,
    queries: List[Dict[str, Any]],
    samples: List[Dict[str, Any]],
    runs: int,
    warmup: int,
    stream: bool = False,
) -> Dict[str, Any]:
    successful = [sample for sample in samples if sample["ok"]]
    stage_values = {
        stage: [
            float(sample["server_timings_ms"][stage])
            for sample in successful
            if stage in sample["server_timings_ms"]
        ]
        for stage in ("retrieval_ms", "model_ms", "time_to_first_token_ms", "total_ms")
    }
    provider_usage = [sample["usage"] for sample in successful if sample["usage"] is not None]
    token_totals = {
        name: sum(int(usage.get(name) or 0) for usage in provider_usage)
        for name in ("prompt_tokens", "completion_tokens", "total_tokens")
    }
    estimated_cost = sum(float(usage.get("estimated_cost_usd") or 0.0) for usage in provider_usage)
    models = sorted({sample["model"] for sample in successful if sample.get("model")})

    return {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "endpoint": _safe_endpoint(endpoint),
        "request_count": len(samples),
        "query_template_count": len(queries),
        "runs_per_query": runs,
        "warmup_per_query": warmup,
        "execution": "sequential",
        "streaming": stream,
        "successful_responses": len(successful),
        "failed_responses": len(samples) - len(successful),
        "models": models,
        "latency_ms": {
            "client_total": _summary([float(sample["client_total_ms"]) for sample in successful]),
            "client_time_to_first_event": _summary([
                float(sample["client_time_to_first_event_ms"])
                for sample in successful
                if sample.get("client_time_to_first_event_ms") is not None
            ]),
            **{stage: _summary(values) for stage, values in stage_values.items()},
        },
        "provider_usage": {
            "responses_with_usage": len(provider_usage),
            **token_totals,
            "estimated_cost_usd": round(estimated_cost, 8),
        },
        "errors_by_type": {
            error_type: sum(
                1 for sample in samples
                if not sample["ok"] and sample.get("error_type") == error_type
            )
            for error_type in sorted({
                sample.get("error_type")
                for sample in samples
                if not sample["ok"] and sample.get("error_type")
            })
        },
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--endpoint")
    parser.add_argument("--stream", action="store_true", help="Benchmark the SSE streaming endpoint.")
    parser.add_argument("--queries-jsonl", required=True, type=Path)
    parser.add_argument("--runs", type=int, default=5)
    parser.add_argument("--warmup", type=int, default=0)
    parser.add_argument("--timeout-seconds", type=float, default=90.0)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    if args.runs < 1 or args.warmup < 0 or args.timeout_seconds <= 0:
        parser.error("--runs must be positive, --warmup non-negative, and timeout positive.")

    endpoint = args.endpoint or (
        "http://127.0.0.1:8001/api/rag/query/stream"
        if args.stream else "http://127.0.0.1:8001/api/rag/query"
    )

    queries = _read_queries(args.queries_jsonl)
    samples = []

    with httpx.Client(timeout=args.timeout_seconds) as client:
        for request in queries:
            for _ in range(args.warmup):
                _request_sample(client, endpoint, request, stream=args.stream)
            for _ in range(args.runs):
                samples.append(_request_sample(client, endpoint, request, stream=args.stream))

    report = _build_report(endpoint, queries, samples, args.runs, args.warmup, stream=args.stream)
    report_json = json.dumps(report, indent=2)

    if args.output:
        args.output.write_text(report_json + "\n", encoding="utf-8")
    print(report_json)
    return 0 if report["failed_responses"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
