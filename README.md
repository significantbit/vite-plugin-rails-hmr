# @sigbit/vite-plugin-rails-hmr
> Experimental HMR for Rails templates

## How does it work?
If a template file is changed, the current page will be re-fetched in the background and patched using `snabbdom` to support partial DOM updates. This plugin will use file tracing comments injected by the [view_source_map](https://github.com/r7kamura/view_source_map) gem to isolate DOM patches. The plugin also works without the gem, but without DOM isolation.

## Get started
```sh
$ yarn add significantbit/vite-plugin-rails-hmr -D
$ bundle add view_source_map --group=development
```

`vite.config.js`
```js
import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import RailsHmrPlugin from '@sigbit/vite-plugin-rails-hmr'

export default defineConfig({
  plugins: [
    RubyPlugin(),
    RailsHmrPlugin({
      // Default options
      files: ['app/**/*.{html,erb}']
    }),
  ],
})
```

`app/frontend/entrypoints/application.js`
```js
import 'virtual:rails-hmr'
```