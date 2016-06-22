export class Logger {
  warn(message: string): void {
    console.warn(message);
  }
  log(message: string): void {
    console.log(message);
  }
}

var _activeLogger: Logger = new Logger();

export function setActiveLogger(logger: Logger): void {
  _activeLogger = logger; 
}

export function getActiveLogger(): Logger {
  return _activeLogger;
}
