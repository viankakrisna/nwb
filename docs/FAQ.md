## Frequently Asked Questions

### How do I enable CSS Modules?

Use `nwb.config.js` to configure the [default `css` rule for your app's own styles](/docs/Configuration.md#default-rules) with the necessary [css-loader `option` parameters](https://github.com/webpack/css-loader#local-scope):

```js
module.exports = {
  webpack: {
    rules: {
      css: {
        modules: true,
        localIdentName: (
          process.env.NODE_ENV === 'production'
            ? '[path][name]-[local]-[hash:base64:5]'
            : '[hash:base64:5]'
        )
      }
    }
  }
}
```

### Why am I seeing `.json.gzip` files in my project root?

Are you running as root on a Mac, or in a Docker container?

npm appers to [set the working directory as the temporary directory](https://github.com/npm/npm/issues/4531) in these scenarios and babel-loader writes to the temporary directory to cache results for performance.

### What can I configure to reduce bundle size?

If you don't need the `Promise`, `fetch` and `Object.assign` polyfills nwb provides by default, configuring [`polyfill: false`](/docs/Configuration.md#polyfill-boolean) will shave ~4KB off the gzipped vendor bundle.

Configuring [`webpack.extractText.allChunks: true`](/docs/Configuration.md#extracttext-object) will shave ~1.25KB off the gzipped vendor bundle by excluding the runtime for Webpack's style-loader.

If you're using destructuring imports with libraries like React Router and React Bootstrap (e.g. `import {Button} from 'react-bootstrap'`), you're bundling the whole library, instead of just the bits you need. Try configuring [`babel.cherryPick`](/docs/Configuration.md#cherrypick-string--arraystring) for these libraries to only bundle the modules you actually use.
