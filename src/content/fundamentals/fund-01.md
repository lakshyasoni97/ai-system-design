# Replication, Consistency & CAP/PACELC

> **Why this matters for AI systems:** every stateful piece of your stack (vector DB, Redis agent state, Postgres checkpoints) is replicated. Interviewers want to hear *what happens to a user's request when a replica is behind or a node dies*.

## 1. Why replicate?

Three separate goals — name which one you are solving:

- **Availability:** survive a node or zone failure.
- **Read scaling:** spread read QPS across copies.
- **Latency:** put a copy near the user (multi-region).

## 2. Replication topologies

| Topology | How it works | Good for | Watch out for |
| :--- | :--- | :--- | :--- |
| **Single-leader** | All writes go to one leader; followers copy its log | Most OLTP (Postgres, Redis primary/replica) | Failover: lost writes if async; split-brain if two leaders |
| **Multi-leader** | Several regions accept writes | Multi-region writes, offline clients | Write conflicts need a resolution rule (LWW, CRDTs) |
| **Leaderless (quorum)** | Client writes to W nodes, reads from R nodes (Dynamo-style) | High availability stores (Cassandra, DynamoDB internals) | Stale reads unless R + W > N; hinted handoff, read repair |

**Quorum rule:** with N replicas, if `R + W > N` a read overlaps at least one node that has the latest write. Typical `N=3, W=2, R=2`.

## 3. Sync vs async replication

- **Synchronous:** leader waits for followers → no data loss, higher write latency, availability tied to followers.
- **Asynchronous:** leader acks immediately → fast, but a leader crash can lose the last writes and followers serve **stale reads**.
- **Semi-sync:** wait for one follower — the usual compromise.

## 4. Consistency levels (the ones to name)

- **Linearizable (strong):** behaves like a single copy. Needed for locks, leader election, unique constraints.
- **Sequential / causal:** operations that are causally related are seen in order. Often "enough" for chat/session data.
- **Read-your-writes / monotonic reads:** a user never sees their own update disappear. Achieve by routing a user to the leader (or a sticky replica) for a while after a write.
- **Eventual:** replicas converge if writes stop. Fine for counters, analytics, embeddings indexes.

## 5. CAP and PACELC without the myths

- **CAP:** during a **P**artition you must choose **C**onsistency (refuse some requests) or **A**vailability (answer possibly stale). It says nothing about normal operation.
- **PACELC:** *if Partition → A or C; Else (normal) → Latency or Consistency.* The second half is what you actually live with day to day: synchronous cross-region replication costs latency.

## 6. Consensus in one paragraph

Raft/Paxos let a group agree on a log despite failures (majority quorum). You rarely build it; you *use* it via etcd, ZooKeeper, Spanner, Kubernetes' control plane. Know: odd cluster sizes (3 or 5), leader election, and that a minority partition cannot make progress.

## 7. AI tie-in: what to say

- **Agent state in Redis:** async replication means a failover can lose the last checkpoint. Mitigation: checkpoint after each *tool completion*, make tools **idempotent**, and resume from the last durable step.
- **Vector DB:** replicas are eventually consistent with the writer; a freshly indexed document may not be retrievable for seconds. State the freshness SLO.
- **Multi-region LLM fallback:** you are choosing availability over consistency — the second region may run a different model version, so outputs can differ.

## 8. Interview check

1. Your Redis primary dies mid-conversation. What does the user see? What can you lose?
2. When is eventual consistency unacceptable in an AI product? (hint: permissions/RBAC revocation, billing counters)
3. Explain `R + W > N` and pick values for a read-heavy workload.
4. What does PACELC add over CAP?
