import * as p5 from 'p5';
import { Vector } from 'p5';
import SelectionTool from '../Tools/SelectionTool';
import OnKey from './Events/OnKey';
import OnMouseButton from './Events/OnMouseButton';
import OnMouseMove from './Events/OnMouseMove';
import OnMouseWheel from './Events/OnMouseWheel';
import Renderer, { Renderable } from './Renderer';

export interface ContextObject {
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

  renderer?: Renderer;

  width: number;
  height: number;

  element_id?: string;

  OnMouseMoveDispatchers: OnMouseMove[] = [];
  OnMouseButtonDispatchers: OnMouseButton[] = [];
  OnMouseWheelDispatchers: OnMouseWheel[] = [];
  OnKeyDispatchers: OnKey[] = [];

  selectionTool: SelectionTool;

  constructor(width: number, height: number, element_id?: string) {
    Context.__context = this;

    this.width = width;
    this.height = height;
    this.element_id = element_id;
    this.ctx = new p5(this.sketch.bind(this));
    this.selectionTool = new SelectionTool();
  }

  private sketch(ctx: p5) {
    ctx.setup = () => this.Setup();

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
    ctx.mouseWheel = () =>
      this.OnMouseWheel(new Vector(ctx.mouseX, ctx.mouseY));
    ctx.draw = () => this.Render();
  }

  Setup() {
    this.__canvas = this.ctx.createCanvas(this.width, this.height);
    if (this.element_id) this.canvas?.parent(this.element_id);
    this.renderer?.AddRenderObject(this.selectionTool);
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
  BindOnKey(obj: OnKey) {
    this.OnKeyDispatchers.push(obj);
  }

  AddObject(obj: ContextObject) {
    if ('OnMouseMove' in obj) this.BindOnMouseMove(obj as OnMouseMove);
    if ('OnMouseWheel' in obj) this.BindOnMouseWheel(obj as OnMouseWheel);
    if ('OnMouseButton' in obj) this.BindOnMouseButton(obj as OnMouseButton);
    if ('OnKey' in obj) this.BindOnKey(obj as OnKey);
    if ('Render' in obj) this.renderer?.AddRenderObject(obj as Renderable);
    obj.OnContextInit(this);
  }

  InitRenderer() {
    this.renderer = new Renderer();
  }

  OnMouseButton(
    position: Vector,
    button: string,
    state: 'PRESSED' | 'RELEASED' | 'CLICKED'
  ) {
    let check = true;
    for (const dispatcher of this.OnMouseButtonDispatchers)
      check = dispatcher.OnMouseButton(position, button, state) && check;

    if (check) {
      this.selectionTool.OnMouseButton(position, button, state);
    }
  }
  OnMouseMove(position: Vector, button?: string) {
    for (const dispatcher of this.OnMouseMoveDispatchers) {
      dispatcher.OnMouseMove(position, button);
    }
    this.selectionTool.OnMouseMove(position, button);
  }
  OnMouseWheel(scroll: Vector) {
    for (const dispatcher of this.OnMouseWheelDispatchers)
      dispatcher.OnMouseWheel(scroll);
  }
  OnKey(button: string, state: 'PRESSED' | 'RELEASED' | 'TYPED') {
    for (const dispatcher of this.OnKeyDispatchers)
      dispatcher.OnKey(button, state);
  }

  Render() {
    this.renderer?.Render(this.ctx);
  }
}
