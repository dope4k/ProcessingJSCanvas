import * as p5 from 'p5';
import { Vector } from 'p5';
import Collider, { Collidable } from '../Base/Collider';
import Context, { ContextObject } from '../Base/Context';
import OnKey from '../Base/Events/OnKey';
import OnMouseButton from '../Base/Events/OnMouseButton';
import OnMouseMove from '../Base/Events/OnMouseMove';
import OnTouch, { Touch } from '../Base/Events/OnTouch';
import Renderer, { Renderable } from '../Base/Renderer';
import Button from './Button';
import Node from './Node';
import Table from './Table';
import { AppServiceService } from 'src/app/app-service.service';

export default class Edge
  implements
    ContextObject,
    Renderable,
    OnKey,
    OnMouseMove,
    OnMouseButton,
    OnTouch,
    Collidable
{
  zIndex: number = 0;

  collider: Collider;
  table: Table;

  id: number;

  start: Node;
  end: Node;

  edgeWidth: number;
  color: number[];
  highlightColor: number[];

  extend_button?: Button;
  add_button?: Button;
  magicSplit_addBtn?: Button;
  magicSplit_deleteBtn?: Button;
  delete_button?: Button;

  isClickHold: boolean = false;
  selected: boolean = false;
  
  magicAdd: boolean = false;
  magicRemove: boolean = false;
  magicSplitActive: boolean = false;

  selectPositionN?: number;

  disabled: boolean = false;


  bbox: number[] = [0, 0, 0, 0];

  private __isVertical: boolean;
  private __isHorizontal: boolean;
  get isVertical() {
    return this.__isVertical;
  }

  get isHorizontal() {
    return this.__isHorizontal;
  }

  get x1() {
    return this.start.x;
  }

  set x1(val: number) {
    this.start.x = val;
  }

  get y1() {
    return this.start.y;
  }

  set y1(val: number) {
    this.start.y = val;
  }

  get x2() {
    return this.end.x;
  }

  set x2(val: number) {
    this.end.x = val;
  }

  get y2() {
    return this.end.y;
  }

  set y2(val: number) {
    this.end.y = val;
  }

  get length() {
    return Vector.dist(this.start.point, this.end.point);
  }

  get center() {
    return new Vector((this.x2 + this.x1) / 2, (this.y2 + this.y1) / 2);
  }

  get selectedCell() {
    if (this.start.selectedCell) return true;
    else if (this.isVertical && this.start.leftEdge?.start.selectedCell)
      return true;
    else if (this.isHorizontal && this.start.topEdge?.start.selectedCell)
      return true;
    return false;
  }

  get focusHorizontal() {
    return (
      this.isHorizontal &&
      (this.start.focusHorizontal || this.end.focusHorizontal)
    );
  }
  get focusVertical() {
    return (
      this.isVertical && (this.start.focusVertical || this.end.focusVertical)
    );
  }

  get column()
  {
    let count=1;
    const mainEdge=this;
    let letfEdge=mainEdge.start.leftEdge;
    while(letfEdge!=undefined)
    {
      count++;
      letfEdge=letfEdge.start.leftEdge
    }
    return count;
  }

  get row()
  {
    let count=1;
    const mainEdge=this;
    let topEdge=mainEdge.start.topEdge;
    while(topEdge!=undefined)
    {
      count++;
      topEdge=topEdge.start.topEdge
    }
    return count;
  }

  constructor(
    table: Table,
    nodeA: Node,
    nodeB: Node,
    edgeWidth: number = 3,
    color = [0, 0, 0, 255],
    highlightColor = [128, 128, 128, 255],
    private appService?: AppServiceService
  ) {
    this.table = table;
    this.collider = new Collider(this);

    this.__isVertical = nodeA.x === nodeB.x;
    this.__isHorizontal = nodeA.y === nodeB.y;
    if (this.isHorizontal) {
      const check = nodeA.x < nodeB.x;
      this.start = check ? nodeA : nodeB;
      this.end = check ? nodeB : nodeA;
    } else if (this.isVertical) {
      const check = nodeA.y < nodeB.y;
      this.start = check ? nodeA : nodeB;
      this.end = check ? nodeB : nodeA;
    } else {
      throw 'Edges can only be Horizontal or Vertical';
    }
    this.id = Context.id;

    this.color = color;
    this.highlightColor = highlightColor;
    this.edgeWidth = edgeWidth;

  }

  OnContextInit(ctx: Context): void {
    if (this.BoundaryEdge()) {
      this.InitExtendButton();
      this.InitAddButton();
    } else {
      this.InitDeleteButton();
    }
    Renderer.Render();
  }

  InitExtendButton() {
    const center = this.center;
    if (this.isHorizontal) {
      this.extend_button = new Button(
        'ARROW',
        center.x,
        center.y + (this.start.topEdge ? 10 : -10),
        8,
        this.start.topEdge ? 'DOWN' : 'UP'
      );
    } else if (this.isVertical) {
      this.extend_button = new Button(
        'ARROW',
        center.x + (this.start.leftEdge ? 10 : -10),
        center.y,
        8,
        this.start.leftEdge ? 'RIGHT' : 'LEFT'
      );
    }
    if (this.extend_button)
      this.extend_button.OnPress = () => {
        if (this.isVertical)
          this.ExtendDuplicate(
            this.start.leftEdge?.length || this.start.rightEdge?.length
          );
        else if (this.isHorizontal)
          this.ExtendDuplicate(
            this.start.topEdge?.length || this.start.bottomEdge?.length
          );
      };
  }

  InitAddButton() {
    const center = this.center;
    if (this.isVertical) center.x += this.start.leftEdge ? -10 : 10;
    else if (this.isHorizontal) center.y += this.start.topEdge ? -10 : 10;
    this.add_button = new Button('PLUS', center.x, center.y, 8);
    if (this.add_button) {
      this.add_button.OnPress = () => {
        if (this.selectPositionN) this.RecursiveSplit(this.selectPositionN);
      };
    }
  }

  private makeBothMagicSplitOptionsUndefined()
  {
    this.magicSplit_deleteBtn=undefined 
    this.magicSplit_addBtn=undefined
  }

  InitNewAddButton() {
    const center = this.center;
    if (this.isVertical) center.x += this.start.leftEdge ? -10 : -10;
    else if (this.isHorizontal) center.y += this.start.topEdge ? -10 : -10;
    this.magicSplit_addBtn = new Button('magicPlus', center.x, center.y, 8);
    if (this.magicSplit_addBtn) {
      this.magicSplit_addBtn.OnPress = () => {
        //removes both magic split buttons 
        this.makeBothMagicSplitOptionsUndefined()
        //toggle the flag we want
        this.magicAdd =false;   
        this.magicRemove =true;
        //initialize the magic split button again
        this.InitNewDeleteButton()
        Renderer.Render()     
      };
    }
  }

  InitNewDeleteButton() {
    const center = this.center;
    if (this.isVertical) center.x += this.start.leftEdge ? -10 : -10;
    else if (this.isHorizontal) center.y += this.start.topEdge ? -10 : -10;
    this.magicSplit_deleteBtn = new Button('magicMinus', center.x, center.y, 8);
    if (this.magicSplit_deleteBtn) {
      this.magicSplit_deleteBtn.OnPress = () => {
        //removes both magic split buttons 
        this.makeBothMagicSplitOptionsUndefined()
        //toggle the flag we want
        this.magicAdd =true;   
        this.magicRemove =false;
        //initialize the magic split button again
        this.InitNewAddButton()
        Renderer.Render() 
      };
    }
  }

  InitDeleteButton() {
    const center = this.center;
    this.delete_button = new Button(
      'CROSS',
      center.x,
      center.y,
      8,
      this.isVertical ? 'UP' : 'LEFT'
    );
    if (this.delete_button) {
      this.delete_button.OnPress = () => {
        if (this.delete_button?.shape === 'SYNC') {
          this.Disable(false);
        } else if (this.delete_button?.shape === 'CROSS') {
          this.Disable(true);
          this.start.Dissolve();
        }
      };
    }
  }

  CalculateAddButtonProps() {
    if (this.add_button && this.selectPositionN !== undefined) {
      let position = Vector.lerp(
        this.start.point,
        this.end.point,
        this.selectPositionN
      );
      if (this.isVertical) position.x += this.start.leftEdge ? -10 : 10;
      else if (this.isHorizontal) position.y += this.start.topEdge ? -10 : 10;
      this.add_button.position = position;
    } else {
      this.InitExtendButton();
    }
  }

  CalculateNewAddButtonProps() {
    if (this.magicSplit_addBtn) {
      let position = Vector.lerp(
        this.start.point,
        this.end.point,
        0.5 //makes the position in center
      );
      if (this.isVertical) position.x += this.start.leftEdge ? -10 : 10;
      else if (this.isHorizontal) position.y += this.start.topEdge ? -10 : 10;
      this.magicSplit_addBtn.position = position;
    } else {
      this.InitNewAddButton();
    }
  }

  CalculateNewDeleteButtonProps() {
    if (this.magicSplit_deleteBtn && this.selectPositionN !== undefined) {
      let position = Vector.lerp(
        this.start.point,
        this.end.point,
        this.selectPositionN
      );
      if (this.isVertical) position.x += this.start.leftEdge ? -10 : 10;
      else if (this.isHorizontal) position.y += this.start.topEdge ? -10 : 10;
      this.magicSplit_deleteBtn.position = position;
    } else {
      this.InitNewDeleteButton();
    }
  }

  CalculateDeleteButtonProps() {
    if (this.delete_button) {
      this.delete_button.position = this.center;
      if (this.disabled && this.delete_button.shape != 'SYNC') {
        this.delete_button.shape = 'SYNC';
        this.delete_button.RecalculateProps();
      } else if (!this.disabled && this.delete_button.shape != 'CROSS') {
        this.delete_button.shape = 'CROSS';
        this.delete_button.RecalculateProps();
      }
    } else {
      this.InitDeleteButton();
    }
  }

  CalculateExtendButtonProps() {
    if (this.extend_button) {
      const center = this.center;
      if (this.isVertical) {
        this.extend_button.position.x =
          center.x + (this.start.leftEdge ? 10 : -10);
        this.extend_button.position.y = center.y;
      } else if (this.isHorizontal) {
        this.extend_button.position.x = center.x;
        this.extend_button.position.y =
          center.y + (this.start.topEdge ? 10 : -10);
      }
    } else {
      this.InitExtendButton();
    }
  }

  CalculateBBOX() {
    const extraDisabledWidth = 4;
    if (this.isVertical) {
      this.bbox[0] =
        this.start.x -
        this.edgeWidth -
        (this.disabled ? extraDisabledWidth : 0);
      this.bbox[1] = this.start.y;
      this.bbox[2] =
        this.end.x + this.edgeWidth + (this.disabled ? extraDisabledWidth : 0);
      this.bbox[3] = this.end.y;
    } else {
      this.bbox[0] = this.start.x;
      this.bbox[1] =
        this.start.y -
        this.edgeWidth -
        (this.disabled ? extraDisabledWidth : 0);
      this.bbox[2] = this.end.x;
      this.bbox[3] =
        this.end.y + this.edgeWidth + (this.disabled ? extraDisabledWidth : 0);
    }
  }

  SplitEdge(n: number) {
    if (Number.isNaN(n) || n <= 0 || n >= 1) return;
    const splitPoint = Vector.lerp(this.start.point, this.end.point, n);
    const splitNode = this.table.AddNode(
      new Node(this.table, splitPoint.x, splitPoint.y)
    );
    let newEdge = new Edge(this.table, splitNode, this.end);
    newEdge.disabled = this.disabled;
    this.end = splitNode;
    newEdge = this.table.AddEdge(newEdge);
    if (this.isVertical) {
      splitNode.topEdge = this;
      splitNode.bottomEdge = newEdge;
      newEdge.end.topEdge = newEdge;
    } else if (this.isHorizontal) {
      splitNode.leftEdge = this;
      splitNode.rightEdge = newEdge;
      newEdge.end.leftEdge = newEdge;
    }
    Context.context?.AddObject(newEdge);
    return splitNode;
  }

  RecursiveSplit(n: number) {
    const newNode = this.SplitEdge(n);
    let currentEdge: Edge | undefined = this;
    if (this.isHorizontal) {
      let lastNode: Node | undefined = newNode;
      while ((currentEdge = currentEdge?.start.topEdge)) {
        const node = currentEdge.start.rightEdge?.SplitEdge(n);
        if (node && lastNode) {
          const edge = this.table.AddLink(node, lastNode);
          Context.context?.AddObject(edge);
          lastNode = node;
        }
      }
      lastNode = newNode;
      currentEdge = this.start.bottomEdge;
      do {
        const node = currentEdge?.end.rightEdge?.SplitEdge(n);
        if (node && lastNode) {
          const edge = this.table.AddLink(node, lastNode);
          Context.context?.AddObject(edge);
          lastNode = node;
        }
      } while ((currentEdge = currentEdge?.end.bottomEdge));
    } else if (this.isVertical) {
      let lastNode: Node | undefined = newNode;
      while ((currentEdge = currentEdge?.start.leftEdge)) {
        const node = currentEdge.start.bottomEdge?.SplitEdge(n);
        if (node && lastNode) {
          const edge = this.table.AddLink(node, lastNode);
          Context.context?.AddObject(edge);
          lastNode = node;
        }
      }
      lastNode = newNode;
      currentEdge = this.start.rightEdge;
      do {
        const node = currentEdge?.end.bottomEdge?.SplitEdge(n);
        if (node && lastNode) {
          const edge = this.table.AddLink(node, lastNode);
          Context.context?.AddObject(edge);
          lastNode = node;
        }
      } while ((currentEdge = currentEdge?.end.rightEdge));
    }
  }

  Select(select: boolean = true, select_position?: Vector) {
   
    this.selected = select;
    if (select_position) {
      if (this.isHorizontal) {
        this.selectPositionN =
          (this.start.point.x - select_position.x) /
          (this.start.point.x - this.end.point.x);
      } else if (this.isVertical) {
        this.selectPositionN =
          (this.start.point.y - select_position.y) /
          (this.start.point.y - this.end.point.y);
      }
    } else {
      this.selectPositionN = undefined;
    }
  }

  Equal(rhs: Edge) {
    return (
      this.id === rhs.id ||
      (this.start.Equal(rhs.start) && this.end.Equal(rhs.end))
    );
  }

  BoundaryEdge() {
    return (
      (this.isHorizontal && (!this.start.topEdge || !this.end.bottomEdge)) ||
      (this.isVertical && (!this.start.leftEdge || !this.end.rightEdge))
    );
  }

  Disable(disable: boolean = true) {
    if (this.disabled == disable || this.BoundaryEdge()) return;
    this.disabled = disable;
    if (this.start.ComplexNode()) {
      if (disable) {
        this.start.rightEdge?.Disable(disable);
        this.start.leftEdge?.Disable(disable);
        this.start.topEdge?.Disable(disable);
        this.start.bottomEdge?.Disable(disable);
        this.start.Dissolve();
      } else {
        if (this.isHorizontal) {
          this.start.rightEdge?.Disable(disable);
          this.start.leftEdge?.Disable(disable);
        } else if (this.isVertical) {
          this.start.topEdge?.Disable(disable);
          this.start.bottomEdge?.Disable(disable);
        }
      }
    }
    if (this.end.ComplexNode()) {
      if (disable) {
        this.end.rightEdge?.Disable(disable);
        this.end.leftEdge?.Disable(disable);
        this.end.topEdge?.Disable(disable);
        this.end.bottomEdge?.Disable(disable);
      } else {
        if (this.isHorizontal) {
          this.end.rightEdge?.Disable(disable);
          this.end.leftEdge?.Disable(disable);
        } else if (this.isVertical) {
          this.end.topEdge?.Disable(disable);
          this.end.bottomEdge?.Disable(disable);
        }
      }
    }
  }

  Move(position: Vector) {
    let movement: number = 0;
    if (this.isVertical) {
      movement = position.x;
      if (this.start.rightEdge && position.x > this.x1) {
        const otherEnd = this.start.rightEdge.end;
        if (position.x > otherEnd.x - otherEnd.radius)
          movement = otherEnd.x - otherEnd.radius;
      } else if (this.start.leftEdge && position.x < this.x1) {
        const otherEnd = this.start.leftEdge.start;
        if (position.x < otherEnd.x + otherEnd.radius)
          movement = otherEnd.x + otherEnd.radius;
      }
      if (movement != 0 && this.x1 != movement) {
        this.start.MoveX(movement);
        Renderer.Render();
      }
    } else if (this.isHorizontal) {
      movement = position.y;
      if (this.start.topEdge && position.y < this.y1) {
        const otherEnd = this.start.topEdge.start;
        if (position.y < otherEnd.y + otherEnd.radius)
          movement = otherEnd.y + otherEnd.radius;
      } else if (this.start.bottomEdge && position.y > this.y1) {
        const otherEnd = this.start.bottomEdge.end;
        if (position.y > otherEnd.y - otherEnd.radius)
          movement = otherEnd.y - otherEnd.radius;
      }
      if (movement != 0 && this.y1 != movement) {
        this.start.MoveY(movement);
        Renderer.Render();
      }
    }
  }

  ExtendDuplicate(offset: number = 0) {
    if (this.BoundaryEdge()) {
      const newEdges: Edge[] = [];
      let previousNode: Node | undefined;
      if (this.isHorizontal) {
        if (!this.start.topEdge) {
          if (this.extend_button) this.extend_button = undefined;
          for (
            let node: Node | undefined = this.start;
            node;
            node = node.leftEdge?.start
          ) {
            if (node.leftEdge?.extend_button)
              node.leftEdge.extend_button = undefined;
            const newNode = new Node(
              this.table,
              node.x,
              node.y - node.radius - offset
            );
            let newEdge = this.table.AddLink(node, newNode);
            newEdge.disabled = !!node.bottomEdge?.disabled;
            newEdges.push(newEdge);
            if (previousNode) {
              newEdge = this.table.AddLink(newNode, previousNode);
              newEdges.push(newEdge);
            }
            previousNode = newNode;
          }
          previousNode = (this.start.topEdge as Edge | undefined)?.start;
          for (
            let node: Node | undefined = this.end;
            node;
            node = node.rightEdge?.end
          ) {
            if (node.rightEdge?.extend_button)
              node.rightEdge.extend_button = undefined;
            const newNode = new Node(
              this.table,
              node.x,
              node.y - node.radius - offset
            );
            let newEdge = this.table.AddLink(node, newNode);
            newEdge.disabled = !!node.bottomEdge?.disabled;
            newEdges.push(newEdge);

            if (previousNode) {
              newEdge = this.table.AddLink(newNode, previousNode);
              newEdges.push(newEdge);
            }
            previousNode = newNode;
          }
        }
        if (!this.start.bottomEdge) {
          if (this.extend_button) this.extend_button = undefined;
          for (
            let node: Node | undefined = this.start;
            node;
            node = node.leftEdge?.start
          ) {
            if (node.leftEdge?.extend_button)
              node.leftEdge.extend_button = undefined;
            const newNode = new Node(
              this.table,
              node.x,
              node.y + node.radius + offset
            );
            let newEdge = this.table.AddLink(node, newNode);
            newEdge.disabled = !!node.topEdge?.disabled;
            newEdges.push(newEdge);

            if (previousNode) {
              newEdge = this.table.AddLink(newNode, previousNode);
              newEdges.push(newEdge);
            }
            previousNode = newNode;
          }
          previousNode = (this.start.bottomEdge as Edge | undefined)?.end;
          for (
            let node: Node | undefined = this.end;
            node;
            node = node.rightEdge?.end
          ) {
            if (node.rightEdge?.extend_button)
              node.rightEdge.extend_button = undefined;
            const newNode = new Node(
              this.table,
              node.x,
              node.y + node.radius + offset
            );
            let newEdge = this.table.AddLink(node, newNode);
            newEdge.disabled = !!node.topEdge?.disabled;
            newEdges.push(newEdge);

            if (previousNode) {
              newEdge = this.table.AddLink(newNode, previousNode);
              newEdges.push(newEdge);
            }
            previousNode = newNode;
          }
        }
      } else if (this.isVertical) {
        if (!this.start.leftEdge) {
          if (this.extend_button) this.extend_button = undefined;
          for (
            let node: Node | undefined = this.start;
            node;
            node = node.topEdge?.start
          ) {
            if (node.topEdge?.extend_button)
              node.topEdge.extend_button = undefined;
            const newNode = new Node(
              this.table,
              node.x - node.radius - offset,
              node.y
            );
            let newEdge = this.table.AddLink(node, newNode);
            newEdge.disabled = !!node.rightEdge?.disabled;
            newEdges.push(newEdge);

            if (previousNode) {
              newEdge = this.table.AddLink(newNode, previousNode);
              newEdges.push(newEdge);
            }
            previousNode = newNode;
          }
          previousNode = (this.start.leftEdge as Edge | undefined)?.start;
          for (
            let node: Node | undefined = this.end;
            node;
            node = node.bottomEdge?.end
          ) {
            if (node.bottomEdge?.extend_button)
              node.bottomEdge.extend_button = undefined;
            const newNode = new Node(
              this.table,
              node.x - node.radius - offset,
              node.y
            );
            let newEdge = this.table.AddLink(node, newNode);
            newEdge.disabled = !!node.rightEdge?.disabled;
            newEdges.push(newEdge);

            if (previousNode) {
              newEdge = this.table.AddLink(newNode, previousNode);
              newEdges.push(newEdge);
            }
            previousNode = newNode;
          }
        }
        if (!this.start.rightEdge) {
          if (this.extend_button) this.extend_button = undefined;
          for (
            let node: Node | undefined = this.start;
            node;
            node = node.topEdge?.start
          ) {
            if (node.topEdge?.extend_button)
              node.topEdge.extend_button = undefined;
            const newNode = new Node(
              this.table,
              node.x + node.radius + offset,
              node.y
            );
            let newEdge = this.table.AddLink(node, newNode);
            newEdge.disabled = !!node.leftEdge?.disabled;
            newEdges.push(newEdge);

            if (previousNode) {
              newEdge = this.table.AddLink(newNode, previousNode);
              newEdges.push(newEdge);
            }
            previousNode = newNode;
          }
          previousNode = (this.start.rightEdge as Edge | undefined)?.end;
          for (
            let node: Node | undefined = this.end;
            node;
            node = node.bottomEdge?.end
          ) {
            if (node.bottomEdge?.extend_button)
              node.bottomEdge.extend_button = undefined;
            const newNode = new Node(
              this.table,
              node.x + node.radius + offset,
              node.y
            );
            let newEdge = this.table.AddLink(node, newNode);
            newEdge.disabled = !!node.leftEdge?.disabled;
            newEdges.push(newEdge);

            if (previousNode) {
              newEdge = this.table.AddLink(newNode, previousNode);
              newEdges.push(newEdge);
            }
            previousNode = newNode;
          }
        }
      }
      for (const edge of newEdges) Context.context?.AddObject(edge);
      this.table.CalculateExtents();
    }
  }

  OnMouseButton(
    position: Vector,
    button: string,
    state: 'PRESSED' | 'RELEASED' | 'CLICKED'
  ): boolean {
    if(this.magicAdd){
      this.magicSplit_addBtn?.OnMouseButton(position, button, state);
    }
    if(this.magicRemove){
      this.magicSplit_deleteBtn?.OnMouseButton(position, button, state);
    }
    if(this.magicSplitActive==true)
    {
      return true;
    }
    if (this.selected) {
      this.extend_button?.OnMouseButton(position, button, state);
      this.add_button?.OnMouseButton(position, button, state);
    }
    if (this.focusHorizontal || this.focusVertical)
      this.delete_button?.OnMouseButton(position, button, state);
    if (button === 'center' && state === 'RELEASED') {
      if (this.collider.PointCollision(position)) {
        if (this.disabled) {
          this.Disable(false);
        } else {
          if (this.isVertical)
            this.RecursiveSplit((position.y - this.y1) / (this.y2 - this.y1));
          else if (this.isHorizontal)
            this.RecursiveSplit((position.x - this.x1) / (this.x2 - this.x1));
        }
        Renderer.Render();
        return true;
      }
    } else if (button === 'left' && state === 'PRESSED') {
      if (this.collider.PointCollision(position)) {
        
        Context.context.OnSelectionDispatchers.forEach(tab=>{
          (tab as Table).focus=false;
        })
        this.table.Focus();
        this.isClickHold = true;
        Renderer.Render();
        return true;
      } else if (!Context.CTRLDown()) {
        this.Select(false);
        Renderer.Render();
        return true;
      }
    } else if (state === 'RELEASED') {
      if (this.isClickHold) {
        if(this.table.focus) {
          if (this.isVertical)
            Context.context.element.style('cursor', 'e-resize');
          else if (this.isHorizontal)
            Context.context.element.style('cursor', 'n-resize');
          this.Select(true, position);
        }
        this.isClickHold = false;
        Context.context.element.style('cursor', 'default');
        Renderer.Render();
      }
    }
    return true;
  }

  OnMouseMove(position: Vector, button?: string | undefined): void {
    if (this.selected) {
      this.extend_button?.OnMouseMove(position, button);
      this.add_button?.OnMouseMove(position, button);
      this.magicSplit_addBtn?.OnMouseMove(position, button);
      this.magicSplit_deleteBtn?.OnMouseMove(position, button);
      if (this.delete_button?.shape === 'CROSS')
        this.delete_button?.OnMouseMove(position, button);
    }
    if (
      this.delete_button?.shape === 'SYNC' &&
      (this.focusHorizontal || this.focusVertical)
    )
      this.delete_button?.OnMouseMove(position, button);
    if (this.isClickHold) {
      if(this.table.focus) {
        this.Move(position);
      }
    }
  }

  OnKey(button: string, state: 'PRESSED' | 'RELEASED' | 'TYPED'): void {
    if (this.disabled) return;
    else if (button === 'Delete' && state === 'PRESSED' && this.selected) {
      this.Disable();
      this.start.Dissolve();
      Renderer.Render();
    }
  }

  OnTouch(touches: Touch[], state: 'STARTED' | 'MOVED' | 'ENDED'): boolean {
    if (touches.length === 1) {
      if (this.selected) {
        this.extend_button?.OnTouch(touches, state);
        this.add_button?.OnTouch(touches, state);
        this.magicSplit_addBtn?.OnTouch(touches, state);
        this.magicSplit_deleteBtn?.OnTouch(touches, state);
      }
      if (this.focusHorizontal || this.focusVertical)
        this.delete_button?.OnTouch(touches, state);
      const touchPosition = new Vector(touches[0].x, touches[0].y);
      if (state === 'STARTED') {
        return this.OnMouseButton(touchPosition, 'left', 'PRESSED');
      } else if (state === 'MOVED') {
        this.OnMouseMove(touchPosition, 'left');
      }
    }
    if (state === 'ENDED') {
      this.OnMouseButton(new Vector(), 'left', 'RELEASED');
    }
    return true;
  }

  PreRender(ctx: p5): void {
    this.CalculateBBOX();
    if (this.BoundaryEdge()) {
      if (this.selected) {
        this.CalculateExtendButtonProps();
        this.CalculateAddButtonProps();

        this.CalculateNewAddButtonProps()
        this.CalculateNewDeleteButtonProps()
        this.extend_button?.PreRender(ctx);
        this.add_button?.PreRender(ctx);
        
        this.magicSplit_deleteBtn?.PreRender(ctx)
      }
      if(this.magicAdd){
        this.magicSplit_addBtn?.PreRender(ctx)
      }  
      if(this.magicRemove){
        this.magicSplit_deleteBtn?.PreRender(ctx)
      }
      this.delete_button = undefined;
    } else {
      this.extend_button = undefined;
      this.add_button = undefined;
      this.magicSplit_addBtn = undefined;
      this.magicSplit_deleteBtn = undefined;
      if (this.focusHorizontal || this.focusVertical) {
        this.CalculateDeleteButtonProps();
        this.delete_button?.PreRender(ctx);
      }
    }
  }

  Render(ctx: p5): void {
    if (Context.context.selectionMode) {
      if (
        this.isHorizontal &&
        this.start.bottomEdge &&
        this.selectedCell &&
        this.start.selectedCell
      ) {
        ctx.stroke(0, 0, 0, 0);
        ctx.fill(128, 32, 64, 64);
        ctx.strokeWeight(0);
        ctx.rect(
          this.start.x,
          this.start.y,
          this.length,
          this.start.bottomEdge.length
        );
      }
      if (this.disabled) {
        ctx.stroke(128, 128, 128, 255);
        ctx.drawingContext.setLineDash([5, 5]);
        ctx.strokeWeight(1);
        ctx.line(this.start.x, this.start.y, this.end.x, this.end.y);
        ctx.drawingContext.setLineDash([0, 0]);
      } else {
        ctx.stroke(this.color[0], this.color[1], this.color[2], this.color[3]);
        ctx.strokeWeight(this.edgeWidth);
        ctx.line(this.start.x, this.start.y, this.end.x, this.end.y);
      }
    } else {
      if (this.disabled) {
        if (this.focusHorizontal || this.focusVertical) {
          if (this.selected) ctx.stroke(64, 64, 64, 255);
          else ctx.stroke(128, 128, 128, 255);
          ctx.strokeWeight(1);
          ctx.drawingContext.setLineDash([5, 5]);
          ctx.line(this.start.x, this.start.y, this.end.x, this.end.y);
          ctx.drawingContext.setLineDash([0, 0]);
          this.delete_button?.Render(ctx);
        }
      } else {
        if (this.selected)
          ctx.stroke(
            this.highlightColor[0],
            this.highlightColor[1],
            this.highlightColor[2],
            this.highlightColor[3]
          );
        else
          ctx.stroke(
            this.color[0],
            this.color[1],
            this.color[2],
            this.color[3]
          );
        ctx.strokeWeight(this.edgeWidth);
        ctx.line(this.start.x, this.start.y, this.end.x, this.end.y);
      }
      if(this.magicAdd && (this.end.topEdge==undefined  || this.end.leftEdge==undefined))
      {
        this.magicSplit_addBtn?.Render(ctx);
      }
      if(this.magicRemove && (this.end.topEdge==undefined  || this.end.leftEdge==undefined))
      {
        this.magicSplit_deleteBtn?.Render(ctx);
      }
      if (this.selected) {
        this.add_button?.Render(ctx);
        this.extend_button?.Render(ctx);
        if (!this.disabled) this.delete_button?.Render(ctx);
      }
    }
  }
}
