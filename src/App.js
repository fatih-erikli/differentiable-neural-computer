import {
  useState,
  useEffect,
  useRef,
} from 'react';

import logo from './logo.svg';
import './App.css';


const INP = { x: 1, y: 1 };
const OUT = { x: 0, y: 0 };
const REC = { x: 1, y: 0 };
const MEM = { x: 0, y: 1 };
const NON = { x: -1, y: -1};
`
This is a canvas of 2x2 piksels
We draw node types to that canvas
X corresponds to the horizontal and
Y corresponds to the vertical.

    +-----------------+
    | OUTPUT | RECORD |
    |--------+--------|
    | MEMORY | INPUT  |
    +-----------------+
    Something like that
    
This is a sparse matrix.
The type NON is out of space.
It is not visible in canvas,
It represents the silence.`

const skipEmptyCell = ({ x, y }) =>
  x > -1 && y > -1;

const applyToGrid = ({ x, y }) =>
  x === -1 && y === -1 ? NaN : Math.sin(x) + Math.cos(y);

const initialEdges = [];

function f(cellType) {
  return (first, second, third) => {
    initialEdges.push([first * 10, second * 10]);
    return cellType;
  };
};

const WIDTH = window.innerWidth - 15;
const HEIGHT = window.innerHeight - 10;
const COLS = 7;
const ROWS = 7;
const HORIZONTAL_OFFSET = 1;
const VERTICAL_OFFSET = 1;

function applyPositions(node, index) {
  return {
    ...node,
    x: (((index % COLS) + (HORIZONTAL_OFFSET/2)) * (WIDTH / COLS)),
    y: (Math.floor(index / COLS) + VERTICAL_OFFSET) * HEIGHT / ROWS,
  };
}

const INITIAL_NODES = [
 // 0              // 1              // 2              // 3              // 4              // 5              // 6
 f(NON)(0.0, 0.0), f(INP)(0.0, 0.4), f(REC)(1.7, 0.0), f(REC)(2.3, 2.5), f(REC)(0.0, 1.2), f(NON)(0.0, 0.0), f(NON)(0.0, 0.0),
 // 7              // 8              // 9              // 10             // 11             // 12             // 13
 f(NON)(0.0, 0.0), f(NON)(0.0, 0.0), f(NON)(0.0, 0.0), f(NON)(0.0, 0.0), f(NON)(0.0, 0.0), f(OUT)(0.0, 1.8), f(NON)(0.0, 0.0),
 // 14             // 15             // 16             // 17             // 18             // 19             // 20
 f(NON)(0.0, 0.0), f(INP)(0.2, 1.8), f(REC)(0.3, 0.1), f(REC)(0.3, 0.4), f(REC)(0.3, 0.0), f(NON)(0.0, 0.0), f(NON)(0.0, 0.0),
 // 21             // 22             // 23             // 24             // 25             // 26             // 27
 f(NON)(0.0, 0.0), f(NON)(0.0, 0.0), f(INP)(1.8, 1.7), f(NON)(0.0, 0.0), f(OUT)(1.6, 1.7), f(NON)(0.0, 0.0), f(NON)(0.0, 0.0),
 // 28             // 29             // 30             // 31             // 32             // 33             // 34
 f(MEM)(2.3, 2.5), f(MEM)(2.3, 2.5), f(MEM)(2.3, 2.5), f(MEM)(2.3, 2.5), f(MEM)(2.3, 0.0), f(MEM)(2.3, 2.5), f(MEM)(2.3, 2.5),
 // 35             // 36             // 37             // 38             // 39             // 40             // 41
 f(MEM)(2.8, 0.0), f(MEM)(2.9, 0.0), f(MEM)(0.2, 0.0), f(MEM)(3.1, 0.0), f(MEM)(0.4, 0.0), f(MEM)(3.3, 0.0), f(MEM)(3.4, 0.0), 
].map(
  applyToGrid
).map(
  (point) => {
    if (isNaN(point)) {return { ...NON, NON: true, color: 'rgba(0, 0, 0, 0.1)' }}

    if (point < 1) {
      return { ...MEM, MEM: true, color: 'blue', memory: true }
    }

    else if (point === 1) {
      return { ...OUT, OUT: true, color: 'rgba(255, 0, 0, 0.3)' }
    }


    else if (Math.atan(point) > 1) {
      return { ...REC, REC: true, color: 'rgba(0, 0, 255, 0.3)' } 
    }

    else {
      return { ...INP, INP: true, color: 'rgba(0, 255, 0, 0.3)' } 
    }

  }
).map(applyPositions);

const INITIAL_EDGES = initialEdges.map(
  (edges, index) => {
    const [first, second] = edges;
    const newEdges = [];

    if (first) {
      newEdges.push({
        source: index,
        target: first
      }); 
    }

    if (second) {
      newEdges.push({
        source: index,
        target: second
      }); 
    }
    return newEdges;
  }
).flat().concat(
  // fill the recurrent cells
  (
    INITIAL_NODES
    .map(({ REC }, index) => REC && ({
      source: index,
      target: index,
    }))
  ).filter(Boolean)
);

function setBounds(point, min, max) {
  return point;
  return (
    Math.min(
      Math.max(min, point),
      max
    )
  );
}

function Node({
  x,
  y,
  color,
  memory,
}) {
  const radius = WIDTH / (COLS * 6);

  return memory ? (
    <circle cx={ x } cy={ y } r={ radius } fill={"url(#memory)"}/>
  ) : (
    <circle cx={ x } cy={ y } r={ radius } fill={color} />
  );
}

function Edge({
  nodes, 
  relationship,
}) {
  const source = nodes[relationship.source];
  const target = nodes[relationship.target];

  if (!source || !target) {
    return;
  }

  if (relationship.source === relationship.target) {
    return (<path d={`
      M${source.x} ${source.y}
      C${source.x - 30} ${source.y - 35}
       ${source.x + 30} ${source.y - 35}
       ${source.x} ${source.y}
    `} stroke="black" strokeWidth={2} fill="transparent" />);
  }

  return (
    <line
      strokeWidth={ 2 }
      stroke={ '#000' }
      x1={ source.x }
      y1={ source.y }
      x2={ target.x }
      y2={ target.y }
    />
  );
}

function App() {
  const [nodes, setNodes] = useState(INITIAL_NODES);
  const [edges, setEdges] = useState(INITIAL_EDGES);
  const [tick, setTick] = useState(0);
  const [inProgress, setInProgress] = useState(false);
  const [readyToRender, setReadyToRender] = useState(false);

  const canvas = useRef(null);

  useEffect(() => {
    if (inProgress) return;
    // const simulation = forceSimulation(nodes)
    // .force("charge", forceManyBody())
    // .force("link", forceLink(edges).distance(2))
    // .force("center", forceCenter());

    // simulation.on('tick', () => {
    //   setTick(tick + 1);
    //   setNodes(nodes.map((node) => ({ ...node, tick })));
    // });
  }, [inProgress]);

  useEffect(() => {
    setReadyToRender(true);
  }, [nodes])

  useEffect(() => {
    setInProgress(true);
  })

  return (
    <div className="App">
      <svg width= { WIDTH } ref={ canvas } height={ HEIGHT }>
        <defs>
          <radialGradient id="memory">
            <stop offset="0%" stopColor="blue" />
            <stop offset="50%" stopColor="blue" />
            <stop offset="52%" stopColor="black" />
            <stop offset="54%" stopColor="black" />
            <stop offset="56%" stopColor="black" />
            <stop offset="58%" stopColor="blue" />
            <stop offset="100%" stopColor="blue" />
          </radialGradient>
        </defs>
        <g>
        { readyToRender && edges.map((edge, index) => (
            <Edge nodes={ nodes } relationship={ edge } key={ `edge-${index}` } />
        ))}</g>       { nodes.map((node, index) => (
            <Node id={ index } key={ index } { ...node } />
          )) }
 
      </svg>
    </div>
  );
}

export default App;
