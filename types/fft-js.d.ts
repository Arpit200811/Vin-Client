declare module "fft-js" {
  export function fft(input: number[]): [number, number][];
  export function ifft(input: [number, number][]): [number, number][];
}

declare module "fft-js/lib/util" {
  export function fftMag(ph: [number, number]): number;
  export function fftFreq(phasors: [number, number][], sampleRate?: number): number[];
}
