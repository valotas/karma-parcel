import type { InitialParcelOptions, BuildEvent } from "@parcel/types";
import { Parcel } from "@parcel/core";
import { EventEmitter } from "stream";

export type ParcelBundlerOptions = InitialParcelOptions & {
  watch?: boolean;
};

export class KarmaParcelBundler {
  private delegate: Parcel;
  private options: ParcelBundlerOptions;
  private started: boolean = false;
  private emitter: EventEmitter;
  private buildPromise: Promise<any>;

  constructor(
    options: ParcelBundlerOptions,
    emitter: EventEmitter = new EventEmitter()
  ) {
    this.delegate = new Parcel({ ...options });
    this.options = options;
    this.emitter = emitter;

    this.buildPromise = new Promise((resolve, reject) => {
      emitter.once("parcel-build-event", (e: BuildEvent) => {
        if (e?.type === "buildSuccess") {
          resolve(e);
        } else {
          reject(new Error(`Could not bunlde`));
        }
      });
    });
  }

  whenBuild() {
    return this.buildPromise;
  }

  start() {
    if (this.started) {
      return;
    }
    this.started = true;

    if (this.options.watch) {
      this.delegate.watch((_, e) => this.emitParcelBuildEvent(e));
    } else {
      this.delegate.run().then((e) => this.emitParcelBuildEvent(e));
    }
  }

  private emitParcelBuildEvent(e?: BuildEvent) {
    this.emitter.emit("parcel-build-event", e);
  }
}

export function createKarmaParcelBundler(
  options: ParcelBundlerOptions,
  emitter?: EventEmitter
) {
  return new KarmaParcelBundler(options, emitter);
}
