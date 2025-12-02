export enum Unit {
  MM = 'mm',
  INCH = 'in',
}

export enum PaperOrientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

export interface PaperSize {
  id: string;
  name: string;
  width: number; // in mm
  height: number; // in mm
  category: 'ISO' | 'ANSI' | 'Photo' | 'Custom';
}

export enum SlicingMode {
  GRID = 'grid', // 3x3 sheets
  SIZE = 'size', // 1000mm width (auto calcs sheets)
}

export interface Layer {
  id: string;
  type: 'image' | 'text';
  content: string; // Image URL or Text string
  x: number; // Percentage 0-1 relative to poster width
  y: number; // Percentage 0-1 relative to poster height
  width: number; // Percentage 0-1 relative to poster width
  height: number; // Percentage 0-1 relative to poster height (or auto for text)
  rotation: number;
  opacity: number;
  style?: {
    color?: string;
    fontSize?: number; // relative scale
    fontFamily?: string;
    fontWeight?: string;
    backgroundColor?: string;
  };
}

export interface PosterConfig {
  mode: SlicingMode;
  unit: Unit;
  targetWidth: number; // in unit (mm or in)
  targetHeight: number; // in unit (mm or in)
  gridRows: number;
  gridCols: number;
  paperId: string;
  orientation: PaperOrientation;
  margin: number; // in unit
  overlap: number; // in unit
  showCutLines: boolean;
  cutLineStyle: 'solid' | 'dashed' | 'none';
  showPageNumbers: boolean;
}