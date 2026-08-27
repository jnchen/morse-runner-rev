export function rndNormal(): number {
  return Math.sqrt(-2 * Math.log(Math.random())) * Math.cos(2 * Math.PI * Math.random());
}
export function rndGaussLim(mean: number, lim: number): number {
  const v = mean + rndNormal() * 0.5 * lim;
  return Math.max(mean - lim, Math.min(mean + lim, v));
}
export function rndRayleigh(mean: number): number {
  return mean * Math.sqrt(-Math.log(Math.random()) - Math.log(Math.random()));
}
export function rndUniform(): number {
  return 2 * Math.random() - 1;
}
export function rndUShaped(): number {
  return Math.sin(Math.PI * (Math.random() - 0.5));
}
export function rndPoisson(mean: number): number {
  const g = Math.exp(-mean);
  let t = 1;
  for (let k = 0; k <= 30; k++) {
    t *= Math.random();
    if (t <= g) return k;
  }
  return 31;
}
