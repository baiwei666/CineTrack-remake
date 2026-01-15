declare module 'colorthief' {
    export default class ColorThief {
        getColor(sourceImage: any, quality?: number): Promise<number[]> | number[];
        getPalette(sourceImage: any, colorCount?: number, quality?: number): Promise<number[][]> | number[][];
    }
}
