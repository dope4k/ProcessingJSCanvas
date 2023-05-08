export default class Crop {
    x1: number = 0;
    y1: number = 0;
    x2: number = 0;
    y2: number= 0;

    constructor(x1:number, y1:number, x2:number, y2:number) {
        this.x1=x1;
        this.y1=y1;
        this.x2=x2;
        this.y2=y2;
    }
    getCrop()
    {
        return [Math.abs(this.x1),Math.abs(this.y1),Math.abs(this.x2),Math.abs(this.y2)]
    }
}