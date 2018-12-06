import Bundler = require("parcel-bundler");

export function bundle(entry: string, options: Bundler.ParcelOptions) {
  const bundler = new Bundler([entry], options);
  return bundler.bundle();
}
