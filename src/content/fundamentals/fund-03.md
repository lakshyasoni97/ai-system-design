# Storage Engines & Choosing a Database

> **Why this matters for AI systems:** "Which database and why?" appears in nearly every design. You should justify Postgres vs Redis vs BigQuery vs a vector DB from access patterns, not habit.

## 1. Two storage-engine families

| | **B-tree** (Postgres, MySQL InnoDB) | **LSM-tree** (Cassandra, RocksDB, BigTable) |
| :--- | :--- | :--- |
| Write path | Update pages in place (+ WAL) | Append to memtable → flush sorted SSTables → compact |
| Reads | Predictable, few page reads | May check several SSTables (Bloom filters help) |
| Write amplification | Moderate | Higher from compaction, but sequential I/O |
| Best for | Read-heavy OLTP, range queries, transactions | Very high write throughput, time-series, logs |

## 2. Row vs column storage

- **Row-oriented:** whole record together → fast for "fetch one user".
- **Column-oriented (BigQuery, Parquet):** each column stored separately → scans only the columns used, compresses well → fast for analytics. Poor for single-row updates.

## 3. Choosing a store — decision table

| Need | Typical choice | Reason |
| :--- | :--- | :--- |
| Transactions, relations, moderate scale | **PostgreSQL** | ACID, rich queries; `pgvector` handles up to low-millions of vectors |
| Sub-ms cache, counters, rate limits, session state | **Redis** | In-memory, atomic ops; persistence is secondary |
| Massive writes, key-based access | **Cassandra / DynamoDB / Bigtable** | Horizontal scale, tunable consistency |
| Analytics over huge data | **BigQuery / Snowflake / Spark on Parquet** | Columnar scans, separation of storage and compute |
| Blobs: videos, slide images | **Object storage (GCS/S3)** | Cheap, durable; store the URI in the DB |
| Semantic retrieval | **Vector DB (Qdrant, Vertex Vector Search, pgvector)** | ANN index + metadata filtering |
| Full-text/lexical + facets | **Elasticsearch / OpenSearch** | Inverted index, BM25 |

## 4. Transactions and isolation (just enough)

- **ACID** — atomic, consistent, isolated, durable.
- Isolation levels: read committed → snapshot/repeatable read → serializable. Anomalies to name: lost update, write skew, phantom reads.
- Across services you do not get ACID: use **sagas**, outbox pattern, idempotent consumers (Sessions 02 and 12).

## 5. Indexes: cost model

- Every index speeds reads and **slows writes** and uses memory.
- Composite index order matters (`(tenant_id, created_at)` serves tenant+time queries).
- Covering indexes avoid table lookups. Partial indexes keep size small.

## 6. AI tie-in

- **Agent checkpoint store:** small JSON blobs keyed by thread id, written frequently, read on resume → Redis (fast) with Postgres as the durable record, or Postgres alone if latency budget allows.
- **Vector DB is not a system of record.** Keep source docs in object storage + metadata in Postgres; the index must be rebuildable.
- **Evals and logs:** write traces to a log/analytics path (BigQuery) rather than the serving DB.

## 7. Interview check

1. Why would you not store embeddings only in your vector DB?
2. B-tree vs LSM for an event log with 50k writes/s?
3. Pick stores for: chat history, rate-limit counters, evaluation results, uploaded PDFs.
4. When does pgvector stop being enough?
