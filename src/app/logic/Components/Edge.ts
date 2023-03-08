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

  isClickHold: boolean = false;
  selected: boolean = false;
  selectPositionN?: number;

  disabled: boolean = false;
  isHover: boolean = false;

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

  constructor(
    table: Table,
    nodeA: Node,
    nodeB: Node,
    edgeWidth: number = 3,
    color = [0, 0, 0, 255],
    highlightColor = [128, 128, 128, 255]
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
      this.InitAddButtonPosition();
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

  InitAddButtonPosition() {
    const center = this.center;
    if (this.isHorizontal) {
      this.add_button = new Button(
        'PLUS',
        center.x,
        center.y + (this.start.topEdge ? -10 : 10),
        8
      );
    } else if (this.isVertical) {
      this.add_button = new Button(
        'PLUS',
        center.x + (this.start.leftEdge ? -10 : 10),
        center.y,
        8
      );
    }
    if (this.add_button) {
      this.add_button.OnPress = () => {
        if (this.selectPositionN) this.RecursiveSplit(this.selectPositionN);
      };
    }
  }

  CalculateAddButtonProps() {
    if (this.BoundaryEdge()) {
      if (this.add_button) {
        let position = this.center;
        if (this.selectPositionN) {
          position = Vector.lerp(
            this.start.point,
            this.end.point,
            this.selectPositionN
          );
        }
        if (this.isVertical) {
          this.add_button.position = new Vector(
            position.x + (this.start.leftEdge ? -10 : 10),
            position.y
          );
        } else if (this.isHorizontal) {
          this.add_button.position = new Vector(
            position.x,
            position.y + (this.start.topEdge ? -10 : 10)
          );
        }
      } else {
        this.InitExtendButton();
      }
    } else {
      this.extend_button = undefined;
    }
  }

  CalculateExtendButtonProps() {
    if (this.BoundaryEdge()) {
      if (this.extend_button) {
        const center = this.center;
        if (this.isVertical) {
          this.extend_button.position = new Vector(
            center.x + (this.start.leftEdge ? 10 : -10),
            center.y
          );
          const dir = this.start.leftEdge ? 'RIGHT' : 'LEFT';
          if (this.extend_button.direction != dir) {
            this.extend_button.direction = dir;
            this.extend_button.RecalculateProps();
          }
        } else if (this.isHorizontal) {
          this.extend_button.position = new Vector(
            center.x,
            center.y + (this.start.topEdge ? 10 : -10)
          );
          const dir = this.start.topEdge ? 'DOWN' : 'UP';
          if (this.extend_button.direction != dir) {
            this.extend_button.direction = dir;
            this.extend_button.RecalculateProps();
          }
        }
      } else {
        this.InitExtendButton();
      }
    } else {
      this.extend_button = undefined;
    }
  }

  Bbox(): number[] {
    if (this.isVertical) {
      return [
        this.start.x - this.edgeWidth,
        this.start.y,
        this.end.x + this.edgeWidth,
        this.end.y,
      ];
    } else {
      return [
        this.start.x,
        this.start.y - this.edgeWidth,
        this.end.x,
        this.end.y + this.edgeWidth,
      ];
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
      this.selectPositionN =
        Vector.dist(this.start.point, select_position) /
        Vector.dist(this.start.point, this.end.point);
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
    }
  }

  OnMouseButton(
    position: Vector,
    button: string,
    state: 'PRESSED' | 'RELEASED' | 'CLICKED'
  ): boolean | null {
    if (this.selected) {
      this.extend_button?.OnMouseButton(position, button, state);
      this.add_button?.OnMouseButton(position, button, state);
    }
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
        if (this.isVertical)
          Context.context?.canvas?.style('cursor', 'e-resize');
        else if (this.isHorizontal)
          Context.context?.canvas?.style('cursor', 'n-resize');
        this.Select(true, position);
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
      this.isClickHold = false;
      Context.context?.canvas?.style('cursor', 'default');
      Renderer.Render();
    }
    return null;
  }

  OnMouseMove(position: Vector, button?: string | undefined): void {
    if (this.selected) {
      this.extend_button?.OnMouseMove(position, button);
      this.add_button?.OnMouseMove(position, button);
    }
    if (this.isClickHold) {
      this.Move(position);
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

  OnTouch(
    touches: Touch[],
    state: 'STARTED' | 'MOVED' | 'ENDED'
  ): boolean | null {
    if (touches.length === 1) {
      if (this.selected) {
        this.extend_button?.OnTouch(touches, state);
        this.add_button?.OnTouch(touches, state);
      }
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
    return null;
  }

  PreRender(ctx: p5): void {
    this.CalculateExtendButtonProps();
    this.CalculateAddButtonProps();
  }

  Render(ctx: p5): void {
    if (this.disabled) {
      if (this.start.InFocusNode() || this.end.InFocusNode()) {
        if (this.isClickHold || this.selected) ctx.stroke(64, 64, 64, 255);
        else ctx.stroke(128, 128, 128, 255);
        ctx.strokeWeight(1);
        ctx.drawingContext.setLineDash([5, 5]);
        ctx.line(this.start.x, this.start.y, this.end.x, this.end.y);
        ctx.drawingContext.setLineDash([0, 0]);
      }
      return;
    }
    if (this.isClickHold || this.selected) {
      this.extend_button?.Render(ctx);
      this.add_button?.Render(ctx);
      ctx.stroke(
        this.highlightColor[0],
        this.highlightColor[1],
        this.highlightColor[2],
        this.highlightColor[3]
      );
    } else
      ctx.stroke(this.color[0], this.color[1], this.color[2], this.color[3]);
    ctx.strokeWeight(this.edgeWidth);
    ctx.line(this.start.x, this.start.y, this.end.x, this.end.y);

    if (false) {
      ctx.strokeWeight(1);
      ctx.text(
        this.id.toString(),
        (this.end.x + this.start.x) / 2,
        (this.end.y + this.start.y) / 2
      );
    }
  }
}
