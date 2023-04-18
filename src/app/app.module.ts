import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ProcessingCanvasComponent } from './components/processing-canvas/processing-canvas.component';
import { LeftPanelComponent } from './components/left-panel/left-panel.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@NgModule({
  declarations: [AppComponent, ProcessingCanvasComponent, LeftPanelComponent],
  imports: [BrowserModule,
    ReactiveFormsModule,
    FormsModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
