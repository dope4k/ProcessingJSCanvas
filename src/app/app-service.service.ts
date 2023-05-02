import { Injectable } from '@angular/core';
import Image from 'src/app/logic/Components/Image';
import Context from 'src/app/logic/Base/Context';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Table from './logic/Components/Table';
import Cell from './logic/Components/Cell';
import { ApiService } from './api.service';
@Injectable({
  providedIn: 'root'
})
export class AppServiceService {
  context?: Context;
  fileUploaded: boolean = false;
  BASE64_MARKER = ';base64,';
  var_DisplayTable = false;
  globalTableId = 1;
  public newTableForm!: FormGroup;
  constructor(private fb: FormBuilder, public apiService: ApiService) {
    //table form for create new table
    this.newTableForm = this.fb.group(
      {
        name: ['Table_' + this.globalTableId, [Validators.required]],
        id: [this.globalTableId],
        rows: [1, Validators.required],
        columns: [1, Validators.required]
      }
    );
  }
  fileToSend: Object | undefined
  //gives the less value 
  limitOption(option: number, limit: number) {
    if (option > limit) return limit;
    else return option;
  }
  //file upload functions
  fileAdded(evt: Event) {
    console.log('fr', evt);
    this.fileUploaded = true;
    const files: FileList = (evt.target as any).files;
    this.fileToSend = files[0];
    const img = document.createElement('img');
    const src = URL.createObjectURL(files[0]);
    img.src = src;
    img.onload = () => {
      this.context = new Context(this.limitOption(img.width, 1000), this.limitOption(img.height, 800), 'canvas');
      this.context.InitRenderer();
      const image = new Image(src, img.width, img.height);
      this.context?.AddObject(image);
      img.remove();
    };
  }
  //file upload functions
  b64toBlob(dataURI: any) {
    return new Blob([this._base64ToArrayBuffer(dataURI)], {
      type: "image/png"
    });
  }
  //file upload functions
  _base64ToArrayBuffer(base64: string) {
    var base64Index = base64.indexOf(this.BASE64_MARKER) + this.BASE64_MARKER.length;
    var base64 = base64.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));
    for (let i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  }
  //remove image
  removeImage() {
    //canvas element from html is already deleted from processing component .ts file
    this.context?.removeAllObjects()
    this.fileUploaded = false;
  }
  //toggle display table function
  toggle_DisplayTable() {
    if (this.var_DisplayTable == false) {
      this.var_DisplayTable = true;
      return;
    }
    else this.var_DisplayTable = false;
    return;
  }
  //create table function
  createTable() {
    if (this.newTableForm.value.rows < 1 || this.newTableForm.value.rows > 20 ||
      this.newTableForm.value.columns < 1 || this.newTableForm.value.columns > 20
      || this.newTableForm.value.name == '') {
      console.log('Invalid Table Fields');
      return;
    }
    else {
      const table = new Table();
      table.CreateTable(50, 50, this.newTableForm.value.rows, this.newTableForm.value.columns, 50);
      this.context?.AddObject(table);
    }
  }
  //returns current zoom of canvas
  getZoom() {
    console.log(Context.context);
  }
  //are both numbers in range from 2 to -2
  isCloseNumbers(a: number, b: number) {
    if (a - b >= -2 && a - b <= 2) {
      return true;
    }
    return false;

  }
  //are both cells in range of 0 to -2
  isCloseCells(a: Cell, b: Cell) {
    if ((a.y + a.height) - (b.y) == -1 || (a.y + a.height) - (b.y) == -2) {
      b.y = a.y + a.height;
      return b;
    }
    else return b;
  }
  //sort cells wrt row
  cellsSortWRTRow(cells: Cell[]) {
    cells.sort((a, b) => {
      if (a.y !== b.y) {
        return a.y - b.y;
      } else {
        return a.x - b.x;
      }
    });
    return cells;
  }
  //sort coordinates array in ascending order
  sortCords(cords: number[]) {
    cords.sort((a, b) => {
      return a - b;
    })
    return cords;
  }
  //sort cells wrt coluumn
  cellsSortWRTCol(cells: Cell[]) {
    cells.sort((a, b) => {
      if (a.x !== b.x) {
        return a.x - b.x;
      } else {
        return a.y - b.y;
      }
    });
    return cells;
  }
  //returns current scale ratio
  getScaleRatio() {
    let origImageWidth = Context.context?.__renderer?.render_objects[0];
    origImageWidth = (origImageWidth as any).width;
    let origImageHeight = Context.context?.__renderer?.render_objects[0];
    origImageHeight = (origImageHeight as any).height;
    let canvasWidth = Context.context?.width;
    let canvasHeight = Context.context?.height;
    return  Math.min(
      canvasHeight / (origImageHeight as any),
      canvasWidth / (origImageWidth as any),
    )
  }
  //transform response cells to correct format
  transformIncomingCellsToCellObjArray(allCells: any[], scaleRatio: number) {
    let cells: Cell[] = [];
    for (let x = 0; x < allCells.length; x++) {
      let cell = new Cell(allCells[x].row, 1, allCells[x].id, allCells[x].rows,
        1, Math.round(allCells[x]['x-cord'] * scaleRatio), Math.round(allCells[x]['y-cord'] * scaleRatio), Math.round(allCells[x].height * scaleRatio),
        Math.round(allCells[x].width * scaleRatio))
      cells.push(cell);
    }
    return cells;
  }
  //finds max id in cells
  findMaxId(cells: Cell[], maxId: number) {
    for (let x = 0; x < cells.length; x++) {
      if (x != 0) {
        cells[x] = this.isCloseCells(cells[x - 1], cells[x])
      }
      if (cells[x].id > maxId) maxId = cells[x].id;
    }
    return maxId;
  }
  //adds 1x1 new cells to array
  addNew1x1Cells(cells: Cell[], xCordsCells: number[], yCordsCells: number[], maxId: number) {
    for (let x = 0; x < xCordsCells.length - 1; x++) {
      let check1 = false;
      for (let y = 0; y < yCordsCells.length - 1; y++) {
        for (let z = 0; z < cells.length; z++) {
          if (cells[z].x == xCordsCells[x] && cells[z].y == yCordsCells[y]) {
            check1 = true;
            break;
          }
        }
        if (check1 == false) {
          //add new cell here to cells Array
          let cell = new Cell(1, 1, maxId, 1, 1, xCordsCells[x], yCordsCells[y],
            yCordsCells[y + 1] - yCordsCells[y], xCordsCells[x + 1] - xCordsCells[x]);
          cell.isNewCell = true;
          cells.push(cell)
        }
        check1 = false;
      }
    }
    return cells;
  }
  //fixes height and width of cells which are within range
  fixCellsHeightWidth(cells: Cell[]) {
    cells = this.cellsSortWRTCol(cells)
    //fix height of cells 
    for (let x = 0; x < cells.length - 1; x++) {
      if (cells[x].x == cells[x + 1].x) {
        cells[x].height = cells[x + 1].y - cells[x].y
      }
    }

    cells = this.cellsSortWRTRow(cells)
    for (let x = 0; x < cells.length - 1; x++) {
      if (cells[x].y == cells[x + 1].y) {
        cells[x].width = cells[x + 1].x - cells[x].x
      }
    }
    return cells;
  }

  //auto table creation
  autoTableCreation() {
    this.apiService.autoTableDetection(this.fileToSend).subscribe(data => {
      let allCells = (data as any).cells;
      let allXCords = (data as any).xCords;
      let allYCords = (data as any).yCords;
      //function to get cells from backend and convert them to frontend cells
      var { cells, firstX, firstY, lastX, lastY, xCordsCells, yCordsCells }: 
      { cells: Cell[]; firstX: number; firstY: number; lastX: number; lastY: number; xCordsCells: number[]; yCordsCells: number[]; }
       = this.backendCellsToFrontendCells(allCells, allXCords, allYCords);
      //create a table and send those cells
      let table = new Table()
      table.autoTableCreation(cells, Math.round(firstX), Math.round(firstY), Math.round(lastX), Math.round(lastY)
        , xCordsCells, yCordsCells)
      Context.context?.AddObject(table)
    })
  }

  private backendCellsToFrontendCells(allCells: any, allXCords: any, allYCords: any) {
    let cells: Cell[] = [];

    //find scaleRatio
    let scaleRatio = this.getScaleRatio();
    //find maxId 
    let maxId = this.findMaxId(cells, 0);
    // push incoming cells to Cell Format array
    cells = this.transformIncomingCellsToCellObjArray(allCells, scaleRatio);
    //first 2 coordinates to send in function to detect top and left
    const firstX = allXCords[0] * scaleRatio;
    const firstY = allYCords[0] * scaleRatio;
    //add a check here for out of index
    const lastX = allXCords[allXCords.length - 2] * scaleRatio;
    const lastY = allYCords[allYCords.length - 2] * scaleRatio;
    //--code for missing cells--
    let xCordsCells: number[] = [];
    let yCordsCells: number[] = [];
    //get new xCords & yCords from cells made
    for (let x in cells) {
      if (!xCordsCells.includes(cells[x].x)) {
        xCordsCells.push(cells[x].x);
      }
      if (!yCordsCells.includes(cells[x].y)) {
        yCordsCells.push(cells[x].y);
      }
    }
    xCordsCells = this.sortCords(xCordsCells);
    yCordsCells = this.sortCords(yCordsCells);
    //add last cell width and height
    for (let x = 0; x < cells.length; x++) {
      if (cells[x].x == xCordsCells[xCordsCells.length - 1]) {
        if (!xCordsCells.includes(cells[x].x + cells[x].width))
          xCordsCells.push(cells[x].x + cells[x].width);
      }
      if (cells[x].y == yCordsCells[yCordsCells.length - 1]) {
        if (!yCordsCells.includes(cells[x].y + cells[x].height))
          yCordsCells.push(cells[x].y + cells[x].height);
      }
    }
    // check if a cell exists on the (x,y) from coordinates
    // if not add a cell to the array
    cells = this.addNew1x1Cells(cells, xCordsCells, yCordsCells, maxId);
    //fix cells height width if necessary
    cells = this.fixCellsHeightWidth(cells);
    return { cells, firstX, firstY, lastX, lastY, xCordsCells, yCordsCells };
  }
}
