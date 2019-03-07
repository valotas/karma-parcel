// eslint-env mocha
import * as assert from "assert";
import { Request, Response } from "express-serve-static-core";
import * as os from "os";
import * as path from "path";
import * as sinon from "sinon";
import * as bundler from "./bunlder";
import { EntryFile } from "./files";
import {
  createParcelPlugin,
  KarmaConf,
  ParcelPlugin,
  KarmaServer
} from "./plugin";
import { KarmaFile, Logger } from "./types";
import karma = require("karma");

class EmitterStub {
  refreshFile() {
    // do nothing
  }
}

function emitterStub() {
  return (new EmitterStub() as any) as KarmaServer;
}

describe("plugin", () => {
  let logger: Logger;
  let karmaConf: KarmaConf;

  beforeEach(() => {
    logger = {
      info: sinon.stub(),
      debug: sinon.stub()
    };
    karmaConf = {
      autoWatch: false
    } as KarmaConf;
  });

  afterEach(() => sinon.restore());

  it("exposes a ParcelPlugin", () => {
    assert.ok(ParcelPlugin);
  });

  it("exposes a factory", () => {
    assert.ok(createParcelPlugin);
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
            sourceMap: "sourceMaps"
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
          sourceMap: "/sourceMaps"
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
      let createBundler: sinon.SinonStub<any, bundler.ParcelBundler>;
      let bundlerInstance: any;

      beforeEach(() => {
        req = {} as Request;
        resp = {} as Response;
        middleware = sinon.stub();
        bundlerInstance = { middleware: () => middleware };
        sinon.stub(process, "cwd").returns(cwd);
        plugin = new ParcelPlugin(logger, karmaConf, emitterStub());
        createBundler = sinon.stub(bundler, "createBundler");
        createBundler.returns(bundlerInstance);
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
          plugin.middleware(req, resp, sinon.stub());

          sinon.assert.calledOnce(createBundler);
        });

        it("creates a bundler with the entry.js as the entry point", () => {
          plugin.middleware(req, resp, sinon.stub());

          sinon.assert.calledWithMatch(
            createBundler,
            path.join(cwd, ".karma-parcel", "entry.js")
          );
        });

        it("creates the bundler with outDir the path of the created workspace", () => {
          plugin.middleware(req, resp, sinon.stub());

          sinon.assert.calledWithMatch(createBundler, sinon.match.any, {
            outDir: path.join(cwd, ".karma-parcel")
          });
        });

        it("creates the bundler with outFile the bundleFile of the created workspace", () => {
          plugin.middleware(req, resp, sinon.stub());

          sinon.assert.calledWithMatch(createBundler, sinon.match.any, {
            outFile: path.join(cwd, ".karma-parcel", "index.js")
          });
        });

        it("creates the bundler with publicUrl = /karma-parcel", () => {
          plugin.middleware(req, resp, sinon.stub());

          sinon.assert.calledWithMatch(createBundler, sinon.match.any, {
            publicUrl: "/karma-parcel"
          });
        });

        it("creates the bundler with hmr = false", () => {
          plugin.middleware(req, resp, sinon.stub());

          sinon.assert.calledWithMatch(createBundler, sinon.match.any, {
            hmr: false
          });
        });

        it("creates the bundler with watch = true when karmaKonf.autoWatch is truthy", () => {
          karmaConf.autoWatch = true;

          plugin.middleware(req, resp, sinon.stub());

          sinon.assert.calledWithMatch(createBundler, sinon.match.any, {
            watch: true
          });
        });

        it("delegate request to the bundler's middleware", () => {
          const next = sinon.stub();
          plugin.middleware(req, resp, next);

          sinon.assert.calledOnce(middleware);
          sinon.assert.calledWith(middleware, req, resp, next);
        });

        it("creates the middleware only once", () => {
          const next = sinon.stub();
          const createMiddleware = sinon.spy(bundlerInstance, "middleware");

          plugin.middleware(req, resp, next);
          plugin.middleware(req, resp, next);
          plugin.middleware(req, resp, next);

          sinon.assert.calledOnce(createMiddleware);
        });

        it("adapts the req.url before passing it to the bunlder middleware", () => {
          req.url = "/some/path/to/.karma-parcel/index.js";
          const next = sinon.stub();

          plugin.middleware(req, resp, next);

          sinon.assert.calledWithMatch(middleware, {
            url: "/karma-parcel/index.js"
          });
        });
      });
    });
  });
});
