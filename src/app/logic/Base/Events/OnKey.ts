export default interface OnKey {
  OnKey(button: string, state: 'PRESSED' | 'RELEASED' | 'TYPED'): void;
}
