# hashgraph-protocol-consensus

An asynchronous Byzantine Fault Tolerant (aBFT) distributed consensus engine and DAG state visualizer implementing Swirlds Hashgraph protocol primitives: Gossip-about-Gossip, Strong Seeing, and Virtual Voting.

---

## Technical Specifications

- **Consensus Guarantee**: Asynchronous Byzantine Fault Tolerance (aBFT) with $N \ge 3f + 1$ adversarial threshold.
- **Message Complexity**: Zero communication overhead for voting ($O(0)$ vote packets); votes are computed locally via topological traversal of the DAG.
- **Fairness & Ordering**: Linearized total ordering determined by median received timestamps from famous witnesses.
- **Sybil Resistance & Topology**: Static peer configuration ($3 \le N \le 10$) supporting concurrent gossip execution, state forks, and adversarial partition simulations.

---

## Protocol Engine Architecture

```
                      [ Gossip Protocol ]
                               │
                               ▼
               [ Directed Acyclic Graph (DAG) ]
                 ├── Event Hash Validation (SHA-256)
                 └── Parent Link Verification (Self / Other)
                               │
                               ▼
                  [ Topological Traversal ]
                 ├── Strong Seeing Evaluation:
                 │     Event x strongly sees y iff paths intersect > 2n/3 nodes
                 ├── Round Division:
                 │     roundCreated(x) = max(round(parents)) + [1 if supermajority seen]
                 └── Witness Designation:
                       isWitness(x) = first event of creator in roundCreated(x)
                               │
                               ▼
                    [ Virtual Voting Engine ]
                 ├── Fame Resolution:
                 │     Witnesses cast votes on round r-1 witnesses
                 └── Coin Round Decider (non-deterministic fallback)
                               │
                               ▼
                  [ Total Consensus Ordering ]
                 ├── Consensus Timestamp = Median(Received Timestamps)
                 └── Deterministic Tie-Breaking by Extended Min-Hash
```

---

## Repository Layout

```text
.
├── src/
│   ├── core/consensus/       # Consensus engine: DAG state machine, virtual voting, ordering
│   └── components/           # Real-time DAG canvas renderer, inspection panels, metric telemetry
├── terminal-simulator/       # Headless Python reference implementation for deterministic CLI runs
├── package.json
└── vite.config.ts
```

---

## Environment & Build

### Prerequisites
- Node.js >= 18.0.0
- Python >= 3.8 (for headless CLI runner)

### Web Engine Setup
```bash
npm install
npm run dev
```

### Production Build
```bash
npm run build
npm run preview
```

### Headless CLI Engine
```bash
python terminal-simulator/main.py
```

---

## Event Invariant Schema

```typescript
interface HashgraphEvent {
  id: string;                      // Cryptographic digest (SHA-256)
  creator: string;                 // Node public identifier
  selfParent: string | null;       // Hash pointer to predecessor by same creator
  otherParent: string | null;      // Hash pointer to gossiped foreign event
  roundCreated: number;            // Round assigned via supermajority visibility
  roundReceived: number | null;    // Round in which consensus was achieved
  isWitness: boolean;              // True if initial event for creator in roundCreated
  isFamous: boolean | null;        // Decided via virtual voting convergence
  consensusTimestamp: number | null; // Median timestamp across deciding witnesses
  transactions: string[];          // Serialized state machine payloads
}
```

---

## Verification & Attack Modeling

The engine supports edge-case verification:
- **Fork Injection**: Injection of divergent sibling events sharing identical `selfParent` to evaluate fork-mitigation invariants.
- **Partitions & Byzantine Behavior**: Withholding gossip synchronization to observe liveness and safety boundaries under network decay.

---

## License

MIT
