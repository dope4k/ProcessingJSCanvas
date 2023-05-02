import * as p5 from 'p5';
import { Vector } from 'p5';
import Collider, { Collidable } from '../Base/Collider';
import Context, { ContextObject } from '../Base/Context';
import OnKey from '../Base/Events/OnKey';
import OnMouseButton from '../Base/Events/OnMouseButton';
import OnMouseMove from '../Base/Events/OnMouseMove';
import OnMouseWheel from '../Base/Events/OnMouseWheel';
import OnSelection from '../Base/Events/OnSelection';
import OnTouch, { Touch } from '../Base/Events/OnTouch';
import Renderer, { Renderable } from '../Base/Renderer';
import SelectionTool from '../Tools/SelectionTool';
import Edge from './Edge';
import Node from './Node';
import Cell from './Cell';

export default class Table
  implements
    ContextObject,
    OnMouseButton,
    OnMouseMove,
    OnMouseWheel,
    OnTouch,
    OnKey,
    OnSelection,
    Collidable,
    Renderable
{
  zIndex: number = 0;

  id: number;

  edges: Edge[];
  nodes: Node[];

  extents?: Node[];

  bbox: number[] = [0, 0, 0, 0];
  collider: Collider;

  dragExtentIndex?: number;

  initialTouches: Touch[] = [];

  focus: boolean = false;

  cells: Cell[]=[]

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
    for (const node of this.nodes) {
      if (node.OnContextInit) node.OnContextInit(ctx);
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
    if (this.extents) {
      this.extents[0] = topLeft;
      this.extents[1] = topRight;
      this.extents[2] = bottomLeft;
      this.extents[3] = bottomRight;
    } else this.extents = [topLeft, topRight, bottomLeft, bottomRight];
  }

  private findNode(node: Node) {
    return this.nodes.find((n) => n.Equal(node));
  }
  private findEdge(edge: Edge) {
    return this.edges.find((e) => e.Equal(edge));
  }

  CalculateBbox(): void {
    if (this.extents) {
      this.bbox[0] = this.extents[0].x - 20;
      this.bbox[1] = this.extents[0].y - 20;
      this.bbox[2] = this.extents[3].x + 20;
      this.bbox[3] = this.extents[3].y + 20;
    }
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

  AddLink(pointA: Node, pointB: Node, disabled?:boolean) {
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
    if(disabled==true) edge.disabled=true;
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

  newCellToRightExist(newCell:Cell,xCordsCells: number[],allCells:Cell[])
  {
    let rightIndex:number=0;
    //find right index in xCord array
    for(let x=0; x <xCordsCells.length;x++)
    {
      if(xCordsCells[x]==newCell.x)
      {
        if(xCordsCells[x+1])
        {
          rightIndex=xCordsCells[x+1];
          break;
        }
      }
    }
    //if no new index found return false
    if(rightIndex==0)
    {
      return false;
    }
    else
    {
      //check if right side cell exists and is new cell
      for(let x in allCells)
      {
        if(allCells[x].x==rightIndex && allCells[x].y==newCell.y && allCells[x].isNewCell)
        {
          //new cells to right exists and is new Cell
          return true;
        }
      }
      return false;
    }
  }
  newCellToBottomExist(newCell:Cell,yCordsCells:number[],allCells:Cell[])
  {
    let bottomIndex:number=0;
    //find right index in xCord array
    for(let x=0; x < yCordsCells.length;x++)
    {
      if(yCordsCells[x]==newCell.y)
      {
        if(yCordsCells[x+1])
        {
          bottomIndex=yCordsCells[x+1];
          break;
        }
      }
    }
    //if no new index found return false
    if(bottomIndex==0)
    {
      return false;
    }
    else
    {
      //check if right side cell exists and is new cell
      for(let x in allCells)
      {
        if(allCells[x].y==bottomIndex && allCells[x].x==newCell.x && allCells[x].isNewCell)
        {
          //new cells to right exists and is new Cell
          return true;
        }
      }
      return false;
    }
  }

  autoTableCreation(cells:Cell[],minX:number,minY:number,maxX:number, maxY:number,
    xCordsCells: number[],yCordsCells: number[])
  {
    this.cells=cells;
    for(let x=0;x<cells.length;x++)
    {
      //top
      if(cells[x].y==minY)
      {
        this.AddLink(new Node(this,cells[x].x,cells[x].y),
        new Node(this,cells[x].x+cells[x].width,cells[x].y))  
      }

      //left
      if(cells[x].x==minX)
      {
        this.AddLink(new Node(this,cells[x].x,cells[x].y),
        new Node(this,cells[x].x,cells[x].y+cells[x].height))
      }
      
      //bottom
      this.AddLink(new Node(this,cells[x].x,cells[x].y+cells[x].height),
      new Node(this,cells[x].x+cells[x].width,cells[x].y+cells[x].height)),
      
      //right
      this.AddLink(new Node(this,cells[x].x+cells[x].width ,cells[x].y),
      new Node(this,cells[x].x+cells[x].width,cells[x].y+cells[x].height)
      ,(cells[x].isNewCell && this.newCellToRightExist(cells[x],xCordsCells,cells))?true:false
      )
    }
  }

  GetExtentOffset(i: number) {
    if (i == 0) return [-10, -10];
    else if (i == 1) return [10, -10];
    else if (i == 2) return [-10, 10];
    else if (i == 3) return [10, 10];
    return [0, 0];
  }

  Scale(x: number, y: number, originX: number, originY: number) {
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

  SelectCells(selectionTool: SelectionTool) {
    for (const node of this.nodes) {
      if (node.bottomEdge?.end.rightEdge) {
        const cell = node.GetCell();
        if (cell) {
          const [startCell, endCell] = cell;
          if (selectionTool.InSelection(startCell.point, endCell.point)) {
            startCell.SelectCell(true, selectionTool.selectionID);
          } else {
            startCell.SelectCell(false, selectionTool.selectionID);
          }
        }
      }
    }
  }

  UnselectCells() {
    for (const node of this.nodes) {
      node.selectedCell = false;
      node.selectionID = -1;
    }
  }

  MergeSelection() {
    for (const node of this.nodes) {
      node.MergeCells();
    }
    this.UnselectCells();
  }

  UnMergeSelection() {
    for (const node of this.nodes) {
      node.UnMergeCells();
    }
    this.UnselectCells();
  }

  OnSelection(selectionTool?: SelectionTool): void {
    this.Focus();
    if (selectionTool) {
      this.SelectCells(selectionTool);
    } else {
      this.UnselectCells();
    }
  }

  OnMouseWheel(position: Vector, scroll: number): void {
    if (this.collider.PointCollision(position))
      this.Scale(-scroll * 0.1, -scroll * 0.1, position.x, position.y);
  }

  OnMouseButton(
    position: p5.Vector,
    button: string,
    state: 'PRESSED' | 'RELEASED' | 'CLICKED'
  ): boolean {
    for (const node of this.nodes) {
      if (!node.OnMouseButton(position, button, state)) return false;
    }
    if (button === 'left' && state === 'PRESSED' && this.extents) {
      if (this.collider.PointCollision(position)) {
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
      } else this.focus = false;
    }
    if (state === 'RELEASED') {
      this.dragExtentIndex = undefined;
    }
    return true;
  }

  OnMouseMove(position: p5.Vector, button?: string | undefined): void {
    for (const node of this.nodes) node.OnMouseMove(position, button);
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

  OnTouch(touches: Touch[], state: 'STARTED' | 'MOVED' | 'ENDED'): boolean {
    if (touches.length === 1) {
      for (const node of this.nodes) node.OnTouch(touches, state);
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
    return true;
  }

  OnKey(button: string, state: 'PRESSED' | 'RELEASED' | 'TYPED'): void {
    if (button === 'm' && state === 'PRESSED') {
      this.MergeSelection();
      Renderer.Render();
    } else if (button === 'u' && state === 'PRESSED') {
      this.UnMergeSelection();
      Renderer.Render();
    }
  }

  PreRender(ctx: p5): void {
    this.CalculateBbox();
    for (const node of this.nodes) node.PreRender(ctx);
  }

  Render(ctx: p5): void {
    {
      //Draw Transform box for Table
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
    for (const node of this.nodes) node.Render(ctx);
  }
}
