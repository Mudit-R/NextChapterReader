# RAG latency and usage metrics

The RAG query response includes timings_ms for retrieval, the model provider
call, and the full server-side RAG operation. The same fields are returned by
/api/chat and in the final SSE event from /api/rag/query/stream.
The streaming route uses Groq's async streaming API when configured and reports
time_to_first_token_ms from the first visible response content. Without a
provider key, the route returns a local fallback response and TTFT is null.

GET /api/usage reports process-local token and estimated-cost totals plus
latency summaries. Latency summaries use the most recent 10,000 observations
per stage and include the sample count, mean, p50, p95, and p99. The counters
reset when the API process restarts. The tracker retains numeric timings only.
It does not store query text or book content.

Token counts come from the model provider response. Estimated costs use
GROQ_INPUT_COST_PER_1M and GROQ_OUTPUT_COST_PER_1M. Set those values from
the pricing schedule that applies to the configured provider and model. If they
are unset, token usage is still tracked and estimated cost remains zero.

## Run a controlled API benchmark

Start the API with GROQ_API_KEY configured and ingest a small, fixed book
fixture into the same running process. Create a JSONL file with one request per
line, for example:

    {"message":"What did the main character discover?","book_id":"benchmark-book","book_title":"Benchmark Book","current_page":20,"total_pages":100,"enable_anti_spoiler":true,"top_k":4}

Run the script from backendAI:

    python benchmark_rag.py --queries-jsonl benchmark-queries.jsonl --runs 5 --warmup 1 --output inference-report.json

The report includes sequential client request latency, server retrieval/model/
TTFT/total latency percentiles, response counts, model names, and provider
token usage. It omits all query text. Warm-up requests call the configured
model and are excluded from the report. To benchmark SSE streaming instead,
run:

    python benchmark_rag.py --stream --queries-jsonl benchmark-queries.jsonl --runs 5 --warmup 1 --output stream-report.json

Run the same query file against the same indexed fixture, model, and deployment
when comparing changes.

The benchmark records observed latency. It does not establish a production SLA,
and in-process percentiles should be interpreted with the included sample count
and deployment context.
