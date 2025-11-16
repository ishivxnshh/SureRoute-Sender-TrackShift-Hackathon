import React from 'react';
import './ConnectionLine.css';

const ConnectionLine = ({ 
  sourceNode,
  targetNode,
  from,
  to,
  isActive = false,
  isExecuting = false,
  executionProgress = 0,
  temporary = false,
  zoom = 1
}) => {
  // Support both node objects and direct coordinates
  let sourceX, sourceY, targetX, targetY;
  
  if (from && to) {
    // Direct coordinates (for temporary connections) - already in canvas space
    sourceX = from.x;
    sourceY = from.y;
    targetX = to.x;
    targetY = to.y;
  } else if (sourceNode && targetNode) {
    // Node objects - use canvas coordinates
    const nodeWidth = 240;
    const nodeHeight = 150;
    sourceX = sourceNode.position.x + nodeWidth;
    sourceY = sourceNode.position.y + nodeHeight / 2;
    targetX = targetNode.position.x;
    targetY = targetNode.position.y + nodeHeight / 2;
  } else {
    return null;
  }

  // Calculate bezier curve control points
  const distance = Math.abs(targetX - sourceX);
  const controlPointOffset = Math.min(distance * 0.5, 200);
  
  const controlPoint1X = sourceX + controlPointOffset;
  const controlPoint1Y = sourceY;
  const controlPoint2X = targetX - controlPointOffset;
  const controlPoint2Y = targetY;

  // Create SVG path
  const path = `M ${sourceX} ${sourceY} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${targetX} ${targetY}`;

  // Calculate arrow angle from the curve tangent at target point
  const dx = targetX - controlPoint2X;
  const dy = targetY - controlPoint2Y;
  const angle = Math.atan2(dy, dx);
  
  // Arrow dimensions
  const strokeWidth = 2;
  const shadowWidth = 4;
  const arrowLength = 10;
  const arrowWidth = 6;
  const dashArray = temporary ? '6 3' : '8 4';
  
  // Calculate arrow points based on curve direction
  const arrowTip = { x: targetX, y: targetY };
  const arrowBase1 = {
    x: targetX - arrowLength * Math.cos(angle) - arrowWidth * Math.sin(angle),
    y: targetY - arrowLength * Math.sin(angle) + arrowWidth * Math.cos(angle)
  };
  const arrowBase2 = {
    x: targetX - arrowLength * Math.cos(angle) + arrowWidth * Math.sin(angle),
    y: targetY - arrowLength * Math.sin(angle) - arrowWidth * Math.cos(angle)
  };

  return (
    <g className={`connection-line ${isActive ? 'active' : ''} ${isExecuting ? 'executing' : ''} ${temporary ? 'temporary' : ''}`}>
      {/* Shadow/outline path */}
      <path
        d={path}
        className="connection-path-shadow"
        fill="none"
        strokeWidth={shadowWidth}
        vectorEffect="non-scaling-stroke"
      />
      
      {/* Main path */}
      <path
        d={path}
        className="connection-path"
        fill="none"
        strokeWidth={strokeWidth}
        strokeDasharray={dashArray}
        vectorEffect="non-scaling-stroke"
      />

      {/* Execution progress overlay */}
      {isExecuting && (
        <path
          d={path}
          className="connection-path-progress"
          fill="none"
          strokeWidth="2"
          strokeDasharray={`${executionProgress}% ${100 - executionProgress}%`}
        />
      )}

      {/* Animated dot during execution */}
      {isExecuting && (
        <>
          <circle
            className="connection-dot"
            r="4"
          >
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={path}
            />
          </circle>
          <circle
            className="connection-dot-glow"
            r="6"
          >
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={path}
            />
          </circle>
        </>
      )}

      {/* Arrow head */}
      {!temporary && (
        <path
          d={`M ${arrowBase1.x} ${arrowBase1.y} L ${arrowTip.x} ${arrowTip.y} L ${arrowBase2.x} ${arrowBase2.y}`}
          className="connection-arrow"
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </g>
  );
};

export default ConnectionLine;
