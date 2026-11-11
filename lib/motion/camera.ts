/** The camera: where the device screens are in their cut-outs, the perspective transform that maps
 *  one quad onto another, and the easing the scenes share. Pure maths, no DOM except `layoutBox`. */

export type Point = [number, number];
export type Quad = [Point, Point, Point, Point];
export type Box = { x: number; y: number; w: number; h: number };

/** Natural widths of the two cut-outs the quads below were measured on. */
export const LAPTOP_NATURAL = 868;
export const PHONE_NATURAL = 267;

/** Screen corners in source pixels, clockwise from top left, fitted by edge scan on the originals. */
export const LAPTOP_SCREEN: Quad = [
  [294.6, 124.9],
  [840.9, 31],
  [764.2, 443.7],
  [208.3, 457.9],
];
export const PHONE_SCREEN: Quad = [
  [26.7, 13.8],
  [180.8, 34.1],
  [257.7, 431.3],
  [102, 439.9],
];

export const mapQuad = (q: Quad, fn: (p: Point) => Point): Quad => [fn(q[0]), fn(q[1]), fn(q[2]), fn(q[3])];

export function rectQuad(width: number, height: number): Quad;
export function rectQuad(x0: number, y0: number, x1: number, y1: number): Quad;
export function rectQuad(a: number, b: number, c?: number, d?: number): Quad {
  const [x0, y0, x1, y1] = c === undefined || d === undefined ? [0, 0, a, b] : [a, b, c, d];
  return [
    [x0, y0],
    [x1, y0],
    [x1, y1],
    [x0, y1],
  ];
}

export const centroid = (q: Quad): Point => [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4];

/** A quad's size, measured along its first diagonal. */
export const quadSize = (q: Quad) => Math.hypot(q[0][0] - q[2][0], q[0][1] - q[2][1]);

export function growQuad(q: Quad, factor: number): Quad {
  const [cx, cy] = centroid(q);
  return mapQuad(q, ([x, y]) => [cx + (x - cx) * factor, cy + (y - cy) * factor]);
}

/** A `matrix3d()` that lands `src` on `dst`, for an element with `transform-origin: 0 0`. */
export function homography(src: Quad, dst: Quad): string {
  const A: number[][] = [];
  const b: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const [x, y] = src[i];
    const [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -x * u, -y * u]);
    b.push(u);
    A.push([0, 0, 0, x, y, 1, -x * v, -y * v]);
    b.push(v);
  }
  for (let column = 0; column < 8; column += 1) {
    let pivot = column;
    for (let row = column + 1; row < 8; row += 1) {
      if (Math.abs(A[row][column]) > Math.abs(A[pivot][column])) pivot = row;
    }
    [A[column], A[pivot]] = [A[pivot], A[column]];
    [b[column], b[pivot]] = [b[pivot], b[column]];
    for (let row = 0; row < 8; row += 1) {
      if (row === column) continue;
      const factor = A[row][column] / A[column][column];
      for (let k = column; k < 8; k += 1) A[row][k] -= factor * A[column][k];
      b[row] -= factor * b[column];
    }
  }
  const h = b.map((value, i) => value / A[i][i]);
  return `matrix3d(${h[0]},${h[3]},0,${h[6]},${h[1]},${h[4]},0,${h[7]},0,0,1,0,${h[2]},${h[5]},0,1)`;
}

/** Moves one quad to another the way a camera would: size changes geometrically and the centre
 *  follows the size, so a push-in reads as distance instead of speeding up as it nears. */
export function dolly(from: Quad, to: Quad, e: number): Quad {
  const c0 = centroid(from);
  const c1 = centroid(to);
  const s0 = quadSize(from);
  const s1 = quadSize(to);
  const size = s0 * Math.pow(s1 / s0, e);
  const travel = s1 === s0 ? e : (size - s0) / (s1 - s0);
  const cx = c0[0] + (c1[0] - c0[0]) * travel;
  const cy = c0[1] + (c1[1] - c0[1]) * travel;
  const mix = Math.min(1, travel * 1.15);
  const corner = (i: number): Point => {
    const ax = (from[i][0] - c0[0]) / s0;
    const ay = (from[i][1] - c0[1]) / s0;
    const bx = (to[i][0] - c1[0]) / s1;
    const by = (to[i][1] - c1[1]) / s1;
    return [cx + (ax + (bx - ax) * mix) * size, cy + (ay + (by - ay) * mix) * size];
  };
  return [corner(0), corner(1), corner(2), corner(3)];
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Where `t` sits between `a` and `b`, clamped to 0..1. */
export const seg = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

export const ioCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

export const sineInOut = (x: number) => -(Math.cos(Math.PI * x) - 1) / 2;

const pageOffset = (el: HTMLElement) => {
  let x = 0;
  let y = 0;
  for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) {
    x += node.offsetLeft;
    y += node.offsetTop;
  }
  return { x, y };
};

/** An element's box in `ancestor`'s coordinates, read from layout only, so entrances, floats and
 *  scene transforms never leak into a measurement. Use it instead of `getBoundingClientRect` on
 *  anything that animates. */
export function layoutBox(el: HTMLElement, ancestor: HTMLElement): Box {
  let x = 0;
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    x += node.offsetLeft;
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  if (node !== ancestor) {
    // The ancestor is not positioned, so it was not on the chain: measure both from the page.
    const base = pageOffset(ancestor);
    x -= base.x;
    y -= base.y;
  }
  return { x, y, w: el.offsetWidth, h: el.offsetHeight };
}
