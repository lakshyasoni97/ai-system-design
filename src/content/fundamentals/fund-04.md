# Queues vs Logs & Delivery Semantics

> **Why this matters for AI systems:** LLM calls are slow, expensive and flaky, so almost every production AI pipeline is asynchronous: video jobs, document ingestion, evaluation runs, news crawlers.

## 1. Two messaging models

| | **Message queue** (SQS, Cloud Tasks, RabbitMQ) | **Log / stream** (Kafka, Pub/Sub with retention, Kinesis) |
| :--- | :--- | :--- |
| Model | Message removed once acked | Append-only log, consumers track an offset |
| Replay | Generally no | Yes — rewind to reprocess (e.g. new embedding model) |
| Ordering | Best-effort (FIFO queues limited) | Per-partition / per-ordering-key |
| Fan-out | Needs multiple queues/topics | Many independent consumer groups |
| Use for | Work distribution, task retries | Event streams, ingestion, auditing |

Google **Pub/Sub** sits in between: topic → subscriptions (each gets every message), pull or push, ack deadlines, optional ordering keys, DLQ, and optional retention/seek for replay.

## 2. Delivery semantics

- **At-most-once:** may lose messages. Rarely acceptable.
- **At-least-once:** may duplicate. **Default in practice** — design consumers to be idempotent.
- **Exactly-once:** realistically = at-least-once delivery + idempotent processing (+ transactional writes). Know that vendors' "exactly-once" has scope limits.

## 3. Making consumers idempotent

1. Derive an **idempotency key** (`job_id`, `chunk_id + content hash`).
2. Check-and-set in a store (`SET key NX` in Redis, unique constraint in Postgres) *before* side effects.
3. Make writes upserts; make external calls carry the same key (payment-style).
4. Persist the result so a duplicate returns the stored output instead of re-calling the LLM.

## 4. Failure handling

- **Ack deadline / visibility timeout:** if work outlives it, the broker redelivers → duplicates. Extend leases for long jobs.
- **Retry with exponential backoff + jitter**, capped attempts.
- **Dead-letter queue** for poison messages; alert on DLQ depth; provide a replay tool.
- **Backpressure:** consumers pull at their own rate; autoscale on **queue depth / oldest message age**, not CPU.
- **Ordering:** only guaranteed within a key — choose the key (e.g. `user_id`) deliberately; ordering limits parallelism.

## 5. Patterns worth naming

- **Outbox:** write the event in the same DB transaction as the state change; a relay publishes it → no dual-write bug.
- **Claim-check:** put big payloads (video, PDFs) in object storage; send only the URI in the message.
- **Fan-out / fan-in:** split a job into chunks, process in parallel, aggregate with a counter or workflow engine.
- **Priority lanes:** separate topics/queues so a bulk backfill cannot starve interactive traffic.

## 6. AI tie-in

- **Video pipeline:** GCS upload → `OBJECT_FINALIZE` → Pub/Sub → chunk workers → results store; DLQ for corrupt files.
- **News ingestion at 100k/min:** a stream with partitioned consumers; enrichment (NER, embeddings) as separate consumer groups so a slow model does not block ingestion.
- **LLM rate limits:** the queue is your shock absorber — workers pull only as fast as your token quota allows.

## 7. Interview check

1. Is exactly-once delivery possible? What do you do instead?
2. Your worker takes 20 min but the ack deadline is 10. What breaks?
3. Queue vs log for re-embedding your corpus with a new model?
4. What metric should drive autoscaling for async workers?
