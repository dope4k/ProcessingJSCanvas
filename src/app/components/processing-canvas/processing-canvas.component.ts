import { Component, OnInit } from '@angular/core';
import Context from '../../logic/Base/Context';
import Table from '../../logic/Components/Table';

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
    table.CreateTable(150, 150, 3, 3, 200);
    this.context.AddObject(table);
  }
}
