export interface KarmaFile {
  originalPath: string;
  relativePath: string;
  path: string;
  sourceMap: string;
}

export interface Logger {
  debug(message: any, ...args: any[]): void;
  info(message: any, ...args: any[]): void;
}

export type KarmaLoggerFactory = {
  create: (name: string) => Logger;
};

export type Callback<T = any> = (e: Error | null, result?: T) => void;

export interface KarmaEmitter {
  refreshFile(file: String): void;
}
