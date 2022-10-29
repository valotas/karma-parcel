import assert = require("assert");
import { EventEmitter } from "stream";
import { KarmaParcelBundler } from "./KarmaParcelBundler";

describe("KarmaParcelBundler", () => {
  it("is exported", () => {
    assert.ok(KarmaParcelBundler);
  });

  it("is created without an emitter", () => {
    assert.ok(new KarmaParcelBundler({ watch: true }));
  });

  describe("whenBuild", () => {
    let emitter: EventEmitter;
    let bundler: KarmaParcelBundler;

    beforeEach(() => {
      emitter = new EventEmitter();
      bundler = new KarmaParcelBundler({ watch: true }, emitter);
    });

    it("is a function", () => {
      assert.ok(bundler.whenBuild);
      assert.equal(typeof bundler.whenBuild, "function");
    });

    it("returns a promise", () => {
      assert.equal(bundler.whenBuild() instanceof Promise, true);
    });

    it("returns a promise that is resolved on buildSuccess", (done) => {
      bundler.whenBuild().then(() => done());
      emitter.emit("parcel-build-event", { type: "buildSuccess" });
    });

    it("returns a promise that is resolved only after buildSuccess", (done) => {
      const start = Date.now();

      bundler.whenBuild().then(() => {
        const end = Date.now();
        if (end - start < 100) {
          done(new Error(`whenBuild() resolved too quickly: ${end - start}ms`));
        } else {
          done();
        }
      });

      setTimeout(() => {
        emitter.emit("parcel-build-event", { type: "buildSuccess" });
      }, 100);
    });

    it("returns the same promise if buildSuccess is not emitted", () => {
      const promise1 = bundler.whenBuild();
      const promise2 = bundler.whenBuild();

      assert.equal(promise1, promise2);
    });
  });
});
