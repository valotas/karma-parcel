// eslint-env mocha
import * as assert from "assert";
import type { Request, Response } from "express-serve-static-core";
import * as os from "os";
import * as path from "path";
import * as sinon from "sinon";
import * as bundler from "./KarmaParcelBundler";
import { EntryFile } from "./files";
import { KarmaConf, ParcelPlugin, KarmaServer } from "./plugin";
import type { KarmaFile, Logger } from "./types";
import * as serveStatic from "./serve-static";

class EmitterStub {
  refreshFile() {
    // do nothing
  }
}

function emitterStub() {
  return new EmitterStub() as any as KarmaServer;
}

describe("plugin", () => {
  let logger: Logger;
  let karmaConf: KarmaConf;

  beforeEach(() => {
    logger = {
      info: sinon.stub(),
      debug: sinon.stub(),
    };
    karmaConf = {
      autoWatch: false,
    } as KarmaConf;
  });

  afterEach(() => sinon.restore());

  it("exposes a ParcelPlugin", () => {
    assert.ok(ParcelPlugin);
  });

  it("exposes a factory", () => {
    assert.ok(ParcelPlugin.factory);
  });

  describe(ParcelPlugin.name, () => {
    describe("workspace()", () => {
      const cwd = os.tmpdir();

      beforeEach(() => {
        sinon.stub(process, "cwd").returns(cwd);
      });

      it("returns a workspace", () => {
        const plugin = new ParcelPlugin(logger, karmaConf, emitterStub());

        const workspace = plugin.workspace();

        assert.ok(workspace);
        assert.equal(workspace.toString(), "Workspace()");
      });

      it("only creates a workspace once", () => {
        const plugin = new ParcelPlugin(logger, karmaConf, emitterStub());

        const workspace1 = plugin.workspace();
        const workspace2 = plugin.workspace();

        assert.equal(workspace1, workspace2);
      });
    });

    describe("addFile", () => {
      it("writes the file to the underlying entry file", () => {
        const cwd = path.join(os.tmpdir(), `karma-parcel-test-${Date.now()}`);
        sinon.stub(process, "cwd").returns(cwd);
        const add = sinon.stub(EntryFile.prototype, "add").resolves();

        const plugin = new ParcelPlugin(logger, karmaConf, emitterStub());

        return plugin
          .addFile({
            originalPath: "/original/path",
            path: "/the/path",
            relativePath: "/relative/path",
            sourceMap: "sourceMaps",
          })
          .then(() => {
            sinon.assert.calledWith(add, "/original/path");
          });
      });
    });

    describe("preprocessor", () => {
      it("adds the specified file", () => {
        const plugin = new ParcelPlugin(logger, karmaConf, emitterStub());
        const addFile = sinon.stub(plugin, "addFile").resolves();
        const file: KarmaFile = {
          originalPath: "/originalPath",
          relativePath: "/relativePath",
          path: "/path",
          sourceMap: "/sourceMaps",
        };

        plugin.preprocessor("", file, sinon.stub());

        sinon.assert.calledOnce(addFile);
        sinon.assert.calledWith(addFile, file);
      });
    });

    describe("middleware", () => {
      const cwd = os.tmpdir();
      let plugin: ParcelPlugin;
      let req: Request;
      let resp: Response;
      let middleware: sinon.SinonStub;
      let createBundler: sinon.SinonStub<any, bundler.KarmaParcelBundler>;
      let bundlerInstance: any;
      let createServeStatic: sinon.SinonStub;

      beforeEach(() => {
        req = {} as Request;
        resp = {} as Response;
        middleware = sinon.stub();
        bundlerInstance = {
          start: sinon.stub(),
        };
        sinon.stub(process, "cwd").returns(cwd);
        plugin = new ParcelPlugin(logger, karmaConf, emitterStub());
        createBundler = sinon.stub(bundler, "createKarmaParcelBundler");
        createBundler.returns(bundlerInstance);
        createServeStatic = sinon.stub(serveStatic, "createParcelServeStatic");
        createServeStatic.returns(middleware);
      });

      describe("when req is not for parcel", () => {
        beforeEach(() => {
          req.url = "/some/random/path/to.js";
        });

        it("calls next", () => {
          const next = sinon.stub();
          plugin.middleware(req, resp, next);

          sinon.assert.calledOnce(next);
        });

        it("does not call bundler's middleware", () => {
          const next = sinon.stub();
          plugin.middleware(req, resp, next);

          sinon.assert.notCalled(middleware);
        });
      });

      describe("if url contains .karma-parcel", () => {
        beforeEach(() => {
          req.url = "/some/path/to/.karma-parcel/index.js";
        });

        it("creates a bundler", () => {
          plugin.middleware(req, resp, sinon.stub<any>());

          sinon.assert.calledOnce(createBundler);
        });

        it("creates a bundler for any resource containing .karma-parcel", () => {
          req.url = "/some/path/to/.karma-parcel/some/other/resource";

          plugin.middleware(req, resp, sinon.stub<any>());

          sinon.assert.calledOnce(createBundler);
        });

        it("creates a bundler with the entry as the entry point", () => {
          plugin.middleware(req, resp, sinon.stub<any>());

          sinon.assert.calledWithMatch(
            createBundler,
            sinon.match({
              entries: [
                path.join(cwd, ".karma-parcel", "__parcel_bundled_tests.js"),
              ],
            })
          );
        });

        it("creates the bundler with outDir the path of the created workspace", () => {
          plugin.middleware(req, resp, sinon.stub<any>());

          sinon.assert.calledWithMatch(createBundler, {
            targets: {
              main: sinon.match({
                distDir: path.join(cwd, ".karma-parcel/dist"),
              }),
            },
          });
        });

        it("creates the bundler with watch = true when karmaKonf.autoWatch is truthy", () => {
          karmaConf.autoWatch = true;

          plugin.middleware(req, resp, sinon.stub<any>());

          sinon.assert.calledWithMatch(createBundler, {
            watch: true,
          });
        });

        it("creates the bundler with the given karmaKonf.parcelConfig", () => {
          karmaConf.parcelConfig = {
            cacheDir: "/path/to/cache",
            detailedReport: null,
            logLevel: "warn",
          };

          plugin.middleware(req, resp, sinon.stub<any>());

          sinon.assert.calledWithMatch(createBundler, karmaConf.parcelConfig);
        });

        it("delegate request to the bundler's middleware", () => {
          const next = sinon.stub();
          plugin.middleware(req, resp, next);

          sinon.assert.calledOnce(middleware);
          sinon.assert.calledWith(middleware, req, resp, next);
        });

        it("delegate request to the bundler's middleware with the right req.url", () => {
          req.url = "/some/path/to/.karma-parcel/dist/other/resource";

          const next = sinon.stub();
          plugin.middleware(req, resp, next);

          sinon.assert.calledOnce(middleware);
          sinon.assert.calledWith(
            middleware,
            sinon.match.hasNested("url", "/other/resource"),
            resp,
            next
          );
        });

        it("creates the middleware only once", () => {
          const next = sinon.stub();

          plugin.middleware(req, resp, next);
          plugin.middleware(req, resp, next);
          plugin.middleware(req, resp, next);

          sinon.assert.calledOnce(createServeStatic);
        });
      });
    });
  });
});
