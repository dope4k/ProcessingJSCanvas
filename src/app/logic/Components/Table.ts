import * as p5 from 'p5';
import { Vector } from 'p5';
import Collider, { Collidable } from '../Base/Collider';
import Context, { ContextObject } from '../Base/Context';
import OnMouseButton from '../Base/Events/OnMouseButton';
import OnMouseMove from '../Base/Events/OnMouseMove';
import OnMouseWheel from '../Base/Events/OnMouseWheel';
import OnTouch, { Touch } from '../Base/Events/OnTouch';
import Renderer, { Renderable } from '../Base/Renderer';
import Edge from './Edge';
import Node from './Node';

export default class Table
  implements
    ContextObject,
    OnMouseButton,
    OnMouseMove,
    OnMouseWheel,
    OnTouch,
    Collidable,
    Renderable
{
  zIndex: number = 0;

  id: number;

  edges: Edge[];
  nodes: Node[];

  extents?: Node[];
  collider: Collider;

  dragExtentIndex?: number;

  initialTouches: Touch[] = [];

  focus: boolean = false;

  constructor() {
    this.edges = [];
    this.nodes = [];
    this.collider = new Collider(this);
    this.id = Context.id;
  }

  OnContextInit(ctx: Context): void {
    for (const edge of this.edges) {
      ctx.AddObject(edge);
    }
    this.CalculateExtents();
    Renderer.Render();
  }

  CalculateExtents() {
    let topLeft = this.nodes[0];
    let topRight = this.nodes[0];
    let bottomRight = this.nodes[0];
    let bottomLeft = this.nodes[0];
    for (const node of this.nodes) {
      if (node.x < topLeft.x || node.y < topLeft.y) topLeft = node;
      if (node.x > topRight.x || node.y < topRight.y) topRight = node;
      if (node.x > bottomRight.x || node.y > bottomRight.y) bottomRight = node;
      if (node.x < bottomLeft.x || node.y > bottomLeft.y) bottomLeft = node;
    }
    this.extents = [topLeft, topRight, bottomLeft, bottomRight];
  }

  private findNode(node: Node) {
    return this.nodes.find((n) => n.Equal(node));
  }
  private findEdge(edge: Edge) {
    return this.edges.find((e) => e.Equal(edge));
  }

  Bbox(): number[] {
    this.CalculateExtents();
    return [
      this.extents![0].x - 10,
      this.extents![0].y - 10,
      this.extents![3].x + 10,
      this.extents![3].y + 10,
    ];
  }

  AddNode(node: Node) {
    const graphNode = this.findNode(node);
    if (graphNode) return graphNode;
    else this.nodes.push(node);
    return node;
  }

  RemoveNode(node: Node) {
    this.nodes = this.nodes.filter((n) => !n.Equal(node));
  }

  RemoveEdge(edge: Edge) {
    this.edges = this.edges.filter((e) => !e.Equal(edge));
  }

  AddEdge(edge: Edge) {
    const graphEdge = this.findEdge(edge);
    if (graphEdge) return graphEdge;
    else this.edges.push(edge);
    return edge;
  }

  AddLink(pointA: Node, pointB: Node) {
    pointA = this.AddNode(pointA);
    pointB = this.AddNode(pointB);
    let edge = new Edge(this, pointA, pointB);
    edge = this.AddEdge(edge);
    if (edge.isHorizontal) {
      edge.start.rightEdge = edge;
      edge.end.leftEdge = edge;
    } else if (edge.isVertical) {
      edge.start.bottomEdge = edge;
      edge.end.topEdge = edge;
    }
    return edge;
  }

  CreateTable(
    originX: number,
    originY: number,
    nRows: number,
    nCols: number,
    cellSize: number = 100
  ) {
    for (let i = originX; i < nRows * cellSize + originX; i += cellSize) {
      for (let j = originY; j < nCols * cellSize + originY; j += cellSize) {
        this.AddLink(new Node(this, i, j), new Node(this, i + cellSize, j));
        this.AddLink(
          new Node(this, i + cellSize, j),
          new Node(this, i + cellSize, j + cellSize)
        );
        this.AddLink(
          new Node(this, i, j + cellSize),
          new Node(this, i + cellSize, j + cellSize)
        );
        this.AddLink(new Node(this, i, j), new Node(this, i, j + cellSize));
      }
    }
  }

  GetExtentOffset(i: number) {
    let [offsetX, offsetY] = [0, 0];
    if (i == 0) {
      offsetX = -10;
      offsetY = -10;
    } else if (i == 1) {
      offsetX = 10;
      offsetY = -10;
    } else if (i == 2) {
      offsetX = -10;
      offsetY = 10;
    } else if (i == 3) {
      offsetX = 10;
      offsetY = 10;
    }
    return [offsetX, offsetY];
  }

  Scale(x: number, y: number, originX: number, originY: number) {
    this.CalculateExtents();
    if (this.extents) {
      const [topLeftX, topLeftY] = [this.extents[0].x, this.extents[0].y];
      for (const node of this.nodes) {
        if (node.x < originX) {
          node.x -= x * Math.abs((originX - node.x) / (originX - topLeftX));
        } else if (node.x > originX) {
          node.x += x * Math.abs((originX - node.x) / (originX - topLeftX));
        }
        if (node.y < originY) {
          node.y -= y * Math.abs((originY - node.y) / (originY - topLeftY));
        } else if (node.y > originY) {
          node.y += y * Math.abs((originY - node.y) / (originY - topLeftY));
        }
      }
      Renderer.Render();
    }
  }

  Focus(focus: boolean = true) {
    this.focus = focus;
  }

  OnMouseWheel(position: Vector, scroll: number): void {
    if (this.collider.PointCollision(position))
      this.Scale(-scroll * 0.1, -scroll * 0.1, position.x, position.y);
  }

  OnMouseButton(
    position: p5.Vector,
    button: string,
    state: 'PRESSED' | 'RELEASED' | 'CLICKED'
  ): boolean | null {
    if (button === 'left' && state === 'PRESSED' && this.extents) {
      if (!this.collider.PointCollision(position)) this.focus = false;
      let i = 0;
      for (const extentPoint of this.extents) {
        let [offsetX, offsetY] = this.GetExtentOffset(i);
        if (
          Collider.PointCollision(position, [
            extentPoint.x - extentPoint.radius + offsetX,
            extentPoint.y - extentPoint.radius + offsetY,
            extentPoint.x + extentPoint.radius + offsetX,
            extentPoint.y + extentPoint.radius + offsetY,
          ])
        ) {
          this.focus = true;
          this.dragExtentIndex = i;
          return false;
        }
        ++i;
      }
    }
    if (state === 'RELEASED') {
      this.dragExtentIndex = undefined;
    }
    return null;
  }

  OnMouseMove(position: p5.Vector, button?: string | undefined): void {
    if (this.extents && this.dragExtentIndex != undefined) {
      const point = this.extents[this.dragExtentIndex];
      const otherPoint = this.extents[3 - this.dragExtentIndex];
      let [offsetX, offsetY] = this.GetExtentOffset(3 - this.dragExtentIndex);
      position.x += offsetX;
      position.y += offsetY;
      const [distX, distY] = [
        (position.x - point.x) / Math.abs(otherPoint.x - position.x),
        (position.y - point.y) / Math.abs(otherPoint.y - position.y),
      ];
      const movementsX: number[] = [];
      const movementsY: number[] = [];
      for (const node of this.nodes) {
        const movementX = distX * Math.abs(otherPoint.x - node.x);
        const movementY = distY * Math.abs(otherPoint.y - node.y);
        if (movementX < 0) {
          if (node.leftEdge) {
            movementsX.push(
              node.leftEdge.length + movementX > node.radius ? movementX : 0
            );
          } else {
            movementsX.push(movementX);
          }
        } else if (movementX > 0) {
          if (node.rightEdge) {
            movementsX.push(
              node.rightEdge.length - movementX > node.radius ? movementX : 0
            );
          } else {
            movementsX.push(movementX);
          }
        } else movementsX.push(0);
        if (movementY < 0) {
          if (node.topEdge) {
            movementsY.push(
              node.topEdge.length + movementY > node.radius ? movementY : 0
            );
          } else {
            movementsY.push(movementY);
          }
        } else if (movementY > 0) {
          if (node.bottomEdge) {
            movementsY.push(
              node.bottomEdge.length - movementY > node.radius ? movementY : 0
            );
          } else {
            movementsY.push(movementY);
          }
        } else movementsY.push(0);
      }
      let i = 0;
      for (const node of this.nodes) {
        node.x += movementsX[i];
        node.y += movementsY[i++];
      }
      Renderer.Render();
    }
  }

  OnTouch(
    touches: Touch[],
    state: 'STARTED' | 'MOVED' | 'ENDED'
  ): boolean | null {
    if (touches.length === 1) {
      const touchPosition = new Vector(touches[0].x, touches[0].y);
      if (state === 'STARTED') {
        return this.OnMouseButton(touchPosition, 'left', 'PRESSED');
      } else if (state === 'MOVED') {
        this.OnMouseMove(touchPosition, 'left');
      }
    } else if (touches.length === 2) {
      if (state === 'STARTED') this.initialTouches = [touches[0], touches[1]];
      else if (state === 'MOVED' && this.initialTouches.length == 2) {
        const [midPointX, midPointY] = [
          (touches[0].x + touches[1].x) / 2,
          (touches[0].y + touches[1].y) / 2,
        ];

        this.Scale(
          (Math.abs(touches[1].x - touches[0].x) -
            Math.abs(this.initialTouches[1].x - this.initialTouches[0].x)) *
            0.01,
          (Math.abs(touches[1].y - touches[0].y) -
            Math.abs(this.initialTouches[1].y - this.initialTouches[0].y)) *
            0.01,
          midPointX,
          midPointY
        );
        return false;
      }
    } else if (state === 'ENDED') {
      this.OnMouseButton(new Vector(), 'left', 'RELEASED');
    }
    return null;
  }

  Render(ctx: p5): void {
    {
      //Draw Transform box for Table
      this.CalculateExtents();

      if (this.extents && this.focus) {
        ctx.fill(0, 0, 0, 0);
        ctx.stroke(128, 128, 128, 255);
        ctx.strokeWeight(1);
        ctx.rect(
          this.extents[0].x - 10,
          this.extents[0].y - 10,
          this.extents[3].x - this.extents[0].x + 20,
          this.extents[3].y - this.extents[0].y + 20
        );
        for (let i = 0; i < this.extents.length; ++i) {
          let [offsetX, offsetY] = this.GetExtentOffset(i);
          ctx.stroke(0, 255, 0, 255);
          ctx.strokeWeight(this.extents[i].radius * 2);
          ctx.point(this.extents[i].x + offsetX, this.extents[i].y + offsetY);
        }
      }
    }
  }
}
