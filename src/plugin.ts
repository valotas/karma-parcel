import type { InitialParcelOptions as ParcelOptions } from "@parcel/types";
import type { RequestHandler } from "serve-static";
import type { Callback, KarmaFile, KarmaLoggerFactory, Logger } from "./types";
import { createWorkspaceSync } from "./files";
import * as karma from "karma";
import { createParcelServeStatic } from "./serve-static";
import { IncomingMessage } from "http";
import { createKarmaParcelBundler } from "./KarmaParcelBundler";
import { EventEmitter } from "stream";

export type Workspace = ReturnType<typeof createWorkspaceSync>;

export type KarmaConf = karma.ConfigOptions &
  karma.Config & {
    karmaParcelWorkspace?: string;
    parcelConfig?: Pick<
      ParcelOptions,
      "cacheDir" | "detailedReport" | "logLevel"
    >;
  };

export interface KarmaServer extends karma.Server {
  refreshFile(file: string): Promise<any>;
}

export class ParcelPlugin {
  private log: Logger;
  private karmaConf: KarmaConf;
  private emitter?: EventEmitter;
  private _workspace: Workspace | null;
  private _middleware: RequestHandler<any> | null;

  static factory: any;

  constructor(logger: Logger, conf: KarmaConf, emitter?: EventEmitter) {
    this.log = logger;
    this.karmaConf = conf;
    this.emitter = emitter;
    this._workspace = null;
    this._middleware = null;
  }

  workspace(): Workspace {
    if (!this._workspace) {
      const karmaParcelWorkspace =
        this.karmaConf.karmaParcelWorkspace || undefined;
      this._workspace = createWorkspaceSync(karmaParcelWorkspace);
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

  preprocessor = (_: string, file: KarmaFile, next: Callback) => {
    this.log.debug(
      `Adding ${file.originalPath} to ${this.workspace().entryFile.path}`
    );

    this.addFile(file).then(() => {
      if (this.karmaConf.logLevel === this.karmaConf.LOG_DEBUG) {
        next(null, `console.log("${file.path}");`);
      } else {
        next(null, `/* ${file.path} */`);
      }
    });
  };

  middleware: RequestHandler<any> = (req, resp, next) => {
    const originalUrl = req.url;
    const index = originalUrl?.indexOf(".karma-parcel/") || -1;

    if (index > 0 && originalUrl) {
      const newUrl = `/${originalUrl.substring(
        index + ".karma-parcel/dist/".length
      )}`;
      req.url = newUrl;

      this.log.debug(`Serving ${originalUrl} as ${newUrl}`);

      return this.bundleMiddleware(req, resp, next);
    }

    this.log.debug(`${req.url} can not be served by parcel:middleware`);
    next();
  };

  private bundleMiddleware(req: IncomingMessage, resp: Response, next: any) {
    if (!this._middleware) {
      const bundler = this.createBundler();
      this._middleware = createParcelServeStatic(
        this.workspace().distDir,
        bundler
      );
      bundler.start();
    }
    return this._middleware(req, resp, next);
  }

  private createBundler() {
    const { entryFile, distDir } = this.workspace();

    this.log.debug(`Creating bundler for ${entryFile.toString()}`);

    return createKarmaParcelBundler(
      {
        defaultConfig: "@parcel/config-default",
        detailedReport: null,
        logLevel: "info",
        shouldAutoInstall: true,
        targets: {
          main: {
            distDir,
            sourceMap: true,
            context: "browser",
          },
        },
        ...this.karmaConf.parcelConfig,
        // config that should not be overriden
        //outFile: bundleFile,
        entries: [entryFile.path],
        hmrOptions: null,
        watch: this.isWatching(),
      },
      this.emitter
    );
  }
}

ParcelPlugin.factory = function (
  logger: KarmaLoggerFactory /* logger */,
  config: KarmaConf /* config */,
  emitter: KarmaServer /* emitter */
) {
  const parcelLoger = logger.create("parcel");
  return new ParcelPlugin(parcelLoger, config, emitter);
};
