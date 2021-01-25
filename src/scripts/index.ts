import * as d3 from 'd3';
const dataJson = require('../data/d3_mindmap.json');

import '../styles/style.css';

if (process.env.NODE_ENV === 'development') {
  require('../index.html');
}

interface POINT {
  x: number;
  y: number;
}

const screenWidth = 960;
const screenHeight = 800;
const margin = { top: 20, right: 120, bottom: 20, left: 120 };
const width = screenWidth - margin.right - margin.left;
const height = screenHeight - margin.top - margin.bottom;

const duration = 750;
let i = 0;
let root: any = null;

const tree = d3.tree().size([height, width]);

const svg = d3
  .select('#paper')
  .append('svg')
  .attr('width', screenWidth)
  .attr('height', screenHeight)
  .append('g')
  .attr('transform', `translate(${margin.left}, ${margin.top})`);


function diagonal(s: POINT, d: POINT) {
  const path = `M ${s.y} ${s.x}
  C ${(s.y + d.y) / 2} ${s.x},
    ${(s.y + d.y) / 2} ${d.x},
    ${d.y} ${d.x}`;

  return path;
};

function collapse(d: any) {
  if (d.children) {
    d._children = d.children;
    d._children.forEach(collapse);
    d.children = null;
  }
};

function update(source: any) {
  // Compute the new tree layout.
  const treeRoot = tree(root);
  const nodes = treeRoot.descendants();
  const links = nodes.slice(1);

  // Normalize for fixed-depth.
  nodes.forEach((d: any) => { d.y = d.depth * 180; });

  // Update the nodes…
  const node = svg.selectAll<SVGGElement, unknown>('g.node')
    .data(nodes, (d: any) => d.id || (d.id = ++i));

  // Enter any new nodes at the parent's previous position.
  const nodeEnter = node
    .enter()
    .append('g')
    .attr('class', 'node')
    .attr('transform', () => `translate(${source.y0}, ${source.x0})`)
    .on('click', click);
  nodeEnter
    .append('circle')
    .attr('r', 1e-6)
    .style('fill', (d: any) => d._children ? 'lightsteelblue' : '#fff');
  nodeEnter
    .append('text')
    .attr('x', (d: any) => d.children || d._children ? -10 : 10)
    .attr('dy', '.35em')
    .attr('text-anchor', (d: any) => d.children || d._children ? 'end' : 'start')
    .text((d: any) => d.data.name)
    .style('fill-opacity', 1e-6);


  // Transition nodes to their new position.
  const nodeUpdate = nodeEnter.merge(node);
  nodeUpdate
    .transition()
    .duration(duration)
    .attr('transform', (d: any) =>`translate(${d.y}, ${d.x})`);
  nodeUpdate
    .select('circle')
    .attr('r', 4.5)
    .style('fill', (d: any) => d._children ? 'lightsteelblue' : '#fff');
  nodeUpdate.select('text').style('fill-opacity', 1);

  // Transition exiting nodes to the parent's new position.
  const nodeExit = node
    .exit()
    .transition()
    .duration(duration)
    .attr('transform', `translate(${source.y}, ${source.x})`)
    .remove();
  nodeExit.select('circle').attr('r', 1e-6);
  nodeExit.select('text').style('fill-opacity', 1e-6);

  // Update the links…
  const link = svg.selectAll<SVGPathElement, any>('path.link').data(links, (d: any) => d.id);

  // Enter any new links at the parent's previous position.
  const linkEnter = link
    .enter()
    .insert('path', 'g')
    .attr('class', 'link')
    .attr('d', () => {
      const o = { x: source.x0, y: source.y0 };
      return diagonal(o, o);
    });

  // Transition links to their new position.
  const linkUpdate = linkEnter.merge(link);
  linkUpdate.transition().duration(duration).attr('d', (d: any) => diagonal(d, d.parent));

  // Transition exiting nodes to the parent's new position.
  link
    .exit()
    .transition()
    .duration(duration)
    .attr('d', (d: any) => {
      const o = { x: source.x, y: source.y };
      return diagonal(o, o);
    })
    .remove();

  // Stash the old positions for transition.
  nodes.forEach((d: any) => {
    d.x0 = d.x;
    d.y0 = d.y;
  });
};

// Toggle children on click.
function click(d: any) {
  if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  }

  update(d);
};

// append the circle elements at random positions
const render = () => {
  root = d3.hierarchy(dataJson, (d: any) => d.children);
  root.x0 = height / 2;
  root.y0 = 0;
  root.children.forEach(collapse);

  update(root);

  d3.select(self.frameElement).style('height', '800px');
};

document.addEventListener('DOMContentLoaded', () => {
  render();
});
