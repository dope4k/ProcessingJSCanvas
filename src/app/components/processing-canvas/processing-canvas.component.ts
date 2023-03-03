import { Component, OnInit } from '@angular/core';
import Context from '../../logic/Base/Context';
import Table from '../../logic/Components/Table';
import SelectionTool from '../../logic/Tools/SelectionTool';

@Component({
  selector: 'app-processing-canvas',
  templateUrl: './processing-canvas.component.html',
})
export class ProcessingCanvasComponent implements OnInit {
  context?: Context;

  ngOnInit(): void {
    this.context = new Context(800, 800, 'canvas');
    this.context.InitRenderer();

    const table = new Table();
    table.CreateTable(200, 200, 5, 3);
    const selectionTool = new SelectionTool();

    this.context.AddObject(table);
    this.context.AddObject(selectionTool);
  }
}
