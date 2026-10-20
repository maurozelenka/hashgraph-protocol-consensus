import { HashgraphVertex } from '../types';

export class ReachabilityIndex {
  private ancestors = new Map<string, Set<string>>();

  clear(): void {
    this.ancestors.clear();
  }

  registerGenesis(eventId: string): void {
    this.ancestors.set(eventId, new Set([eventId]));
  }

  registerEvent(eventId: string, selfParentId: string, otherParentId: string): Set<string> {
    const combined = new Set<string>([eventId]);

    const selfSet = this.ancestors.get(selfParentId);
    if (selfSet) {
      selfSet.forEach((id) => combined.add(id));
    }

    const otherSet = this.ancestors.get(otherParentId);
    if (otherSet) {
      otherSet.forEach((id) => combined.add(id));
    }

    this.ancestors.set(eventId, combined);
    return combined;
  }

  getAncestors(eventId: string): Set<string> {
    return this.ancestors.get(eventId) || new Set();
  }

  canSee(sourceEventId: string, targetEventId: string): boolean {
    const set = this.ancestors.get(sourceEventId);
    return set ? set.has(targetEventId) : false;
  }

  canStronglySee(
    eventAncestors: Set<string>,
    targetWitness: HashgraphVertex,
    eventsMap: Map<string, HashgraphVertex>,
    threshold: number
  ): boolean {
    const witnessingNodes = new Set<number>();

    for (const ancestorId of eventAncestors) {
      const ancestor = eventsMap.get(ancestorId);
      if (!ancestor) continue;

      const ancestorChain = this.ancestors.get(ancestorId);
      if (ancestorChain && ancestorChain.has(targetWitness.id)) {
        witnessingNodes.add(ancestor.creator);
      }
    }

    return witnessingNodes.size >= threshold;
  }

  getLineage(eventId: string): { ancestors: Set<string>; descendants: Set<string> } {
    const ancestors = this.ancestors.get(eventId) || new Set([eventId]);
    const descendants = new Set<string>();

    for (const [id, set] of this.ancestors.entries()) {
      if (set.has(eventId)) {
        descendants.add(id);
      }
    }

    return { ancestors, descendants };
  }
}
