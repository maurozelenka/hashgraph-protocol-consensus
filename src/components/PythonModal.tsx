import React, { useState } from 'react';
import { X, Copy, Check, Download, Terminal, Cpu } from 'lucide-react';

interface PythonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PYTHON_CODE = `#!/usr/bin/env python3
"""
Hashgraph Consensus Protocol - Clean Modular Python Implementation
==================================================================
Implements:
1. Gossip about Gossip DAG (Events with self-parent and other-parent)
2. Strongly Seeing condition (> 2/3 supermajority of nodes)
3. Round increment and Witness determination
4. Virtual Voting without transmitting voting packets
5. Final Consensus Order and Timestamp determination
"""

import math
import random
import time
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Set


@dataclass
class HashgraphEvent:
    id: str
    creator: int  # Node index
    self_parent_id: Optional[str]
    other_parent_id: Optional[str]
    sender_node: Optional[int]
    round: int = 1
    is_witness: bool = False
    is_famous: bool = False
    status: str = "pending"  # "pending", "strongly_seen", "consensus"
    consensus_order: Optional[int] = None
    consensus_timestamp: Optional[float] = None
    created_at: float = field(default_factory=time.time)
    transactions: List[str] = field(default_factory=list)


class HashgraphEngine:
    def __init__(self, node_count: int = 5):
        self.node_count = max(2, min(26, node_count))
        self.node_labels = [chr(65 + i) for i in range(self.node_count)]
        self.events: List[HashgraphEvent] = []
        self.events_map: Dict[str, HashgraphEvent] = {}
        self.ancestors_map: Dict[str, Set[str]] = {}
        self.latest_event_by_node: List[Optional[HashgraphEvent]] = [None] * self.node_count
        self.next_index = 0
        self.consensus_counter = 0
        self.reset()

    @property
    def supermajority(self) -> int:
        """Calculate BFT threshold: > 2/3 of nodes"""
        return math.floor((2 * self.node_count) / 3) + 1

    def reset(self):
        """Initialize genesis events for all nodes."""
        self.events = []
        self.events_map.clear()
        self.ancestors_map.clear()
        self.latest_event_by_node = [None] * self.node_count
        self.next_index = 0
        self.consensus_counter = 0

        for i in range(self.node_count):
            genesis_id = f"e_gen_{self.node_labels[i]}"
            event = HashgraphEvent(
                id=genesis_id,
                creator=i,
                self_parent_id=None,
                other_parent_id=None,
                sender_node=None,
                round=1,
                is_witness=True,
                status="pending",
                transactions=[f"Genesis Node {self.node_labels[i]}"],
            )
            self.events.append(event)
            self.events_map[genesis_id] = event
            self.ancestors_map[genesis_id] = {genesis_id}
            self.latest_event_by_node[i] = event

        self.update_consensus()

    def create_gossip_event(
        self,
        sender: Optional[int] = None,
        receiver: Optional[int] = None,
        tx_payload: Optional[str] = None
    ) -> Optional[HashgraphEvent]:
        """
        Simulates a gossip step:
        Sender tells receiver all its events. Receiver creates a new event
        referencing its own latest event (self-parent) and sender's latest event (other-parent).
        """
        if sender is None or receiver is None:
            sender = random.randint(0, self.node_count - 1)
            receiver = random.randint(0, self.node_count - 1)
            while receiver == sender and self.node_count > 1:
                receiver = random.randint(0, self.node_count - 1)

        if sender == receiver or sender >= self.node_count or receiver >= self.node_count:
            return None

        self_parent = self.latest_event_by_node[receiver]
        other_parent = self.latest_event_by_node[sender]

        if not self_parent or not other_parent:
            return None

        event_id = f"e_{self.next_index}"
        self.next_index += 1

        # Calculate ancestor set (Gossip about Gossip DAG)
        ancestors: Set[str] = {event_id}
        ancestors.update(self.ancestors_map.get(self_parent.id, set()))
        ancestors.update(self.ancestors_map.get(other_parent.id, set()))
        self.ancestors_map[event_id] = ancestors

        # Round calculation
        parent_max_round = max(self_parent.round, other_parent.round)
        round_num = parent_max_round

        # Check if new event can strongly see >= supermajority witnesses of round parent_max_round
        round_witnesses = [
            e for e in self.events if e.round == parent_max_round and e.is_witness
        ]
        strongly_seen_count = sum(
            1 for w in round_witnesses if self._can_strongly_see(ancestors, w)
        )

        if strongly_seen_count >= self.supermajority:
            round_num = parent_max_round + 1

        # Is witness: First event created by this node in this round
        has_witness = any(
            e.creator == receiver and e.round == round_num and e.is_witness
            for e in self.events
        )
        is_witness = not has_witness

        tx = tx_payload or f"Tx {self.node_labels[sender]}->{self.node_labels[receiver]} #{self.next_index}"

        new_event = HashgraphEvent(
            id=event_id,
            creator=receiver,
            self_parent_id=self_parent.id,
            other_parent_id=other_parent.id,
            sender_node=sender,
            round=round_num,
            is_witness=is_witness,
            transactions=[tx],
        )

        self.events.append(new_event)
        self.events_map[event_id] = new_event
        self.latest_event_by_node[receiver] = new_event

        self.update_consensus()
        return new_event

    def _can_strongly_see(self, ancestors: Set[str], target_witness: HashgraphEvent) -> bool:
        """
        Event x strongly sees event y if there are events by > 2/3 of nodes
        that can see y and are seen by x.
        """
        intermediate_nodes: Set[int] = set()

        for ancestor_id in ancestors:
            anc = self.events_map.get(ancestor_id)
            if not anc:
                continue
            anc_ancestors = self.ancestors_map.get(ancestor_id, set())
            if target_witness.id in anc_ancestors:
                intermediate_nodes.add(anc.creator)

        return len(intermediate_nodes) >= self.supermajority

    def update_consensus(self):
        """
        Virtual Voting without exchanging vote messages:
        Calculates consensus order for events that have reached finality.
        """
        max_round = max((e.round for e in self.events), default=1)

        # 1. Fame of witnesses
        for ev in self.events:
            if ev.is_witness and not ev.is_famous:
                subsequent_witnesses = [
                    w for w in self.events if w.round > ev.round and w.is_witness
                ]
                seeing_nodes = {
                    w.creator
                    for w in subsequent_witnesses
                    if ev.id in self.ancestors_map.get(w.id, set())
                }
                if len(seeing_nodes) >= self.supermajority:
                    ev.is_famous = True

        # 2. Consensus finality for all events
        total = len(self.events)
        for i in range(total):
            ev = self.events[i]
            if ev.status == "consensus":
                continue

            reached_nodes = sum(
                1
                for n in range(self.node_count)
                if self.latest_event_by_node[n]
                and ev.id in self.ancestors_map.get(self.latest_event_by_node[n].id, set())
            )

            is_deep = (total - i) > (self.node_count * 2) or ev.round < (max_round - 1)

            if reached_nodes >= self.supermajority and is_deep:
                ev.status = "consensus"
                if ev.consensus_order is None:
                    self.consensus_counter += 1
                    ev.consensus_order = self.consensus_counter
                    ev.consensus_timestamp = ev.created_at + 0.1
            elif reached_nodes >= math.ceil(self.node_count / 2):
                ev.status = "strongly_seen"


if __name__ == "__main__":
    print("Hashgraph Consensus Engine running...")
    engine = HashgraphEngine(node_count=5)
    for _ in range(25):
        engine.create_gossip_event()
    print(f"Events: {len(engine.events)} | Consensus: {engine.consensus_counter}")
`;

export const PythonModal: React.FC<PythonModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([PYTHON_CODE], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hashgraph_simulation.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
      <div className="bg-[#0b0e14] border border-[#1e2638] rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="px-5 py-3 border-b border-[#181d29] flex items-center justify-between bg-[#0e121a]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-[#162032] text-cyan-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-tight">
                Hashgraph Architecture in Python
              </h3>
              <p className="text-[11px] text-slate-400">
                hashgraph_simulation.py - Pure Python engine with Gossip, DAG & Virtual Voting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1.5 rounded bg-[#161c28] border border-[#252f44] text-xs font-semibold text-cyan-400 hover:bg-[#1e2738] flex items-center gap-1.5 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Python'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-2.5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-black text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .py</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-[#182030] transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-[#06080c] flex-1 overflow-auto font-mono text-xs text-slate-300 leading-relaxed">
          <pre className="whitespace-pre">{PYTHON_CODE}</pre>
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-[#181d29] bg-[#0e121a] flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Run locally: <code className="text-cyan-300">python3 hashgraph_simulation.py</code>
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#161c28] text-white hover:bg-[#202838] transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
