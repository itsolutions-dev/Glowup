// Types for the part of the d3 copy the package uses. Written by us, on d3-scale 4.0.2 and d3-shape 3.2.0.
// Deliberately narrow: only what src/core wraps. Nothing here is part of the package's public API.

export interface ScaleLinear {
  (value: number): number;
  domain(): number[];
  domain(domain: Iterable<number>): this;
  range(): number[];
  range(range: Iterable<number>): this;
  invert(value: number): number;
  nice(count?: number): this;
  ticks(count?: number): number[];
  clamp(clamp: boolean): this;
  rangeRound(range: Iterable<number>): this;
  copy(): ScaleLinear;
}
export function scaleLinear(): ScaleLinear;

export interface ScaleBand<Domain extends string | number = string> {
  (value: Domain): number | undefined;
  domain(): Domain[];
  domain(domain: Iterable<Domain>): this;
  range(): [number, number];
  range(range: Iterable<number>): this;
  rangeRound(range: Iterable<number>): this;
  bandwidth(): number;
  step(): number;
  padding(padding: number): this;
  paddingInner(padding: number): this;
  paddingOuter(padding: number): this;
  align(align: number): this;
  copy(): ScaleBand<Domain>;
}
export function scaleBand<Domain extends string | number = string>(): ScaleBand<Domain>;

export interface ScaleOrdinal<Domain, Range> {
  (value: Domain): Range;
  domain(): Domain[];
  domain(domain: Iterable<Domain>): this;
  range(): Range[];
  range(range: Iterable<Range>): this;
  copy(): ScaleOrdinal<Domain, Range>;
}
export function scaleOrdinal<Domain = string, Range = string>(range?: Iterable<Range>): ScaleOrdinal<Domain, Range>;

export interface ScaleTime {
  (value: Date | number): number;
  domain(): Date[];
  domain(domain: Iterable<Date | number>): this;
  range(): number[];
  range(range: Iterable<number>): this;
  invert(value: number): Date;
  nice(count?: number): this;
  ticks(count?: number): Date[];
  clamp(clamp: boolean): this;
  copy(): ScaleTime;
}
export function scaleTime(): ScaleTime;
export function scaleUtc(): ScaleTime;

export interface Curve {
  lineStart(): void;
  lineEnd(): void;
  point(x: number, y: number): void;
  areaStart?(): void;
  areaEnd?(): void;
}
export type CurveFactory = (context: unknown) => Curve;
export const curveLinear: CurveFactory;
export const curveMonotoneX: CurveFactory;
export const curveMonotoneY: CurveFactory;
export const curveNatural: CurveFactory;
export const curveStep: CurveFactory;
export const curveStepAfter: CurveFactory;
export const curveStepBefore: CurveFactory;

type Accessor<Datum, Value> = Value | ((d: Datum, index: number, data: Datum[]) => Value);

export interface Line<Datum> {
  (data: Iterable<Datum>): string | null;
  x(x: Accessor<Datum, number>): this;
  y(y: Accessor<Datum, number>): this;
  defined(defined: Accessor<Datum, boolean>): this;
  curve(curve: CurveFactory): this;
}
export function line<Datum = [number, number]>(): Line<Datum>;

export interface Area<Datum> {
  (data: Iterable<Datum>): string | null;
  x(x: Accessor<Datum, number>): this;
  x0(x: Accessor<Datum, number>): this;
  x1(x: Accessor<Datum, number>): this;
  y(y: Accessor<Datum, number>): this;
  y0(y: Accessor<Datum, number>): this;
  y1(y: Accessor<Datum, number>): this;
  defined(defined: Accessor<Datum, boolean>): this;
  curve(curve: CurveFactory): this;
}
export function area<Datum = [number, number]>(): Area<Datum>;

export interface ArcDatum {
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  padAngle?: number;
}
export interface Arc<Datum = ArcDatum> {
  (datum: Datum): string | null;
  centroid(datum: Datum): [number, number];
  innerRadius(radius: Accessor<Datum, number>): this;
  outerRadius(radius: Accessor<Datum, number>): this;
  cornerRadius(radius: Accessor<Datum, number>): this;
  startAngle(angle: Accessor<Datum, number>): this;
  endAngle(angle: Accessor<Datum, number>): this;
  padAngle(angle: Accessor<Datum, number>): this;
}
export function arc<Datum = ArcDatum>(): Arc<Datum>;

export interface PieArcDatum<Datum> {
  data: Datum;
  value: number;
  index: number;
  startAngle: number;
  endAngle: number;
  padAngle: number;
}
export interface Pie<Datum> {
  (data: Datum[]): PieArcDatum<Datum>[];
  value(value: Accessor<Datum, number>): this;
  sort(compare: ((a: Datum, b: Datum) => number) | null): this;
  sortValues(compare: ((a: number, b: number) => number) | null): this;
  startAngle(angle: number): this;
  endAngle(angle: number): this;
  padAngle(angle: number): this;
}
export function pie<Datum = number>(): Pie<Datum>;

export type SeriesPoint<Datum> = [number, number] & { data: Datum };
export type Series<Datum> = SeriesPoint<Datum>[] & { key: string; index: number };
export interface Stack<Datum> {
  (data: Datum[]): Series<Datum>[];
  keys(keys: Iterable<string>): this;
  value(value: (d: Datum, key: string, index: number, data: Datum[]) => number): this;
  order(order: (series: Series<Datum>[]) => Iterable<number>): this;
  offset(offset: (series: Series<Datum>[], order: number[]) => void): this;
}
export function stack<Datum = Record<string, number>>(): Stack<Datum>;
type StackOrder = (series: unknown) => number[];
type StackOffset = (series: unknown, order: number[]) => void;
export const stackOrderNone: StackOrder;
export const stackOrderAscending: StackOrder;
export const stackOrderDescending: StackOrder;
export const stackOrderInsideOut: StackOrder;
export const stackOrderReverse: StackOrder;
export const stackOrderAppearance: StackOrder;
export const stackOffsetNone: StackOffset;
export const stackOffsetExpand: StackOffset;
export const stackOffsetDiverging: StackOffset;
export const stackOffsetSilhouette: StackOffset;
export const stackOffsetWiggle: StackOffset;
