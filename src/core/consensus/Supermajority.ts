export function calculateBFTThreshold(nodeCount: number): number {
  if (nodeCount < 1) return 1;
  return Math.floor((2 * nodeCount) / 3) + 1;
}
