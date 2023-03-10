import * as p5 from 'p5';
import { Vector } from 'p5';
import SelectionTool from '../Tools/SelectionTool';
import OnKey from './Events/OnKey';
import OnMouseButton from './Events/OnMouseButton';
import OnMouseMove from './Events/OnMouseMove';
import OnMouseWheel from './Events/OnMouseWheel';
import OnSelection from './Events/OnSelection';
import OnTouch, { Touch } from './Events/OnTouch';
import Renderer, { Renderable } from './Renderer';

export interface ContextObject {
  id: number;
  OnContextInit?(ctx: Context): void;
}

export default class Context {
  static __context?: Context;
  static __id: number = 0;
  static get context() {
    return Context.__context!;
  }
  static get canvas() {
    return Context.context!.canvas;
  }

  static get id() {
    return Context.__id++;
  }

  private __element?: p5.Renderer;
  get element() {
    return this.__element!;
  }

  get canvas() {
    return this.ctx.drawingContext as CanvasRenderingContext2D;
  }

  private ctx: p5;
  get renderer() {
    return this.ctx;
  }

  private __renderer?: Renderer;

  width: number;
  height: number;

  element_id?: string;

  OnMouseMoveDispatchers: OnMouseMove[] = [];
  OnMouseButtonDispatchers: OnMouseButton[] = [];
  OnMouseWheelDispatchers: OnMouseWheel[] = [];
  OnTouchDispatchers: OnTouch[] = [];
  OnKeyDispatchers: OnKey[] = [];

  selectionTool: SelectionTool;
  OnSelectionDispatchers: OnSelection[] = [];
  selectionMode: boolean = false;

  constructor(width: number, height: number, element_id?: string) {
    Context.__context = this;

    this.width = width;
    this.height = height;
    this.element_id = element_id;
    this.ctx = new p5(this.sketch.bind(this));
    this.selectionTool = new SelectionTool();
    this.Setup();
  }

  static CTRLDown(): boolean {
    return !!Context.context?.renderer.keyIsDown(
      Context.context.renderer.CONTROL
    );
  }

  static ShiftDown(): boolean {
    return !!Context.context?.renderer.keyIsDown(
      Context.context.renderer.SHIFT
    );
  }

  static AltDown(): boolean {
    return !!Context.context?.renderer.keyIsDown(Context.context.renderer.ALT);
  }

  private sketch(ctx: p5) {
    ctx.keyPressed = () => {
      this.OnKey(ctx.key, 'PRESSED');
      return false;
    };
    ctx.keyReleased = () => {
      this.OnKey(ctx.key, 'RELEASED');
      return false;
    };
    ctx.keyTyped = () => {
      this.OnKey(ctx.key, 'TYPED');
      return false;
    };

    ctx.mouseMoved = () => {
      this.OnMouseMove(new Vector(ctx.mouseX, ctx.mouseY));
      return false;
    };
    ctx.mouseDragged = () => {
      this.OnMouseMove(new Vector(ctx.mouseX, ctx.mouseY), ctx.mouseButton);
      return false;
    };
    ctx.mouseClicked = () => {
      this.OnMouseButton(
        new Vector(ctx.mouseX, ctx.mouseY),
        ctx.mouseButton,
        'CLICKED'
      );
      return false;
    };
    ctx.mousePressed = () => {
      {
        this.OnMouseButton(
          new Vector(ctx.mouseX, ctx.mouseY),
          ctx.mouseButton,
          'PRESSED'
        );
        return false;
      }
    };
    ctx.mouseReleased = () => {
      this.OnMouseButton(
        new Vector(ctx.mouseX, ctx.mouseY),
        ctx.mouseButton,
        'RELEASED'
      );
      return false;
    };
    ctx.mouseWheel = (evt: { delta: number }) => {
      this.OnMouseWheel(new Vector(ctx.mouseX, ctx.mouseY), evt.delta);
      return false;
    };
    ctx.touchStarted = () => {
      this.OnTouch(ctx.touches as Touch[], 'STARTED');
      return false;
    };
    ctx.touchMoved = () => {
      this.OnTouch(ctx.touches as Touch[], 'MOVED');
      return false;
    };
    ctx.touchEnded = () => {
      this.OnTouch(ctx.touches as Touch[], 'ENDED');
      return false;
    };
    ctx.draw = () => this.Render();
  }

  Setup() {
    this.__element = this.ctx.createCanvas(this.width, this.height);
    if (this.element_id) this.element?.parent(this.element_id);
    this.__renderer?.AddRenderObject(this.selectionTool);
    this.ctx.frameRate(45);
  }

  BindOnMouseMove(obj: OnMouseMove) {
    this.OnMouseMoveDispatchers.push(obj);
  }
  BindOnMouseWheel(obj: OnMouseWheel) {
    this.OnMouseWheelDispatchers.push(obj);
  }
  BindOnMouseButton(obj: OnMouseButton) {
    this.OnMouseButtonDispatchers.push(obj);
  }
  BindOnTouch(obj: OnTouch) {
    this.OnTouchDispatchers.push(obj);
  }
  BindOnKey(obj: OnKey) {
    this.OnKeyDispatchers.push(obj);
  }
  BindOnSelection(obj: OnSelection) {
    this.OnSelectionDispatchers.push(obj);
  }

  AddObject(obj: ContextObject) {
    if ('OnMouseMove' in obj) this.BindOnMouseMove(obj as OnMouseMove);
    if ('OnMouseWheel' in obj) this.BindOnMouseWheel(obj as OnMouseWheel);
    if ('OnMouseButton' in obj) this.BindOnMouseButton(obj as OnMouseButton);
    if ('OnTouch' in obj) this.BindOnTouch(obj as OnTouch);
    if ('OnKey' in obj) this.BindOnKey(obj as OnKey);
    if ('OnSelection' in obj) this.BindOnSelection(obj as OnSelection);
    if ('Render' in obj)
      this.__renderer?.AddRenderObject(obj as any as Renderable);
    if (obj.OnContextInit) obj.OnContextInit(this);
  }
  RemoveObject(id?: number) {
    if (!id) return;
    this.OnMouseMoveDispatchers = this.OnMouseMoveDispatchers.filter(
      (o) => (o as any as ContextObject).id !== id
    );
    this.OnMouseWheelDispatchers = this.OnMouseWheelDispatchers.filter(
      (o) => (o as any as ContextObject).id !== id
    );
    this.OnMouseButtonDispatchers = this.OnMouseButtonDispatchers.filter(
      (o) => (o as any as ContextObject).id !== id
    );
    this.OnTouchDispatchers = this.OnTouchDispatchers.filter(
      (o) => (o as any as ContextObject).id !== id
    );
    this.OnKeyDispatchers = this.OnKeyDispatchers.filter(
      (o) => (o as any as ContextObject).id !== id
    );
    this.__renderer?.RemoveRenderObject(id);
    Renderer.Render();
  }

  InitRenderer() {
    this.__renderer = new Renderer();
  }

  OnMouseButton(
    position: Vector,
    button: string,
    state: 'PRESSED' | 'RELEASED' | 'CLICKED'
  ) {
    if (!this.selectionMode) {
      const length = this.OnMouseButtonDispatchers.length;
      for (
        let i = 0;
        i < length && i < this.OnMouseButtonDispatchers.length;
        ++i
      ) {
        if (
          !this.OnMouseButtonDispatchers[i].OnMouseButton(
            position,
            button,
            state
          )
        )
          break;
      }
    } else {
      this.selectionTool.OnMouseButton(position, button, state);
    }
  }
  OnMouseMove(position: Vector, button?: string) {
    if (!this.selectionMode) {
      const length = this.OnMouseMoveDispatchers.length;
      for (
        let i = 0;
        i < length && i < this.OnMouseMoveDispatchers.length;
        ++i
      ) {
        this.OnMouseMoveDispatchers[i].OnMouseMove(position, button);
      }
    } else {
      this.selectionTool.OnMouseMove(position, button);
    }
  }
  OnMouseWheel(position: Vector, scroll: number) {
    if (!this.selectionMode) {
      const length = this.OnMouseWheelDispatchers.length;
      for (
        let i = 0;
        i < length && i < this.OnMouseWheelDispatchers.length;
        ++i
      ) {
        this.OnMouseWheelDispatchers[i].OnMouseWheel(position, scroll);
      }
    }
  }
  OnTouch(touches: Touch[], state: 'STARTED' | 'MOVED' | 'ENDED') {
    const length = this.OnTouchDispatchers.length;
    for (let i = 0; i < length && i < this.OnTouchDispatchers.length; ++i) {
      if (!this.OnTouchDispatchers[i].OnTouch(touches, state)) break;
    }
  }
  OnKey(button: string, state: 'PRESSED' | 'RELEASED' | 'TYPED') {
    const length = this.OnKeyDispatchers.length;
    for (let i = 0; i < length && i < this.OnKeyDispatchers.length; ++i) {
      this.OnKeyDispatchers[i].OnKey(button, state);
    }
    if (button === 's' && state === 'PRESSED') {
      if (this.selectionMode) {
        this.selectionMode = false;
        this.OnSelection();
        Renderer.Render();
      } else {
        this.selectionMode = true;
      }
    }
  }

  OnSelection(selectionTool?: SelectionTool) {
    const length = this.OnSelectionDispatchers.length;
    for (let i = 0; i < length && i < this.OnSelectionDispatchers.length; ++i) {
      this.OnSelectionDispatchers[i].OnSelection(selectionTool);
    }
  }

  Render() {
    this.__renderer?.Render(this.ctx);
    this.selectionTool.Render(this.ctx);
  }
}
