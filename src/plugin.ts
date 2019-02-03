import {
  NextFunction,
  Request,
  RequestHandler,
  Response
} from "express-serve-static-core";
import * as os from "os";
import * as path from "path";
import { createBundler } from "./bunlder";
import { createWorkspaceSync } from "./files";
import {
  Callback,
  KarmaEmitter,
  KarmaFile,
  KarmaLoggerFactory,
  Logger
} from "./types";
import { throttle } from "./utils";
import karma = require("karma");

export type Workspace = ReturnType<typeof createWorkspaceSync>;

export class ParcelPlugin {
  private log: Logger;
  private karmaConf: karma.ConfigOptions;
  private emitter: KarmaEmitter;
  private _workspace: Workspace | null;
  private _middleware: RequestHandler | null;

  constructor(logger: Logger, conf: karma.ConfigOptions, emitter: any) {
    this.log = logger;
    this.karmaConf = conf;
    this.emitter = emitter;
    this._workspace = null;
    this._middleware = null;
  }

  workspace(): Workspace {
    if (!this._workspace) {
      this._workspace = createWorkspaceSync();
      this.log.debug(`Created workspace: ${this._workspace.dir}`);
    }
    return this._workspace;
  }

  addFile(file: KarmaFile | string) {
    const path = (file as any).originalPath || file;
    return this.workspace().entryFile.add(path);
  }

  isWatching() {
    return this.karmaConf.autoWatch || false;
  }

  preprocessor() {
    return (content: string, file: KarmaFile, next: Callback) => {
      this.log.debug(
        `Adding ${file.originalPath} to ${this.workspace().entryFile.path}`
      );

      this.addFile(file).then(() => {
        if (this.karmaConf.logLevel === (this.karmaConf as any).LOG_DEBUG) {
          next(null, `console.log("${file.path}");`);
        } else {
          next(null, `/* ${file.path} */`);
        }
      });
    };
  }

  middleware: RequestHandler = (req, resp, next) => {
    const originalUrl = req.url;
    const index = originalUrl.indexOf(".karma-parcel/index.js");

    if (index > 0) {
      const newUrl = `/${originalUrl.substring(index + 1)}`;
      req.url = newUrl;

      this.log.debug(`Serving ${originalUrl} as ${newUrl}`);

      return this.bundleMiddleware(req, resp, next);
    }

    this.log.debug(`${req.url} can not be served by parcel:middleware`);
    next();
  };

  private bundleMiddleware(req: Request, resp: Response, next: NextFunction) {
    if (!this._middleware) {
      const bundler = this.createBundler();
      this._middleware = bundler.middleware();
    }
    return this._middleware(req, resp, next);
  }

  private createBundler() {
    const { entryFile, dir, bundleFile } = this.workspace();

    this.log.debug(`Creating bundler for ${entryFile.toString()}`);

    return createBundler(
      entryFile.path,
      {
        outDir: dir,
        outFile: bundleFile,
        publicUrl: "/karma-parcel",
        cacheDir: path.join(os.tmpdir(), "karma-parcel-cache"),
        watch: this.isWatching(),
        detailedReport: false,
        logLevel: 1,
        hmr: false
      } as any,
      throttle(() => {
        this.log.debug(`Wrote bundled test: ${bundleFile}`);
        this.emitter.refreshFile(bundleFile);
      }, 500)
    );
  }
}

export function createParcelPlugin(
  logger: KarmaLoggerFactory,
  config: karma.ConfigOptions,
  emitter: KarmaEmitter
) {
  const parcelLoger = logger.create("parcel");
  return new ParcelPlugin(parcelLoger, config, emitter);
}

createParcelPlugin.$inject = ["logger", "config", "emitter"];
