declare module 'qrcode-generator' {
  interface QRCode {
    addData(data: string): void;
    make(): void;
    createSvgTag(opts?: { cellSize?: number; margin?: number; scalable?: boolean }): string;
    createDataURL(cellSize?: number, margin?: number): string;
  }
  function qrcode(typeNumber: number, errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'): QRCode;
  export = qrcode;
}
