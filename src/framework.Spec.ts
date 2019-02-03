// eslint-env mocha
import * as assert from "assert";
import * as sinon from "sinon";
import { createParcelFramework } from "./framework";
import { ParcelPlugin } from "./plugin";
import { KarmaLoggerFactory } from "./types";

function fakePlugin({
  middleware,
  bundleFile = "/path/to/bundle"
}: {
  middleware?: any;
  bundleFile: string;
}) {
  return {
    workspace() {
      return { bundleFile };
    },
    middleware() {
      return middleware;
    },
    isWatching() {
      return false;
    }
  };
}

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

      const plugin = fakePlugin({ bundleFile });

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
            served: false,
            watched: false
          }
        ]);
        done();
      });
    });

    it("adds the parcel middleware if middleware does not exists", done => {
      const conf = {
        configFiles: []
      } as any;
      const middleware = sinon.stub();
      const plugin = fakePlugin({ middleware, bundleFile: "/path" });

      createParcelFramework(logger, conf, (plugin as any) as ParcelPlugin);

      setImmediate(() => {
        assert.deepEqual(conf.middleware, ["parcel"]);
        done();
      });
    });

    it("mutates the existing middleware array", done => {
      const conf = {
        middleware: ["middleware1"]
      };
      const middleware = sinon.stub();
      const plugin = fakePlugin({ middleware, bundleFile: "/path" });

      createParcelFramework(logger, conf, (plugin as any) as ParcelPlugin);

      setImmediate(() => {
        assert.deepEqual(conf.middleware, ["middleware1", "parcel"]);
        done();
      });
    });

    it("makes sure that the middleware conf is an array", done => {
      const conf = {
        middleware: "middleware1"
      };
      const middleware = sinon.stub();
      const plugin = fakePlugin({ middleware, bundleFile: "/path" });

      createParcelFramework(logger, conf, (plugin as any) as ParcelPlugin);

      setImmediate(() => {
        assert.deepEqual(conf.middleware, ["middleware1", "parcel"]);
        done();
      });
    });
  });
});
