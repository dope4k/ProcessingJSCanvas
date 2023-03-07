import * as p5 from 'p5';
import { Vector } from 'p5';
import SelectionTool from '../Tools/SelectionTool';
import OnKey from './Events/OnKey';
import OnMouseButton from './Events/OnMouseButton';
import OnMouseMove from './Events/OnMouseMove';
import OnMouseWheel from './Events/OnMouseWheel';
import OnTouch, { Touch } from './Events/OnTouch';
import Renderer, { Renderable } from './Renderer';

export interface ContextObject {
  id: number;
  OnContextInit(ctx: Context): void;
}

export default class Context {
  static __context?: Context;
  static __id: number = 0;
  static get context() {
    return Context.__context;
  }
  static get id() {
    return Context.__id++;
  }

  private __canvas?: p5.Renderer;
  get canvas() {
    return this.__canvas;
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

  constructor(width: number, height: number, element_id?: string) {
    Context.__context = this;

    this.width = width;
    this.height = height;
    this.element_id = element_id;
    this.ctx = new p5(this.sketch.bind(this));
    this.selectionTool = new SelectionTool();
    this.Setup();
  }

  private sketch(ctx: p5) {
    ctx.keyPressed = () => this.OnKey(ctx.key, 'PRESSED');
    ctx.keyReleased = () => this.OnKey(ctx.key, 'RELEASED');
    ctx.keyTyped = () => this.OnKey(ctx.key, 'TYPED');

    ctx.mouseMoved = () => this.OnMouseMove(new Vector(ctx.mouseX, ctx.mouseY));
    ctx.mouseDragged = () =>
      this.OnMouseMove(new Vector(ctx.mouseX, ctx.mouseY), ctx.mouseButton);
    ctx.mouseClicked = () =>
      this.OnMouseButton(
        new Vector(ctx.mouseX, ctx.mouseY),
        ctx.mouseButton,
        'CLICKED'
      );
    ctx.mousePressed = () => {
      this.OnMouseButton(
        new Vector(ctx.mouseX, ctx.mouseY),
        ctx.mouseButton,
        'PRESSED'
      );
    };
    ctx.mouseReleased = () =>
      this.OnMouseButton(
        new Vector(ctx.mouseX, ctx.mouseY),
        ctx.mouseButton,
        'RELEASED'
      );
    ctx.mouseWheel = (evt: { delta: number }) =>
      this.OnMouseWheel(new Vector(ctx.mouseX, ctx.mouseY), evt.delta);
    ctx.touchStarted = () => this.OnTouch(ctx.touches as Touch[], 'STARTED');
    ctx.touchMoved = () => this.OnTouch(ctx.touches as Touch[], 'MOVED');
    ctx.touchEnded = () => this.OnTouch(ctx.touches as Touch[], 'ENDED');
    ctx.draw = () => this.Render();
  }

  Setup() {
    this.__canvas = this.ctx.createCanvas(this.width, this.height);
    if (this.element_id) this.canvas?.parent(this.element_id);
    this.__renderer?.AddRenderObject(this.selectionTool);
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

  AddObject(obj: ContextObject) {
    if ('OnMouseMove' in obj) this.BindOnMouseMove(obj as OnMouseMove);
    if ('OnMouseWheel' in obj) this.BindOnMouseWheel(obj as OnMouseWheel);
    if ('OnMouseButton' in obj) this.BindOnMouseButton(obj as OnMouseButton);
    if ('OnTouch' in obj) this.BindOnTouch(obj as OnTouch);
    if ('OnKey' in obj) this.BindOnKey(obj as OnKey);
    if ('Render' in obj)
      this.__renderer?.AddRenderObject(obj as any as Renderable);
    obj.OnContextInit(this);
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
    let check = true;
    const length = this.OnMouseButtonDispatchers.length;
    for (
      let i = 0;
      i < length && i < this.OnMouseButtonDispatchers.length;
      ++i
    ) {
      const ret = this.OnMouseButtonDispatchers[i].OnMouseButton(
        position,
        button,
        state
      );
      if (ret !== null) {
        check = false;
        if (ret === false) break;
      }
    }

    if (check) {
      this.selectionTool.OnMouseButton(position, button, state);
    }
  }
  OnMouseMove(position: Vector, button?: string) {
    const length = this.OnMouseMoveDispatchers.length;
    for (let i = 0; i < length && i < this.OnMouseMoveDispatchers.length; ++i) {
      this.OnMouseMoveDispatchers[i].OnMouseMove(position, button);
    }
    this.selectionTool.OnMouseMove(position, button);
  }
  OnMouseWheel(position: Vector, scroll: number) {
    const length = this.OnMouseWheelDispatchers.length;
    for (
      let i = 0;
      i < length && i < this.OnMouseWheelDispatchers.length;
      ++i
    ) {
      this.OnMouseWheelDispatchers[i].OnMouseWheel(position, scroll);
    }
  }
  OnTouch(touches: Touch[], state: 'STARTED' | 'MOVED' | 'ENDED') {
    let check = true;
    const length = this.OnTouchDispatchers.length;
    for (let i = 0; i < length && i < this.OnTouchDispatchers.length; ++i) {
      const ret = this.OnTouchDispatchers[i].OnTouch(touches, state);
      if (ret !== null) {
        check = false;
        if (ret === false) break;
      }
    }
  }
  OnKey(button: string, state: 'PRESSED' | 'RELEASED' | 'TYPED') {
    const length = this.OnKeyDispatchers.length;
    for (let i = 0; i < length && i < this.OnKeyDispatchers.length; ++i) {
      this.OnKeyDispatchers[i].OnKey(button, state);
    }
  }

  Render() {
    this.__renderer?.Render(this.ctx);
  }
}
