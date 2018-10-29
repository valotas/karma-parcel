import { Logger } from "log4js";

export interface KarmaFile {
  originalPath: string;
  relativePath: string;
  path: string;
  sourceMap: string;
}

export type KarmaLoggerFactory = {
  create: (name: string) => Logger;
};

export type Callback<T = any> = (e: Error | null, result?: T) => void;
