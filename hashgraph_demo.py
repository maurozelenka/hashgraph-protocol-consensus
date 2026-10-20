import time
import random
from dataclasses import dataclass, field
from typing import List, Optional, Set, Dict

# Colores ANSI para terminal
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
MAGENTA = "\033[95m"
BLUE = "\033[94m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"

@dataclass
class Event:
    id: str
    creator: str
    seq: int
    self_parent: Optional[str]
    other_parent: Optional[str]
    payload: str
    round: int = 1
    ancestors: Set[str] = field(default_factory=set)
    is_consensus: bool = False
    consensus_order: Optional[int] = None

class TerminalHashgraph:
    def __init__(self, node_names: List[str]):
        self.nodes = node_names
        self.events: Dict[str, Event] = {}
        self.latest_by_node: Dict[str, Optional[str]] = {n: None for n in node_names}
        self.seq_counter = 0
        self.consensus_counter = 0
        
        # Crear eventos génesis para cada nodo
        for node in self.nodes:
            event_id = f"{node}0"
            ev = Event(
                id=event_id,
                creator=node,
                seq=self.seq_counter,
                self_parent=None,
                other_parent=None,
                payload=f"Genesis({node})",
                round=1,
                ancestors={event_id}
            )
            self.seq_counter += 1
            self.events[event_id] = ev
            self.latest_by_node[node] = event_id

    def gossip(self, sender: str, receiver: str, tx_desc: str) -> Event:
        self_p = self.latest_by_node[receiver]
        other_p = self.latest_by_node[sender]
        
        # Calcular ancestros uniendo los de ambos padres
        ancestors = set()
        if self_p and self_p in self.events:
            ancestors |= self.events[self_p].ancestors
        if other_p and other_p in self.events:
            ancestors |= self.events[other_p].ancestors

        # Calcular ronda aproximada según cuántos nodos ve
        sp_round = self.events[self_p].round if self_p else 1
        op_round = self.events[other_p].round if other_p else 1
        cur_round = max(sp_round, op_round)
        
        # Si ve eventos de más de 2/3 de los nodos en esta ronda, avanza ronda
        seen_nodes = {self.events[a].creator for a in ancestors if a in self.events and self.events[a].round == cur_round}
        if len(seen_nodes) > (2 * len(self.nodes) // 3):
            cur_round += 1

        ev_id = f"{receiver}_{self.seq_counter}"
        ancestors.add(ev_id)
        ev = Event(
            id=ev_id,
            creator=receiver,
            seq=self.seq_counter,
            self_parent=self_p,
            other_parent=other_p,
            payload=tx_desc,
            round=cur_round,
            ancestors=ancestors
        )
        self.seq_counter += 1
        self.events[ev_id] = ev
        self.latest_by_node[receiver] = ev_id

        self._check_consensus()
        return ev

    def _check_consensus(self):
        threshold = (2 * len(self.nodes) // 3) + 1
        for ev in self.events.values():
            if ev.is_consensus:
                continue
            
            # Comprobar cuántos nodos en su estado más reciente ven a este evento
            seen_by_latest = 0
            for node, latest_id in self.latest_by_node.items():
                if latest_id and ev.id in self.events[latest_id].ancestors:
                    seen_by_latest += 1
            
            # Supermayoría BFT (> 2/3 de la red)
            if seen_by_latest >= threshold:
                ev.is_consensus = True
                self.consensus_counter += 1
                ev.consensus_order = self.consensus_counter

def print_header(title: str):
    print(f"\n{BOLD}{CYAN}{'='*68}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'='*68}{RESET}\n")

def run_interactive_simulation(steps=12, delay=0.8):
    nodes = ["Mauro", "Diego", "Alice", "Bob"]
    hg = TerminalHashgraph(nodes)

    print_header("HASHGRAPH CONSENSUS - DEMOSTRACIÓN DE RED (PYTHON)")
    print(f"{BOLD}Nodos en la red:{RESET} {', '.join(nodes)} (Tolerancia a fallos: Supermayoría BFT > 2/3)")
    print(f"{DIM}Inicializando eventos génesis por nodo...{RESET}")
    time.sleep(1)

    sample_txs = [
        "Pago: 10 HBAR", "Pago: 25 HBAR", "Pago: 5 HBAR",
        "Pago: 50 HBAR", "Pago: 100 HBAR", "Pago: 15 HBAR",
        "Contrato: Transferencia", "Firma Digital", "Registro de Documento"
    ]

    for step in range(1, steps + 1):
        # Escoger emisor y receptor aleatorios (distintos)
        sender, receiver = random.sample(nodes, 2)
        tx = random.choice(sample_txs)

        ev = hg.gossip(sender, receiver, tx)

        print(f"{BOLD}[Paso {step:02d}]{RESET} "
              f"{YELLOW}{sender}{RESET} "
              f"{DIM}---(gossip)--->{RESET} "
              f"{GREEN}{receiver}{RESET} | "
              f"Nuevo Evento: {BOLD}{ev.id}{RESET} (Ronda {ev.round})")

        print(f"       Padres: {DIM}self={ev.self_parent or 'None'}, other={ev.other_parent or 'None'}{RESET}")
        print(f"       Transacción: {MAGENTA}\"{ev.payload}\"{RESET}")
        
        # Contar estado de consenso
        consensus_events = [e for e in hg.events.values() if e.is_consensus]
        pending_events = [e for e in hg.events.values() if not e.is_consensus]
        
        print(f"       {DIM}Estado: {len(consensus_events)} confirmados en consenso | {len(pending_events)} pendientes{RESET}")
        print(f"{DIM}{'-'*68}{RESET}")
        time.sleep(delay)

    # Resumen final de ordenamiento por consenso
    print_header("ORDEN DEFINITIVO POR CONSENSO (VIRTUAL VOTING)")
    print(f"{BOLD}{'Orden':<8} {'Evento':<10} {'Creador':<10} {'Ronda':<8} {'Transacción'}{RESET}")
    print(f"{DIM}{'-'*68}{RESET}")
    
    confirmed = sorted([e for e in hg.events.values() if e.is_consensus], key=lambda x: x.consensus_order or 0)
    for ev in confirmed:
        print(f"{GREEN}#{ev.consensus_order:<7}{RESET} {BOLD}{ev.id:<10}{RESET} {ev.creator:<10} {ev.round:<8} {ev.payload}")

    pending = [e for e in hg.events.values() if not e.is_consensus]
    if pending:
        print(f"\n{YELLOW}Eventos aún pendientes de consenso final ({len(pending)}):{RESET}")
        for ev in pending:
            print(f"  - {ev.id} ({ev.creator}) | Tx: {ev.payload}")

    print(f"\n{BOLD}{CYAN}[OK] Simulacion finalizada con exito.{RESET}\n")

if __name__ == "__main__":
    run_interactive_simulation(steps=10, delay=0.6)
