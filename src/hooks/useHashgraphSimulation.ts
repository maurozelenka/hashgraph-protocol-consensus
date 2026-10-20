import { useCallback, useEffect, useRef, useState } from 'react';
import { ConsensusEngine } from '../core/consensus/ConsensusEngine';
import { HashgraphVertex, NodeIdentity, SimulationMetrics } from '../core/types';

export function useHashgraphSimulation(initialNodes = 5) {
  const engineRef = useRef<ConsensusEngine>(new ConsensusEngine(initialNodes));

  const [events, setEvents] = useState<HashgraphVertex[]>([]);
  const [eventsMap, setEventsMap] = useState<Map<string, HashgraphVertex>>(new Map());
  const [nodes, setNodes] = useState<NodeIdentity[]>([]);
  const [currentMaxX, setCurrentMaxX] = useState<number>(140);
  const [nodeCount, setNodeCountState] = useState<number>(initialNodes);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speed, setSpeed] = useState<number>(5);
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    totalEvents: initialNodes,
    consensusEvents: 0,
    currentRound: 1,
    gossipCount: 0,
    consensusPercentage: 0,
  });

  const syncState = useCallback(() => {
    const engine = engineRef.current;
    setEvents([...engine.events]);
    setEventsMap(new Map(engine.eventsMap));
    setNodes([...engine.nodes]);
    setCurrentMaxX(engine.currentMaxX);
    setMetrics(engine.getMetrics());
  }, []);

  useEffect(() => {
    syncState();
  }, [syncState]);

  const setNodeCount = useCallback(
    (count: number) => {
      const valid = Math.max(2, Math.min(26, count));
      setNodeCountState(valid);
      const engine = engineRef.current;
      engine.nodeCount = valid;
      syncState();
    },
    [syncState]
  );

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const step = useCallback(() => {
    setIsPlaying(false);
    engineRef.current.createGossipEvent();
    syncState();
  }, [syncState]);

  const reset = useCallback(() => {
    engineRef.current.reset();
    syncState();
  }, [syncState]);

  // Simulation loop with speed scaling and batch execution
  useEffect(() => {
    if (!isPlaying) return;

    let intervalMs = Math.max(16, Math.floor(1000 / speed));
    let batchSize = 1;

    if (speed >= 35) {
      batchSize = 3;
      intervalMs = 20;
    } else if (speed >= 20) {
      batchSize = 2;
      intervalMs = 30;
    }

    const timer = setInterval(() => {
      engineRef.current.createGossipBatch(batchSize);
      syncState();
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, speed, syncState]);

  return {
    engine: engineRef.current,
    nodes,
    events,
    eventsMap,
    currentMaxX,
    nodeCount,
    setNodeCount,
    isPlaying,
    togglePlay,
    step,
    reset,
    speed,
    setSpeed,
    metrics,
    supermajority: engineRef.current.supermajority,
  };
}
