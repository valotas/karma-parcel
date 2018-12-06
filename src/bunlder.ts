import Bundler = require("parcel-bundler");

export function bundle(
  entry: string,
  options: Bundler.ParcelOptions,
  onBuild = () => {}
) {
  const bundler = new Bundler([entry], options);
  (bundler as any).on("buildEnd", onBuild);
  return bundler.bundle();
}
