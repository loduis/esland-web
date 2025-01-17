type StepResolver = (
  current: number | string,
  step: number
) => void | undefined;

type Value = number | (() => number);

function lerp(a: number, b: number, alpha: number): number {
  return a + alpha * (b - a);
}

const easeOutCubic = (value: number): number => {
  return 1 - Math.pow(1 - value, 3);
};

function cal(value: Value) {
  return typeof value === "function" ? value() : value;
}

export default class ProgressiveNumber {
  private initial: number;
  private duration: number;
  private decimals: number;
  private delay: number;
  private target: number;
  private current: number;
  private steps: number = 1;
  private currentStep = 1;
  private timer: number | NodeJS.Timeout = 0;

  constructor(
    initial: Value,
    final: Value,
    decimals: number = 0,
    duration: number = 1500,
    delay: number = 5
  ) {
    initial = cal(initial);
    this.target = cal(final);
    this.current = initial;
    this.initial = initial;
    this.duration = duration;
    this.decimals = decimals;
    this.delay = delay;
    this.steps = Math.max(Math.floor(this.duration / this.delay), 1);
  }

  static generate(
    initial: number,
    final: number,
    resolve?: StepResolver,
    decimals: number = 0,
    duration: number = 1500,
    delay: number = 5
  ) {
    new this(initial, final, decimals, duration, delay).generate(resolve);
  }

  generate(resolve?: StepResolver): void {
    this.resolve(resolve);
    this.schedule(resolve);
  }

  schedule(resolve?: StepResolver, loop: boolean = true) {
    const callback = loop ? this.loop : this.next;
    return (this.timer = setTimeout(callback.bind(this, resolve), this.delay));
  }

  resolve(resolve?: StepResolver) {
    if (resolve) {
      resolve(this.value, this.currentStep);
    }
  }

  next(resolve?: StepResolver) {
    const progress = this.progress;
    let next = true;
    if (progress >= 1) {
      this.current = this.target;
      next = false;
    } else {
      this.current = lerp(this.initial, this.target, easeOutCubic(progress));
      this.currentStep++;
    }
    this.resolve(resolve);
    return next;
  }

  loop(resolve?: StepResolver) {
    clearTimeout(this.timer);
    if (this.next(resolve)) {
      this.schedule(resolve);
    }
  }

  get progress() {
    return this.currentStep / this.steps;
  }

  get value() {
    return this.current.toFixed(this.decimals);
  }

  get step() {
    return this.currentStep;
  }
}
