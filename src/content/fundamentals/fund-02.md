# Partitioning, Sharding & Consistent Hashing

> **Why this matters for AI systems:** 100M+ embeddings, per-tenant indexes, and sticky agent sessions all require splitting data or traffic across nodes without hot spots.

## 1. Partitioning strategies

| Strategy | Mechanism | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **Range** | Keys split by contiguous ranges | Efficient range scans | Hot spots (e.g. timestamps → latest shard is hot) |
| **Hash** | `hash(key) mod N` | Even spread | Range scans impossible; changing N reshuffles almost everything |
| **Consistent hashing** | Nodes and keys on a ring; key goes to next node clockwise | Adding/removing a node moves only ~1/N of keys | Uneven load without virtual nodes |
| **Directory / lookup** | A map service says where each key lives | Fully flexible (per-tenant placement) | Directory is a dependency and must be cached/HA |

## 2. Consistent hashing in 60 seconds

```text
ring positions: 0 ................................ 2^32
   place each node at several points (virtual nodes)
   key -> hash(key) -> walk clockwise -> first node = owner
   replicas = next R-1 distinct nodes on the ring
```

- **Virtual nodes** smooth load and let bigger machines own more points.
- Adding a node steals small slices from many neighbours instead of reshuffling everything.

## 3. Hot keys and skew

- A celebrity tenant or a viral query sends most traffic to one shard.
- Fixes: split the hot key (`key#0..k` and fan-in on read), add a cache in front, give heavy tenants a dedicated shard, or use adaptive/rebalancing partitions.

## 4. Secondary indexes

- **Local (document-partitioned):** each shard indexes its own data → writes cheap, reads must **scatter-gather** all shards.
- **Global (term-partitioned):** index is itself partitioned by term → reads hit one shard, writes touch several and are often async.

## 5. Rebalancing

- Fixed number of partitions >> nodes (e.g. 1,000 partitions on 10 nodes); move whole partitions when nodes join.
- Avoid fully automatic rebalancing during load spikes — it can cascade.

## 6. AI tie-in

- **Vector search sharding:** each shard holds a subset of vectors and runs ANN locally; a coordinator **scatter-gathers top-k**, merges, and reranks. Latency = slowest shard (tail-at-scale problem), so use hedged requests or replicas.
- **Multi-tenant RAG:** small tenants share an index with a tenant-id filter; large tenants get their own index/collection. Know the pre-filter vs post-filter trade-off (see Session 08).
- **Sticky sessions for agents:** consistent-hash `session_id` to a pod to reuse in-memory context — but keep state in a shared store so pod loss is survivable.
- **Embedding job fan-out:** partition ingestion by document id so reprocessing is idempotent per partition.

## 7. Interview check

1. Why is `hash(key) mod N` bad when N changes?
2. How do virtual nodes help?
3. How would you shard 200M vectors and what happens to P99 latency?
4. A single tenant sends 40% of traffic. What do you do?
