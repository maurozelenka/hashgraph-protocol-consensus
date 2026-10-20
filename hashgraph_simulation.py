#!/usr/bin/env python3
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
from typing import Dict, List, Optional, Set, Tuple


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

        # Round calculation:
        # r = max(round(self_parent), round(other_parent))
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

            # Count current nodes that have reached this event
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

    def print_ascii_summary(self):
        """Prints a scannable ASCII summary of the Hashgraph state."""
        print("=" * 60)
        print(f"Hashgraph Consensus DAG | Nodes: {self.node_count} | Supermajority: {self.supermajority}")
        print("=" * 60)
        for ev in self.events:
            status_tag = "[CONSENSUS]" if ev.status == "consensus" else "[PENDING]  "
            order_str = f"#{ev.consensus_order}" if ev.consensus_order else "   "
            parents = f"Self: {ev.self_parent_id or 'None':<10} Other: {ev.other_parent_id or 'None':<10}"
            print(
                f"{status_tag} {order_str} | Node: {self.node_labels[ev.creator]} | "
                f"Round: {ev.round} | Witness: {str(ev.is_witness):<5} | {parents}"
            )
        print("=" * 60)
        consensus_count = sum(1 for e in self.events if e.status == "consensus")
        print(f"Total Events: {len(self.events)} | Consensus Finalized: {consensus_count}")
        print("=" * 60)


if __name__ == "__main__":
    print("Initializing Hashgraph Consensus Engine (Python)...")
    engine = HashgraphEngine(node_count=5)

    print(f"Simulating 25 Gossip rounds across {engine.node_count} nodes...")
    for _ in range(25):
        engine.create_gossip_event()

    engine.print_ascii_summary()
