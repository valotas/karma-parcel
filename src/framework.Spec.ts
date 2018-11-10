// eslint-env mocha
import * as assert from "assert";
import * as sinon from "sinon";
import { createParcelFramework } from "./framework";
import { ParcelPlugin } from "./plugin";
import { KarmaLoggerFactory } from "./types";

describe("utils", () => {
  let logger: KarmaLoggerFactory;

  beforeEach(() => {
    logger = {
      create: sinon.stub().returns({
        info: sinon.stub(),
        debug: sinon.stub()
      })
    };
  });

  afterEach(() => sinon.restore());

  describe("createParcelFramework", () => {
    it("does nothing if no parcelFiles are given", () => {
      const files: any[] = [];
      const config = {
        files: JSON.parse(JSON.stringify(files))
      };
      createParcelFramework(logger, config, {} as ParcelPlugin);

      assert.ok(files);
      assert.ok(Array.isArray(files));
    });

    it("adds a parcel-bundle preprocessor when parcelFiles are given", () => {
      const plugin = {
        getBundlePath() {
          return "/path/to/bundle.parcel";
        }
      } as ParcelPlugin;
      const config: any = {
        parcelFiles: ["asd"]
      };
      createParcelFramework(logger, config, plugin);

      assert.ok(config.preprocessors);
      assert.equal(config.preprocessors["**/*.parcel"], "parcel-bundle");
    });

    it("adds the bundle file to the fileList", () => {
      const files: any[] = [];
      const bundleFile = "/path/to/bundle.parcel";
      const plugin = {
        getBundlePath() {
          return bundleFile;
        }
      } as ParcelPlugin;
      createParcelFramework(logger, { files, parcelFiles: ["asd"] }, plugin);

      assert.deepEqual(files, [bundleFile]);
    });
  });
});
