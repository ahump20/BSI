/**
 * CSS module type declarations
 */
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

declare module 'uplot/dist/uPlot.min.css';
