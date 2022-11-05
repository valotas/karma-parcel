import type { RequestHandler } from "serve-static";
import serveStatic = require("serve-static");
import { KarmaParcelBundler } from "./KarmaParcelBundler";

export function createParcelServeStatic(
  path: string,
  bundler?: KarmaParcelBundler
) {
  const serveStaticMiddleware = serveStatic(path);

  const middleware: RequestHandler<any> = (req, res, next) => {
    const serve = () => serveStaticMiddleware(req, res, next);

    if (bundler) {
      bundler.whenBuild().then(serve);
    } else {
      setTimeout(serve);
    }
  };

  return middleware;
}
