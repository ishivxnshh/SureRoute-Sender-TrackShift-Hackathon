import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  ReactFlowInstance,
  useEdgesState,
  useNodesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import BaseNode from './nodes/BaseNode';
import { Transfer } from '../store/useStore';

const nodeTypes = { base: BaseNode };

export type SelectedElement =
  | { kind: 'node'; node: Node }
  | { kind: 'edge'; edge: Edge }
  | null;

interface CanvasProps {
  workflow: { id: string; nodes: Node[]; edges: Edge[] };
  onChange: (nodes: Node[], edges: Edge[]) => void;
  onSelect: (item: SelectedElement) => void;
  transfers: Transfer[];
}

function CanvasInner({ workflow, onSelect, transfers, onChange }: CanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(workflow.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(workflow.edges);
  const [rfInstance, setRfInstance] = useState<ReactFlowInstance | null>(null);
  const nodeId = useRef(workflow.nodes.length + 1);
  const activeWorkflowId = useRef(workflow.id);

  useEffect(() => {
    if (activeWorkflowId.current !== workflow.id) {
      activeWorkflowId.current = workflow.id;
      setNodes(workflow.nodes);
      setEdges(workflow.edges);
      nodeId.current = workflow.nodes.length + 1;
    }
  }, [workflow, setNodes, setEdges]);

  useEffect(() => {
    onChange(nodes, edges);
  }, [nodes, edges, onChange]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);
    },
    [onNodesChange]
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);
    },
    [onEdgesChange]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            id: `edge-${Date.now()}`,
            animated: true,
            label: 'Link',
            data: {}
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type || !rfInstance) return;
      const position = rfInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY
      });
      const id = `node-${nodeId.current++}`;
      const newNode: Node = {
        id,
        type: 'base',
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} ${nodeId.current - 1}`,
          type,
          stats: 'Idle'
        }
      };
      setNodes((nds) => nds.concat(newNode));
    },
    [rfInstance, setNodes]
  );

  const handleSelectionChange = useCallback(
    (sel: { nodes?: Node[]; edges?: Edge[] }) => {
      if (sel.nodes && sel.nodes.length > 0) {
        onSelect({ kind: 'node', node: sel.nodes[0] });
        return;
      }
      if (sel.edges && sel.edges.length > 0) {
        onSelect({ kind: 'edge', edge: sel.edges[0] });
        return;
      }
      onSelect(null);
    },
    [onSelect]
  );

  const transferSummary = useMemo(() => {
    if (!transfers.length) return 'No active transfers';
    const avg = Math.round(
      transfers.reduce((acc, t) => acc + t.speed, 0) / Math.max(1, transfers.length) / 1024
    );
    return `${transfers.length} active • ${avg} KB/s avg`;
  }, [transfers]);

  return (
    <div className="flow-wrapper" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onInit={setRfInstance}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onSelectionChange={(sel) => handleSelectionChange(sel as { nodes?: Node[]; edges?: Edge[] })}
        fitView
        proOptions={{ hideAttribution: true }}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          style: { strokeWidth: 2, stroke: 'rgba(107,137,255,0.7)' },
          animated: true
        }}
      >
        <MiniMap pannable zoomable />
        <Controls />
        <Background gap={24} color="rgba(255,255,255,0.05)" />
        <div className="flow-overlay">{transferSummary}</div>
        {nodes.length === 0 && (
          <div className="flow-empty-state">
            Drop nodes from the palette to start building this workflow.
          </div>
        )}
      </ReactFlow>
    </div>
  );
}

export default function Canvas(props: CanvasProps) {
  return <CanvasInner {...props} />;
}
