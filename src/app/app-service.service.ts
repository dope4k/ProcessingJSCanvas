import { Injectable } from '@angular/core';
import Image from 'src/app/logic/Components/Image';
import Context from 'src/app/logic/Base/Context';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Table from './logic/Components/Table';
import Cell from './logic/Components/Cell';
import { ApiService } from './api.service';
import Crop from './logic/Components/Crop';
import Renderer from './logic/Base/Renderer';
import Edge from './logic/Components/Edge';
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
    console.log(this.context);
    console.log(this.displayAllRowsColumnsSelected());
    
    // let table= Context.context?.OnKeyDispatchers[0];
    // (table as any).edges.forEach((edge:Edge)=>{
      
      // if(edge.start.topEdge==undefined && edge.isHorizontal==true)
      // console.log(edge.row,edge.column);

      // if(edge.start.leftEdge==undefined && edge.isVertical==true)
      // {
      //   console.log(edge.row,edge.column);
      // }
      
    // })
  }
  //are both numbers in range from 2 to -2
  isCloseNumbers(a: number, b: number) {
    if (a>=b && a - b <= 6) {
      return true;
    }
    else if (a<=b && b-a <=6)
    {
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
  transformIncomingCellsToCellObjArray(allCells: any[], scaleRatio: number,hybrid: boolean) {
    let cells: Cell[] = [];
    for (let x = 0; x < allCells.length; x++) {
      let cell = new Cell(allCells[x].row, 1, allCells[x].id, allCells[x].rows,
        1, Math.round(allCells[x]['x-cord'] * (hybrid?1:scaleRatio)), Math.round(allCells[x]['y-cord'] * (hybrid?1:scaleRatio)), Math.round(allCells[x].height * (hybrid?1:scaleRatio)),
        Math.round(allCells[x].width * (hybrid?1:scaleRatio)))
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
       = this.backendCellsToFrontendCells(allCells, allXCords, allYCords,false);
      //create a table and send those cells
      let table = new Table()
      table.autoTableCreation(cells, Math.round(firstX), Math.round(firstY), Math.round(lastX), Math.round(lastY)
        , xCordsCells, yCordsCells)
      Context.context?.AddObject(table)
    })
  }

  //get frontend formated cells from backend . adds missing cells aswell
  private backendCellsToFrontendCells(allCells: any, allXCords: any, allYCords: any,hybrid: boolean) {
    let cells: Cell[] = [];
    hybrid=false;
    //find scaleRatio
    let scaleRatio = this.getScaleRatio();
    //find maxId 
    let maxId = this.findMaxId(cells, 0);
    // push incoming cells to Cell Format array
    cells = this.transformIncomingCellsToCellObjArray(allCells, scaleRatio,hybrid);
    //first 2 coordinates to send in function to detect top and left
    const firstX = allXCords[0] * (hybrid?1:scaleRatio);
    const firstY = allYCords[0] * (hybrid?1:scaleRatio);
    //check for out of index
    let allXCordsLength = allXCords.length;
    let allYCordsLength = allYCords.length;
    const lastX = (allXCordsLength>2)?(allXCords[allXCords.length - 2] * (hybrid?1:scaleRatio)):0;
    const lastY = (allYCordsLength>2)?(allYCords[allYCords.length - 2] * (hybrid?1:scaleRatio)):0;
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
    //sort the cords and remove duplicates
    yCordsCells = this.removeDuplicateCordsAndSort(yCordsCells);
    xCordsCells = this.removeDuplicateCordsAndSort(xCordsCells);
    // check if a cell exists on the (x,y) from coordinates
    // if not add a cell to the array
    cells = this.addNew1x1Cells(cells, xCordsCells, yCordsCells, maxId);
    //fix cells height width if necessary
    cells = this.fixCellsHeightWidth(cells);
    return { cells, firstX, firstY, lastX, lastY, xCordsCells, yCordsCells };
  }

  //remove duplicate cords and then sort them
  private removeDuplicateCordsAndSort(cords:number[])
  {
    cords = cords.filter((value, index) => cords.indexOf(value) === index)
    cords= cords.sort(function(a, b){return a - b});
    return cords
  }

  //extract table  -- (hybrid == true for hybrid split)
  extractTable(hybrid: boolean)
  {
    let table: Table | undefined;
    this.context?.OnKeyDispatchers.forEach((obj:any)=>{
      if(obj.cells)
      {
          let scaleRatio= this.getScaleRatio()
          table=obj
          if(table) 
          {
            //crop variables
            let x1=table.bbox[0]+20;
            let y1=table.bbox[1]+20;
            let x2=table.bbox[2]-x1-20;
            let y2=table.bbox[3]-y1-20;
            
            //for hybrid split we send crop by dividing it by scale ratio
            let crop = new Crop(x1?x1/(hybrid?this.getScaleRatio():1):2,
            y1?y1/(hybrid?this.getScaleRatio():1):2,
            x2/(hybrid?this.getScaleRatio():1),
            y2/(hybrid?this.getScaleRatio():1))

            //removes the already created table
            this.context?.RemoveObject(table?.id) 
            this.apiService.extractTable(this.fileToSend,crop,scaleRatio,hybrid?true:false).subscribe(data=>{
              this.extractHybridApiResponseToTable(hybrid?data:(data as [0]),hybrid)            
            })
            return;      
          }
      }
    })
  }


  //takes input from extract table Api and makes cell
  extractHybridApiResponseToTable(data:any,hybrid:boolean)
  {
      let xCords= hybrid?data['xCords']:data[0]['xCords'];
      let yCords= hybrid?data['yCords']:data[0]['yCords'];
      //cells from api response
      let backendCells= hybrid?data['cells']:data[0]['cells'];
      //find the right bottom most cell to calculate last xcord and ycord 
      let rightBottomMostCell= this.findCornerCellInDirection(backendCells,'RightBottom');
      //add that last xcord and ycord to arrays
      if(!hybrid)
      {
        (xCords as number[]).push(rightBottomMostCell?
          (rightBottomMostCell['x-cord'] + rightBottomMostCell['width']):0);
        (yCords as number[]).push(rightBottomMostCell?
            rightBottomMostCell['y-cord'] + rightBottomMostCell['height']:0);
      }
      
      //remove duplicates and sort
      (xCords as number[])=this.removeDuplicateCordsAndSort(xCords);
      (yCords as number[])=this.removeDuplicateCordsAndSort(yCords);
      if(!hybrid)
      {
        let cells: Cell[] = [];
        cells=this.addNew1x1Cells(cells,xCords,yCords,1)
          
        //create table and display
        let table = new Table()
        table.autoTableCreation(cells,xCords[0],yCords[0],xCords[(xCords as any).length-1],yCords[(yCords as any).length-1],
          xCords,yCords)
        Context.context?.AddObject(table)
      }
      if(hybrid)
      {
        var { cells, firstX, firstY, lastX, lastY, xCordsCells, yCordsCells }: 
        { cells: Cell[]; firstX: number; firstY: number; lastX: number; lastY: number; xCordsCells: number[]; yCordsCells: number[]; }
         = this.backendCellsToFrontendCells(backendCells, xCords, yCords,hybrid);
        //create a table and send those cells
        let table = new Table()
        table.autoTableCreation(cells,
        Math.round(firstX),
         Math.round(firstY),
          Math.round(lastX),
           Math.round(lastY)
          , xCordsCells, yCordsCells)
        Context.context.AddObject(table)
      }  
  }
  
  //find corner cells in direction -
  //direction can 'RightBottom' or 'LeftTop'
  findCornerCellInDirection(backendCells: Cell[] | any, direction: string)
  {

    if(backendCells.length==0) return null
    let cell;
    let xcord= (direction=='LeftTop')?10000:0;
    let ycord= (direction=='LeftTop')?10000:0;
    if(direction=='RightBottom')
    {
      for(let x = 0 ; x < backendCells.length ; x++)
      {
        if(backendCells[x]['x-cord'] ? backendCells[x]['x-cord']:backendCells[x].x  > xcord)
        {
          xcord=backendCells[x]['x-cord']?backendCells[x]['x-cord']:backendCells[x].x;
        }
        if(backendCells[x]['y-cord'] ? backendCells[x]['y-cord']:backendCells[x].y  > ycord)
        {
          ycord=backendCells[x]['y-cord']?backendCells[x]['y-cord']:backendCells[x].y;
        }
      }
    }
    else if(direction=='LeftTop')
    {
      for(let x = 0 ; x < backendCells.length ; x++)
      {
        if(backendCells[x]['x-cord'] ? backendCells[x]['x-cord']:backendCells[x].x  < xcord)
        {
          xcord=backendCells[x]['x-cord']?backendCells[x]['x-cord']:backendCells[x].x;
        }
        if(backendCells[x]['y-cord'] ? backendCells[x]['y-cord']:backendCells[x].y  < ycord)
        {
          ycord=backendCells[x]['y-cord']?backendCells[x]['y-cord']:backendCells[x].y;
        }
      }
    }
    for(let x in backendCells)
    {
      if((backendCells[x]['x-cord']?backendCells[x]['x-cord']:backendCells[x].x)==xcord && 
      (backendCells[x]['y-cord']?backendCells[x]['y-cord']:backendCells[x].y)==ycord)
      {
        return backendCells[x]
      }
    }
    return cell;
  }

  //returns true if edge is topmost or leftmost 
  isEdgeTopVerticeOrLeftVertice(edge: Edge)
  {
    if(edge.end.topEdge==undefined || edge.end.leftEdge==undefined){
      return true
    }
    return false;
  }

  //magic split active toggle variable
  magicSplit: boolean = false; 
  makeTablesEdgesIconsForMagicSplit(table: Table | undefined)
  {
    if(this.magicSplit==false)
    {
      if(table) 
      {
        table.edges.forEach((edge)=>{
          edge.magicSplitActive=true;
        })
        
        //loop through all edges of the table
        table.edges.forEach((edge)=>{
          //find the top most and left most edges 
          if(this.isEdgeTopVerticeOrLeftVertice(edge))
          {
            //Flag for magic split icons 
            edge.magicAdd=true
            edge.magicRemove=false;
            //Displays the Magic Split add icons
            edge.InitNewAddButton();  
            // edge.InitNewDeleteButton()
          }
        })
      }
      this.magicSplit=true;
    }
    else if(this.magicSplit==true)
    {
      if(table) 
      {
        table.edges.forEach((edge)=>{
          edge.magicSplitActive=false;
        })
        
        //loop through all edges of the table
        table.edges.forEach((edge)=>{
          //find the top most and left most edges 
          if(edge.magicAdd) {
            edge.magicSplit_addBtn=undefined
            edge.magicAdd=false;
          }
          if(edge.magicRemove)
          {
            edge.magicSplit_deleteBtn=undefined
            edge.magicRemove=false;
          } 
        })
      }
      this.magicSplit=false;
    }

  }

  //shows magic split icons
  showMagicSplitIcons(rowOrCol:'Both' | 'Row' | 'Column')
  {
    if(rowOrCol=='Both')
    {
      this.selectedColumns=[];
      this.selectedRows=[]
      let table: Table | undefined;
      this.context?.OnKeyDispatchers.forEach((obj:any)=>{
        if(obj.cells)
        {
            table=obj
            this.makeTablesEdgesIconsForMagicSplit(table)
        }
      })
      Renderer.Render()
    }
    else if(rowOrCol=='Row')
    {

    }
    else if(rowOrCol=='Column')
    {

    }
  }

  //variables for magic split icon displaying
  selectedRows:number[] =[]; //for ui
  selectedColumns:number[]=[]; //for ui
  selectedEdgesRows: Edge[]=[]; //for logic
  selectedEdgesColumns: Edge[]=[]; //for logic
  loadPage:boolean=true; 

  displayAllRowsColumnsSelected()
  {
    this.selectedRows=[];
    this.selectedColumns=[];
    this.selectedEdgesColumns=[];
    this.selectedEdgesRows=[];

    this.loadPage=false;
    let table= Context?.context?.OnKeyDispatchers[0];
    if(table)
    {
      let edges= (table as Table)?.edges;
      for(let x in edges)
      {        
        if(edges[x].magicRemove==true && edges[x].isVertical) 
        {
          this.selectedRows?.push(edges[x].row)        
          this.selectedEdgesRows.push(edges[x])
        }
          if(edges[x].magicRemove==true && edges[x].isHorizontal) 
          {
            this.selectedColumns.push(edges[x].column)
            this.selectedEdgesColumns.push(edges[x])
          }
      }
    }
    this.selectedColumns= this.removeDuplicateCordsAndSort(this.selectedColumns)
    this.selectedRows= this.removeDuplicateCordsAndSort(this.selectedRows)
    this.loadPage=true;
  }

  getXYCords(table: Table)
  {
    let xCords:number[]=[]
    let yCords:number[]=[]
    table.edges.forEach(edge=>{
      edge.CalculateBBOX()
      if(edge.isHorizontal)
      {
        yCords.push(edge.y1)
      }
      if(edge.isVertical)
      {
        xCords.push(edge.x1)
      }
    })
    xCords= this.removeDuplicateCordsAndSort(xCords);
    yCords= this.removeDuplicateCordsAndSort(yCords);
    return {'xCords':xCords,'yCords':yCords}
  }


  //variable for checking if user wants to keep Original Lines 
  keepOriginalCells=true;
  toggleKeepOriginalCellsCheck()
  {
    if(this.keepOriginalCells==true) this.keepOriginalCells=false
    else this.keepOriginalCells=true;
  }

  private getRowColumnCropsForMagicSplit(table: Table, selectedEdgesRows:any, selectedEdgesColumns:any,
    cropsArrayRows:any,cropsArrayColumns:any)
  {
    for(let x=0;x<selectedEdgesRows.length;x++)
    {
      let crops= new Crop(
        selectedEdgesRows[x].x1,
        selectedEdgesRows[x].y1,
        (table as Table)?.bbox[2],
        selectedEdgesRows[x].y2)
      cropsArrayRows.push(crops.getCrop())
    }
    for(let x=0;x<selectedEdgesColumns.length;x++)
    {
      let crops= new Crop(
        selectedEdgesColumns[x].x1,
        selectedEdgesColumns[x].y1,
        selectedEdgesColumns[x].x2,
        (table as any).bbox[3])
      cropsArrayColumns.push(crops.getCrop())
    }
    let colsCrop=[];
    for(let x in cropsArrayColumns)
    {
      let obj={
        x1: Math.round(cropsArrayColumns[x][0]/this.getScaleRatio()),
        y1: Math.round(cropsArrayColumns[x][1]/this.getScaleRatio()),
        x2: Math.round(cropsArrayColumns[x][2]/this.getScaleRatio()),
        y2: Math.round(cropsArrayColumns[x][3]/this.getScaleRatio()),
        height:Math.round((cropsArrayColumns[x][3]-cropsArrayColumns[x][1])/this.getScaleRatio()),
        width: Math.round((cropsArrayColumns[x][2]-cropsArrayColumns[x][0])/this.getScaleRatio()),
      }
      colsCrop.push(obj)
    }
    let rowsCrop=[];
    for(let x in cropsArrayRows)
    {
      let obj={
        x1: (cropsArrayRows[x][0]/this.getScaleRatio()),
        y1: Math.round(cropsArrayRows[x][1]/this.getScaleRatio()),
        x2: Math.round(cropsArrayRows[x][2]/this.getScaleRatio()),
        y2: Math.round(cropsArrayRows[x][3]/this.getScaleRatio()),
        height: Math.round((cropsArrayRows[x][3]-cropsArrayRows[x][1])/this.getScaleRatio()),
        width: Math.round((cropsArrayRows[x][2]-cropsArrayRows[x][0])/this.getScaleRatio()),
      }
      rowsCrop.push(obj)
    }
    return { rowsCrop: rowsCrop, colsCrop: colsCrop}
  }

  private getXYCordsFromTableAndApplyScaleRatio(table: Table) {
    let xCords:any;
    let yCords:any;
    [xCords,yCords]=Object.values(this.getXYCords((table as Table)))

    //apply scale on the xcords and ycords
    for (let x in xCords) {
      xCords[x] = Math.round(xCords[x] / this.getScaleRatio());
    }
    for (let x in yCords) {
      yCords[x] = Math.round(yCords[x] / this.getScaleRatio());
    }
    return { xCords, yCords };
  }

  private getTableCrop(table: Table) {
    //+-20 for the mouse detection on border of table
    (table as Table).CalculateBbox();
    let x1 = (table as Table).bbox[0] + 20;
    let y1 = (table as Table).bbox[1] + 20;
    let x2 = (table as Table).bbox[2] - x1 - 20;
    let y2 = (table as Table).bbox[3] - y1 - 20;

    //making full table Crop & applying scale
    let tabelCropObj = [[
      Math.round(x1 / this.getScaleRatio()),
      Math.round(y1 / this.getScaleRatio()),
      Math.round(x2 / this.getScaleRatio()),
      Math.round(y2 / this.getScaleRatio())
    ]];
    return tabelCropObj;
  }

  removeCloseCords(cords:number [])
  {
    const result = [cords[0]]; // Add the first element to the result array

    for (let i = 1; i < cords.length; i++) {
      if (cords[i] - result[result.length - 1] >= 1) {
        result.push(cords[i]); // Add the element to the result array
      }
    }
  
    return result;
  }

  selectedCells:any=[];
  private getSelectedCellCrops()
  {
    let table = (Context?.context?.OnKeyDispatchers[0] as Table);
    if(!table) return []
    else
    {
      let nodes= table.nodes;
      let edges= table.edges;
      let x11;
      let y11;
      let x22;
      let y22;
      if(this.keepOriginalCells==true)
      {
        let x1;
        let y1;
        let selectedCrops:any=[]
        for(let x=0;x<nodes.length;x++)
        {
          if(nodes[x].selectedCell==true)
          {
            x1=nodes[x].bbox[0];
            y1=nodes[x].bbox[1];
            break;
          }
        }
        for(let x=0;x<edges.length;x++)
        {
          if(edges[x].isVertical &&
             edges[x].bbox[0]+2==x1 &&
             edges[x].bbox[1]+5==y1)
          {
            x11=edges[x].bbox[0];
            y11=edges[x].bbox[1];
            break;
          }
        }
        for(let x=0;x<edges.length;x++)
        {
          if(edges[x].isHorizontal &&
             edges[x].bbox[0]+5==x1 &&
             edges[x].bbox[1]+2==y1)
          {
            x22=edges[x].bbox[2];
            y22=edges[x].bbox[3];
            break;
          }
        }
        
        let obj={
          x1: x11,
          y1: y11,
          x2: x22,
          y2: y22
        }
        let check=false
        for(let x=0;x<selectedCrops.length;x++)
        {
          if(selectedCrops[x].x1==obj.x1 && selectedCrops[x].y1==obj.y1 &&
            selectedCrops[x].x2==obj.x2 && selectedCrops[x].y2==obj.y2)
            {
              check=true;
              break;
            }
        }
        if(check==false)
        {
          selectedCrops.push(obj)
        }
        return selectedCrops
      }
      else if(this.keepOriginalCells==false)
      {
        return []
      }
    }
    return []
  }

  magicSplitFunctionality() {

    //select the table 
    let table = Context?.context?.OnKeyDispatchers[0];
    let cropsArrayRows: any = []
    let cropsArrayColumns: any = []
    var tableCopy: Table;
    let colsCrop: any = [];
    let rowsCrop: any = []
    if (table) {
      //find selected row and column crops
      [rowsCrop, colsCrop] = Object.values(this.getRowColumnCropsForMagicSplit((table as Table), this.selectedEdgesRows, this.selectedEdgesColumns,
        cropsArrayRows, cropsArrayColumns))

      //make a copy of table for comparing edges with response
      tableCopy = (table as Table)
      tableCopy.CalculateBbox()

      //remove the old table
      this.context?.RemoveObject((table as Table)?.id)

      //crop variables
      let tabelCropObj = this.getTableCrop((table as Table));

      //calculating the xcords and ycords from table
      let { xCords, yCords } = this.getXYCordsFromTableAndApplyScaleRatio((table as Table));

      //magic split final payload
      let magicSplitPayloadData = {
        "border_table": 0,
        "borderless_table": 1,
        "scaleRatio": 1,
        "crops": tabelCropObj,
        "rows": rowsCrop,
        "cols": colsCrop,
        "appliedTo": [],
        "keepOriginal": this.keepOriginalCells ? 1 : 0,
        "xCords": xCords,
        "yCords": yCords
      }

      this.selectedCells=this.getSelectedCellCrops()
      console.log(this.selectedCells);
      return;

      let formData = new FormData();
      formData.append('image', (this.fileToSend as string))
      formData.append('data', JSON.stringify(magicSplitPayloadData))

      this.apiService.magicSplit(formData).subscribe(data => {
        //response coordinates  
        let xCordsR = (data as any)[0]?.xCords;
        let yCordsR = (data as any)[0]?.yCords;

        //have to remove this . this thing will go to haider side
        if (magicSplitPayloadData.cols.length == 0) {
          yCordsR = yCords;
        }
        else if (magicSplitPayloadData.rows.length == 0) {
          xCordsR = xCords;
        }

        //remove close coords - difference of 6  
        xCordsR = this.removeCloseCords(xCordsR)
        yCordsR = this.removeCloseCords(yCordsR)

        //apply scale on the coordinates
        for (let x in xCordsR) {
          xCordsR[x] = Math.round(xCordsR[x] * this.getScaleRatio())
        }
        for (let x in yCordsR) {
          yCordsR[x] = Math.round(yCordsR[x] * this.getScaleRatio())
        }

        //again remove close cords and sort
        xCordsR = this.removeCloseCords(xCordsR)
        yCordsR = this.removeCloseCords(yCordsR)
        xCordsR = this.removeDuplicateCordsAndSort(xCordsR);
        yCordsR = this.removeDuplicateCordsAndSort(yCordsR);

        let cells: Cell[] = [];

        cells = this.addNew1x1Cells(cells, xCordsR, yCordsR, 1)

        //deleting newcell check because we are not using already made cells
        for (let x in cells) {
          delete cells[x].isNewCell
        }


        let table = new Table()
        table.autoTableCreation(cells,
          xCordsR[0],
          yCordsR[0],
          xCordsR[(xCordsR as any).length - 1],
          yCordsR[(yCordsR as any).length - 1],
          xCordsR,
          yCordsR)
        if (this.keepOriginalCells) {
          //modify the edges and then display the table
          //update bbox of new table and its edges
          table.edges.forEach(newEdge => {
            newEdge.CalculateBBOX()
          })
          table.CalculateBbox()
          //check if bbox of old edge is in range of new edge then make the new edge property disabled
          //= old edge property disabled
          for (let xx = 0; xx < tableCopy.edges.length; xx++) {
            for (let yy = 0; yy < table.edges.length; yy++) {
              if (this.isCloseNumbers(tableCopy.edges[xx].bbox[0], table.edges[yy].bbox[0]) &&
                this.isCloseNumbers(tableCopy.edges[xx].bbox[1], table.edges[yy].bbox[1]) &&
                table.edges[yy].disabled == false &&
                table.edges[yy].isVertical == tableCopy.edges[xx].isVertical &&
                table.edges[yy].isHorizontal == tableCopy.edges[xx].isHorizontal) {
                table.edges[yy].disabled = tableCopy.edges[xx].disabled;
                break;
              }
            }
          }
        }
        //add the table to canvas
        Context.context?.AddObject(table)

      })
    }
  }

  selectedEdges:any=[]
  
  displaySelectedEdges()
  {
    const filterUniqueObjects = (array:any) => {
      const seenIds = new Set();
      return array.filter((obj:any) => {
        if (seenIds.has(obj.id)) {
          return false; // Filter out duplicates
        }
        seenIds.add(obj.id);
        return true;
      });
    };
    this.selectedEdges=filterUniqueObjects(this.selectedEdges)
    console.log(this.selectedEdges);
  }
  
}
