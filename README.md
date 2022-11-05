# Karma Parcel

Use [parcel][] to preprocess [karma][] tests

## Install

To get all the needed packages:

```bash
npm i karma parcel karma-parcel -D
```

## Configure:

Add `parcel` to the frameworks to be used and to the files that should be preprocessed with it:

```js
module.exports = function (config) {
  config.set({
    frameworks: ["mocha", "parcel"],

    // add patterns with all your tests even if they should not
    // be handled by parcel
    files: [
      "tests/**/*.js",
      {
        // parcel tests should not be watched. Parcel will do the
        // watching instead
        pattern: "parcel/**/*.js",
        watched: false,
        included: false,
      },
    ],

    // let karma know which of the test files should be bundled
    // with parcel
    preprocessors: {
      "parcel/*": ["parcel"],
    },
  });
};
```

### `parcelConfig`

some more parcel specific configuration can be passed to the underlying parcel
instance via the `parcelConfig` attribute of your karma configuration:

```js
module.exports = function (config) {
  config.set({
    // lot of karma configuration
    parcelConfig: {
      cacheDir: "/path/to/cache", // default: "./.cache"
      detailedReport: true, // default: false,
      logLevel: "verbose",
    },
  });
};
```

## Under the hood

Parcel will create one bundle with all the files that are preprocessed with
the `parcel` preprocessor. The preprocessor will emit an empty file instead of
the actual content. The plugin will register a bundle file to karma's
fileList with `serve: false` in order not to be handled by karma's middleware.
To serve the bundled file, parcel's own middleware is registered and used

# Related

This plugin is heavily inspired by [`karma-browserify`][karma-browserify] and
[`karma-webpack`][karma-webpack].

[parcel]: https://parceljs.org/
[karma]: https://karma-runner.github.io
[karma-browserify]: https://github.com/nikku/karma-browserify
[karma-webpack]: https://github.com/webpack-contrib/karma-webpack
