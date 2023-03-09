import SelectionTool from '../../Tools/SelectionTool';

export default interface OnSelection {
  OnSelection(selectionTool?: SelectionTool): void;
}
