import Bundler = require("parcel-bundler");
import { EventEmitter } from "events";
import { RequestHandler } from "express-serve-static-core";

export interface ParcelBundler extends Bundler, EventEmitter {
  middleware: () => RequestHandler;
}

export function createBundler(
  entry: string,
  options: Bundler.ParcelOptions & { hmr: boolean; autoinstall: boolean },
  onBuild = () => {}
) {
  const bundler = new Bundler([entry], options) as ParcelBundler;
  bundler.on("buildEnd", onBuild);
  return bundler;
}
