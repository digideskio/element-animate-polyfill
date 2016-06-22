export class BrowserClock {
  public startingTime = 0;

  raf(fn) {
    window.requestAnimationFrame(fn);
  }

  now() {
    return window.performance.now();
  }

  get currentTime() {
    return this.now();
  }

  callback(fn) {
    fn();
  }
}
