import { Injectable } from '@angular/core';
import Image from 'src/app/logic/Components/Image';
import Context from 'src/app/logic/Base/Context';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import Table from './logic/Components/Table';

@Injectable({
  providedIn: 'root'
})
export class AppServiceService {
 
  context?: Context;
  fileUploaded:boolean=false;
  constructor(private fb: FormBuilder,)
  {
    
    this.newTableForm = this.fb.group(
      {
        name:  ['Table_' + this.globalTableId, [Validators.required]],
        id: [this.globalTableId],
        rows: ['', Validators.required],
        columns: ['', Validators.required] 
      }
    );
  }
  fileAdded(evt: Event) {
    console.log('fr',evt);
    this.fileUploaded=true;
    const files: FileList = (evt.target as any).files;
    const img = document.createElement('img');
    const src = URL.createObjectURL(files[0]);
    img.src = src;
    img.onload = () => {
      this.context = new Context(1000, 800, 'canvas');
      this.context.InitRenderer();
      const image = new Image(src, img.width, img.height);
      this.context?.AddObject(image);
      img.remove();
    };
  }
  removeImage()
  {
    //canvas element from html is already deleted from processing component .ts file
    this.context?.removeAllObjects()
    this.fileUploaded=false;
  }
  var_DisplayTable=false;
  toggle_DisplayTable()
  {
    if(this.var_DisplayTable==false)
    {
      this.var_DisplayTable=true;
      return;
    }
    else this.var_DisplayTable=false;
    return;
  }
  globalTableId=1;
  public newTableForm!: FormGroup;
  createTable()
  {
    console.log(this.newTableForm.value);
    if(this.newTableForm.value.rows<1 || this.newTableForm.value.rows>20 || 
      this.newTableForm.value.columns<1 || this.newTableForm.value.columns>20
      || this.newTableForm.value.name=='')
      {
        console.log('Invalid Table Fields');
        return;
      }
    else
    {
      const table = new Table();
      // table.CreateTable(50, 50, this.newTableForm.value.rows, this.newTableForm.value.columns, 50);
      this.context?.AddObject(table);
    }
  }
}
