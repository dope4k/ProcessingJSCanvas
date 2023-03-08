import * as p5 from 'p5';
import { ContextObject } from './Context';

export interface Renderable {
  zIndex: number;
  Render(ctx: p5): void | Promise<void>;
  PreRender?(ctx: p5): void;
}

export default class Renderer {
  static __renderer: Renderer;
  static get renderer() {
    return Renderer.__renderer;
  }

  static Render() {
    Renderer.renderer.dirty = true;
  }

  render_objects: Renderable[] = [];
  backgroundColor: number[];

  dirty: boolean = true;

  constructor(backgroundColor: number[] = [255, 255, 255, 255]) {
    if (backgroundColor.length === 4) this.backgroundColor = backgroundColor;
    else throw '`backgroundColor` should be an array of length 4';
    this.render_objects = [];
    Renderer.__renderer = this;
  }

  AddRenderObject(renderable: Renderable) {
    this.render_objects.push(renderable);
    this.render_objects.sort((a, b) => a.zIndex - b.zIndex);
  }

  RemoveRenderObject(id: number) {
    this.render_objects = (
      this.render_objects as any as ContextObject[]
    ).filter((o) => o.id !== id) as any as Renderable[];
  }

  Render(ctx: p5) {
    if (this.dirty) {
      ctx.background(255, 255, 255, 255);
      for (const obj of this.render_objects) {
        if (obj.PreRender) obj.PreRender(ctx);
      }
      for (const obj of this.render_objects) {
        obj.Render(ctx);
      }
      this.dirty = false;
    }
  }
}
