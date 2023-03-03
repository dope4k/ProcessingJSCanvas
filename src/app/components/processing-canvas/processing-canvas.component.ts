import { Component, OnInit } from '@angular/core';
import * as p5 from 'p5';
import { Vector } from 'p5';
import Context from 'src/app/logic/Base/Context';
import Edge from 'src/app/logic/Components/Edge';
import Node from 'src/app/logic/Components/Node';
import Table from 'src/app/logic/Components/Table';
import SelectionTool from 'src/app/logic/Tools/SelectionTool';

@Component({
  selector: 'app-processing-canvas',
  templateUrl: './processing-canvas.component.html',
  styleUrls: ['./processing-canvas.component.scss'],
})
export class ProcessingCanvasComponent implements OnInit {
  canvas?: p5;
  table?: Table;

  singleSelection?: boolean;

  selectionBoxStart?: Vector;
  selectionBoxEnd?: Vector;
  context?: Context;

  ngOnInit(): void {
    // this.canvas = new p5((p: p5) => {
    //   p.setup = () => this.InitP5(p);
    //   p.draw = () => this.Draw(p);
    //   p.mousePressed = () => this.onMousePressed(p);
    //   p.mouseDragged = () => this.onMouseDragged(p);
    //   p.mouseReleased = () => this.onMouseReleased(p);
    //   p.keyPressed = () => this.onKeyPress(p);
    // });

    this.context = new Context(800, 800, 'sketch-holder');
    this.context.InitRenderer();

    const table = new Table();
    table.CreateTable(200, 200, 5, 3);

    this.context.AddObject(table);

    const selectionTool = new SelectionTool();
    this.context.AddObject(selectionTool);
  }

  InitP5(p: p5): void {
    const canvas = p.createCanvas(800, 800);
    canvas.parent('sketch-holder');

    p.background(255);
  }

  onMousePressed(ctx: p5) {
    // this.singleSelection = this.table?.onMousePressed(ctx);
    // if (!this.singleSelection) {
    //   this.selectionBoxStart = new Vector(ctx.mouseX, ctx.mouseY);
    // }
  }
  onMouseDragged(ctx: p5) {
    // this.table?.onMouseDragged(ctx);
    // if (this.selectionBoxStart) {
    //   this.selectionBoxEnd = new Vector(ctx.mouseX, ctx.mouseY);
    // }
  }
  onMouseReleased(ctx: p5) {
    // this.table?.onMouseReleased(ctx);
    // if (this.selectionBoxStart && this.selectionBoxEnd) {
    //   const selectionCount = this.table?.SelectEdges(
    //     this.selectionBoxStart,
    //     this.selectionBoxEnd
    //   );
    //   if (selectionCount == 0) this.table?.ClearSelection();
    // } else if (!this.singleSelection) {
    //   this.table?.ClearSelection();
    // }
    // this.selectionBoxStart = undefined;
    // this.selectionBoxEnd = undefined;
  }
  onKeyPress(ctx: p5) {
    // this.table?.onKeyPress(ctx);
  }

  Draw(ctx: p5): void {
    // ctx.background(255);
    // this.table?.Draw(ctx);
    // if (this.selectionBoxStart && this.selectionBoxEnd) {
    //   ctx.strokeWeight(2);
    //   ctx.fill(0, 0, 0, 0);
    //   ctx.rect(
    //     this.selectionBoxStart.x,
    //     this.selectionBoxStart.y,
    //     this.selectionBoxEnd.x - this.selectionBoxStart.x,
    //     this.selectionBoxEnd.y - this.selectionBoxStart.y
    //   );
    // }
  }
}
