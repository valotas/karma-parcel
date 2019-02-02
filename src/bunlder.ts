import Bundler = require("parcel-bundler");
import { EventEmitter } from "events";

export interface ParcelBundler extends Bundler, EventEmitter {
  middleware: () => any;
}

export function bundle(
  entry: string,
  options: Bundler.ParcelOptions,
  onBuild = () => {}
) {
  return createBundler(entry, options, onBuild).bundle();
}

export function createBundler(
  entry: string,
  options: Bundler.ParcelOptions,
  onBuild = () => {}
) {
  const bundler = new Bundler([entry], options) as ParcelBundler;
  bundler.on("buildEnd", onBuild);
  return bundler;
}
