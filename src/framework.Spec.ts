// eslint-env mocha
import * as assert from "assert";
import * as sinon from "sinon";
import * as files from "./files";
import { createParcelFramework } from "./framework";
import { ParcelPlugin } from "./plugin";
import { KarmaLoggerFactory } from "./types";

describe("framework", () => {
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
    it("adds the bundle file to the fileList", done => {
      const configFiles: any[] = [];
      const bundleFile = "/path/to/bundle.parcel";
      sinon.stub(files, "createBundleFile").returns({ path: bundleFile });
      const plugin = { setBundleFile: sinon.stub() };

      createParcelFramework(
        logger,
        { files: configFiles },
        (plugin as any) as ParcelPlugin
      );

      setImmediate(() => {
        assert.deepEqual(configFiles, [
          {
            included: true,
            pattern: bundleFile,
            served: true,
            watched: true
          }
        ]);
        done();
      });
    });
  });
});
