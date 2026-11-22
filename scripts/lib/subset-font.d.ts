declare module 'subset-font' {
  interface SubsetOptions {
    targetFormat?: 'woff2' | 'woff' | 'truetype' | 'sfnt';
    preserveNameIds?: number[];
    keepFeatures?: string[];
    variationAxes?: Record<string, number | { min: number; max: number; default?: number }>;
    noLayoutClosure?: boolean;
  }
  export default function subsetFont(font: Buffer, text: string, options?: SubsetOptions): Promise<Buffer>;
}
