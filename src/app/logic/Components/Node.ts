import * as p5 from 'p5';
import { Vector } from 'p5';
import Collider, { Collidable } from '../Base/Collider';
import Context, { ContextObject } from '../Base/Context';
import OnMouseButton from '../Base/Events/OnMouseButton';
import OnMouseMove from '../Base/Events/OnMouseMove';
import OnTouch, { Touch } from '../Base/Events/OnTouch';
import { Renderable } from '../Base/Renderer';
import Button from './Button';
import Edge from './Edge';
import Table from './Table';

export default class Node
  implements
    ContextObject,
    Renderable,
    Collidable,
    OnMouseButton,
    OnMouseMove,
    OnTouch
{
  zIndex: number = 0;

  id: number;

  point: Vector;
  radius: number;

  topEdge?: Edge = undefined;
  bottomEdge?: Edge = undefined;
  rightEdge?: Edge = undefined;
  leftEdge?: Edge = undefined;

  bbox: number[] = [0, 0, 0, 0];
  collider: Collider;

  merge_all_button?: Button;

  focusHorizontal: boolean = false;
  focusVertical: boolean = false;

  selectionID: number = -1;
  selectedCell: boolean = false;
  previousSelectionState: boolean = false;

  table: Table;

  get x() {
    return this.point.x;
  }
  get y() {
    return this.point.y;
  }
  set x(val: number) {
    this.point.x = val;
  }
  set y(val: number) {
    this.point.y = val;
  }

  constructor(table: Table, x: number, y: number, radius: number = 5) {
    this.point = new Vector(x, y);
    this.table = table;
    this.radius = radius;

    this.id = Context.id;
    this.collider = new Collider(this);
  }

  OnContextInit?(ctx: Context): void {
    this.InitMergeAllButton();
  }

  InitMergeAllButton() {
    if (
      this.merge_all_button ||
      this.BoundaryNode() ||
      !this.bottomEdge ||
      !this.rightEdge
    )
      return;
    if (!this.topEdge) {
      this.merge_all_button = new Button('CROSS', this.x, this.y - 10, 8, 'UP');
    } else if (!this.leftEdge) {
      this.merge_all_button = new Button(
        'CROSS',
        this.x - 10,
        this.y,
        8,
        'LEFT'
      );
    }
    if (this.merge_all_button) {
      this.merge_all_button.OnPress = () => {
        if (!this.topEdge) {
          for (
            let node: Node | undefined = this;
            node;
            node = node.bottomEdge?.end
          ) {
            if (this.merge_all_button?.shape === 'CROSS') {
              node.bottomEdge?.Disable();
              node.Dissolve();
            } else if (this.merge_all_button?.shape === 'SYNC') {
              node.bottomEdge?.Disable(false);
            }
          }
        } else if (!this.leftEdge) {
          for (
            let node: Node | undefined = this;
            node;
            node = node.rightEdge?.end
          ) {
            if (this.merge_all_button?.shape === 'CROSS') {
              node.rightEdge?.Disable();
              node.Dissolve();
            } else if (this.merge_all_button?.shape === 'SYNC') {
              node.rightEdge?.Disable(false);
            }
          }
        }
      };
    }
  }

  CalculateMergeAllButtonProps() {
    if (this.merge_all_button) {
      if (!this.topEdge) {
        this.merge_all_button.position.x = this.x;
        this.merge_all_button.position.y = this.y - 10;
        for (
          let node: Node | undefined = this;
          node;
          node = node.bottomEdge?.end
        ) {
          if (node.bottomEdge?.selected) {
            if (
              node.bottomEdge.disabled &&
              this.merge_all_button.shape !== 'SYNC'
            ) {
              this.merge_all_button.shape = 'SYNC';
              this.merge_all_button.RecalculateProps();
            } else if (
              !node.bottomEdge.disabled &&
              this.merge_all_button.shape !== 'CROSS'
            ) {
              this.merge_all_button.shape = 'CROSS';
              this.merge_all_button.RecalculateProps();
            }
            break;
          }
        }
      } else if (!this.leftEdge) {
        this.merge_all_button.position.x = this.x - 10;
        this.merge_all_button.position.y = this.y;
        for (
          let node: Node | undefined = this;
          node;
          node = node.rightEdge?.end
        ) {
          if (node.rightEdge?.selected) {
            if (
              node.rightEdge.disabled &&
              this.merge_all_button.shape !== 'SYNC'
            ) {
              this.merge_all_button.shape = 'SYNC';
              this.merge_all_button.RecalculateProps();
            } else if (
              !node.rightEdge.disabled &&
              this.merge_all_button.shape !== 'CROSS'
            ) {
              this.merge_all_button.shape = 'CROSS';
              this.merge_all_button.RecalculateProps();
            }
            break;
          }
        }
      } else {
        this.merge_all_button = undefined;
      }
    } else {
      this.InitMergeAllButton();
    }
  }

  GetCell(): Node[] | null {
    let startNode: Node | undefined = this;
    let endNode: Node | undefined = this.bottomEdge?.end.rightEdge?.end;
    while (startNode?.rightEdge?.disabled === true) {
      startNode = startNode?.topEdge?.start;
    }
    while (startNode?.bottomEdge?.disabled === true) {
      startNode = startNode?.leftEdge?.start;
    }
    while (endNode?.topEdge?.disabled === true) {
      endNode = endNode?.rightEdge?.end;
    }
    while (endNode?.leftEdge?.disabled === true) {
      endNode = endNode?.bottomEdge?.end;
    }
    if (startNode && endNode) return [startNode, endNode];
    return null;
  }

  SelectCell(select: boolean = true, selectionID: number) {
    if (select && this.selectionID !== selectionID) {
      this.previousSelectionState = this.selectedCell;
      this.selectedCell = !this.selectedCell;
      this.selectionID = selectionID;
    } else if (!select && this.selectionID === selectionID) {
      this.selectedCell = this.previousSelectionState;
      this.selectionID = -1;
    }
    if (this.bottomEdge?.end.rightEdge?.disabled) {
      this.bottomEdge.end.SelectCell(select, selectionID);
    }
    if (this.rightEdge?.end.bottomEdge?.disabled)
      this.rightEdge.end.SelectCell(select, selectionID);
  }

  CalculateBbox() {
    this.bbox[0] = this.x - this.radius;
    this.bbox[1] = this.y - this.radius;
    this.bbox[2] = this.x + this.radius;
    this.bbox[3] = this.y + this.radius;
  }

  AddEdge(edge: Edge) {
    if (edge.isVertical) {
      if (edge.start.Equal(this)) {
        if (this.x < edge.end.x) {
          this.rightEdge = edge;
        } else if (this.x > edge.end.x) {
          this.leftEdge = edge;
        }
      } else {
        if (this.x < edge.start.x) {
          this.rightEdge = edge;
        } else if (this.x > edge.start.x) {
          this.leftEdge = edge;
        }
      }
    } else if (edge.isHorizontal) {
      if (edge.start.Equal(this)) {
        if (this.y < edge.end.y) {
          this.topEdge = edge;
        } else if (this.y > edge.end.y) {
          this.bottomEdge = edge;
        }
      } else {
        if (this.y < edge.start.y) {
          this.topEdge = edge;
        } else if (this.y > edge.start.y) {
          this.bottomEdge = edge;
        }
      }
    }
  }

  Equal(rhs: Node) {
    return this.x === rhs.x && this.y === rhs.y;
  }

  MoveX(x: number) {
    this.x = x;
    for (
      let currentEdge = this.topEdge;
      !!currentEdge;
      currentEdge = currentEdge?.start.topEdge
    ) {
      currentEdge.x1 = currentEdge.x2 = x;
    }
    for (
      let currentEdge = this.bottomEdge;
      !!currentEdge;
      currentEdge = currentEdge?.end.bottomEdge
    ) {
      currentEdge.x1 = currentEdge.x2 = x;
    }
  }
  MoveY(y: number) {
    this.y = y;
    for (
      let currentEdge = this.leftEdge;
      !!currentEdge;
      currentEdge = currentEdge?.start.leftEdge
    ) {
      currentEdge.y1 = currentEdge.y2 = y;
    }
    for (
      let currentEdge = this.rightEdge;
      !!currentEdge;
      currentEdge = currentEdge?.end.rightEdge
    ) {
      currentEdge.y1 = currentEdge.y2 = y;
    }
  }

  InFocusNode() {
    return (
      this.topEdge?.selected ||
      this.bottomEdge?.selected ||
      this.rightEdge?.selected ||
      this.leftEdge?.selected
    );
  }
  ComplexNode() {
    if (this.topEdge?.disabled && this.leftEdge?.disabled) return true;
    else if (this.topEdge?.disabled && this.rightEdge?.disabled) return true;
    else if (this.bottomEdge?.disabled && this.leftEdge?.disabled) return true;
    else if (this.bottomEdge?.disabled && this.rightEdge?.disabled) return true;
    return false;
  }
  BoundaryNode() {
    let count = 0;
    if (!this.topEdge) ++count;
    if (!this.bottomEdge) ++count;
    if (!this.leftEdge) ++count;
    if (!this.rightEdge) ++count;
    return count >= 2;
  }

  IsFocusVertical() {
    for (let node: Node | undefined = this; node; node = node.topEdge?.start) {
      if (node.topEdge?.selected) return true;
    }
    for (let node: Node | undefined = this; node; node = node.bottomEdge?.end) {
      if (node.bottomEdge?.selected) return true;
    }
    return false;
  }
  IsFocusHorizontal() {
    for (let node: Node | undefined = this; node; node = node.leftEdge?.start) {
      if (node.leftEdge?.selected) return true;
    }
    for (let node: Node | undefined = this; node; node = node.rightEdge?.end) {
      if (node.rightEdge?.selected) return true;
    }
    return false;
  }

  IsDissolvableHorizontal() {
    let check = true;
    if (this.rightEdge?.disabled && this.leftEdge?.disabled) {
      for (
        let edge: Node | undefined = this.leftEdge?.start;
        edge !== undefined && check;
        edge = edge.leftEdge?.start
      ) {
        check = !(
          edge.rightEdge?.disabled === false ||
          edge.leftEdge?.disabled === false
        );
      }
      for (
        let edge: Node | undefined = this.rightEdge?.end;
        edge !== undefined && check;
        edge = edge.rightEdge?.end
      ) {
        check = !(
          edge.rightEdge?.disabled === false ||
          edge.leftEdge?.disabled === false
        );
      }
    } else return false;
    return check;
  }
  IsDissolvableVertical() {
    let check = true;
    if (this.topEdge?.disabled && this.bottomEdge?.disabled) {
      for (
        let edge: Node | undefined = this.topEdge?.start;
        edge !== undefined && check;
        edge = edge.topEdge?.start
      ) {
        check = !(
          edge.topEdge?.disabled === false ||
          edge.bottomEdge?.disabled === false
        );
      }
      for (
        let edge: Node | undefined = this.bottomEdge?.end;
        edge !== undefined && check;
        edge = edge.bottomEdge?.end
      ) {
        check = !(
          edge.topEdge?.disabled === false ||
          edge.bottomEdge?.disabled === false
        );
      }
    } else return false;
    return check;
  }
  DissolveVertical() {
    if (
      (this.topEdge === undefined || this.topEdge?.disabled) &&
      (this.bottomEdge === undefined || this.bottomEdge?.disabled)
    ) {
      if (this.leftEdge && this.rightEdge) {
        this.leftEdge.end = this.rightEdge.end;
        this.rightEdge.end.leftEdge = this.leftEdge;
        Context.context?.RemoveObject(this.rightEdge.id);
        this.table.RemoveEdge(this.rightEdge);
        if (this.topEdge) {
          Context.context?.RemoveObject(this.topEdge.id);
          this.table.RemoveEdge(this.topEdge);
        }
        if (this.bottomEdge) {
          Context.context?.RemoveObject(this.bottomEdge.id);
          this.table.RemoveEdge(this.bottomEdge);
        }

        this.leftEdge = this.rightEdge = undefined;
        this.topEdge?.start.DissolveVertical();
        this.bottomEdge?.end.DissolveVertical();
        this.table.RemoveNode(this);
      }
    }
  }
  DissolveHorizontal() {
    if (
      (this.rightEdge === undefined || this.rightEdge?.disabled) &&
      (this.leftEdge === undefined || this.leftEdge?.disabled)
    ) {
      if (this.topEdge && this.bottomEdge) {
        this.topEdge.end = this.bottomEdge.end;
        this.bottomEdge.end.topEdge = this.topEdge;
        Context.context?.RemoveObject(this.bottomEdge.id);
        this.table.RemoveEdge(this.bottomEdge);
        if (this.rightEdge) {
          Context.context?.RemoveObject(this.rightEdge.id);
          this.table.RemoveEdge(this.rightEdge);
        }
        if (this.leftEdge) {
          Context.context?.RemoveObject(this.leftEdge.id);
          this.table.RemoveEdge(this.leftEdge);
        }
        this.topEdge = this.bottomEdge = undefined;
        this.leftEdge?.start.DissolveHorizontal();
        this.rightEdge?.end.DissolveHorizontal();
        this.table.RemoveNode(this);
      }
    }
  }
  Dissolve() {
    if (this.IsDissolvableHorizontal()) {
      this.DissolveHorizontal();
    } else if (this.IsDissolvableVertical()) {
      this.DissolveVertical();
    }
  }

  MergeCells() {
    if (this.selectedCell && this.rightEdge?.end.selectedCell) {
      const mergeEdge = this.rightEdge.end.bottomEdge;
      mergeEdge?.Disable();
      mergeEdge?.start.Dissolve();
    }
    if (this.selectedCell && this.bottomEdge?.end.selectedCell) {
      const mergeEdge = this.bottomEdge.end.rightEdge;
      mergeEdge?.Disable();
      mergeEdge?.start.Dissolve();
    }
  }
  UnMergeCells() {
    if (this.selectedCell && this.rightEdge?.end.selectedCell) {
      const mergeEdge = this.rightEdge.end.bottomEdge;
      mergeEdge?.Disable(false);
    }
    if (this.selectedCell && this.bottomEdge?.end.selectedCell) {
      const mergeEdge = this.bottomEdge.end.rightEdge;
      mergeEdge?.Disable(false);
    }
  }

  OnMouseButton(
    position: p5.Vector,
    button: string,
    state: 'PRESSED' | 'RELEASED' | 'CLICKED'
  ): boolean {
    if (
      (this.focusHorizontal && (!this.leftEdge || !this.rightEdge)) ||
      (this.focusVertical && (!this.topEdge || !this.bottomEdge))
    ) {
      const check = this.merge_all_button?.OnMouseButton(
        position,
        button,
        state
      );
      if (check !== undefined) return check;
    }
    return true;
  }

  OnMouseMove(position: p5.Vector, button?: string | undefined): void {
    if (
      (this.focusHorizontal && (!this.leftEdge || !this.rightEdge)) ||
      (this.focusVertical && (!this.topEdge || !this.bottomEdge))
    )
      this.merge_all_button?.OnMouseMove(position, button);
  }

  OnTouch(touches: Touch[], state: 'STARTED' | 'MOVED' | 'ENDED'): boolean {
    if (
      (this.focusHorizontal && (!this.leftEdge || !this.rightEdge)) ||
      (this.focusVertical && (!this.topEdge || !this.bottomEdge))
    ) {
      const check = this.merge_all_button?.OnTouch(touches, state);
      if (check !== undefined) return check;
    }
    return true;
  }

  PreRender(ctx: p5): void {
    this.CalculateBbox();
    this.focusHorizontal = this.IsFocusHorizontal();
    this.focusVertical = this.IsFocusVertical();
    if (
      (this.focusHorizontal && (!this.leftEdge || !this.rightEdge)) ||
      (this.focusVertical && (!this.topEdge || !this.bottomEdge))
    ) {
      this.CalculateMergeAllButtonProps();
      this.merge_all_button?.PreRender(ctx);
    }
  }

  Render(ctx: p5): void {
    if (
      (this.focusHorizontal && (!this.leftEdge || !this.rightEdge)) ||
      (this.focusVertical && (!this.topEdge || !this.bottomEdge))
    )
      this.merge_all_button?.Render(ctx);
  }
}
