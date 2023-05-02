export default class Cell {
    row: number = 1;
    column: number =1;
    id: number;
    rows: number =1;
    columns: number=1;
    submergedOf: number | undefined;
    isNewCell: boolean | undefined;
    x:number=5;
    y:number=5;
    height:number=100;
    width:number=100;

    constructor(row:number,column:number,id:number,rows:number,columns:number,x:number,y:number,height:number,width:number) {
        this.id = id;
        this.row=row;
        this.column = column;
        this.rows = rows;
        this.columns = columns;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    getCell()
    {
        return {id:this.id,row:this.row,column:this.column,rows:this.rows,columns:this.columns}
    }
}