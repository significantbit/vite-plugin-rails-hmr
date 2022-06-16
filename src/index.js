const { resolve, relative } = require('path')
const picomatch = require('picomatch')

// Track CSS files imported in the application
const cssFiles = new Set()

/** @returns {import('vite').PluginOption} */
module.exports = (options) => ({
  name: '@sigbit/vite-rails-hmr',
  apply: 'serve',

  /**
   * Configure server
   * @param {import('vite').ViteDevServer} app 
   */
  configureServer ({ config: { root }, watcher, ws }) {
    const defaultOptions = {
      files: ['app/**/*.{html,erb}'],
    }
    const opt = Object.assign(defaultOptions, options)

    const files = Array.from(opt.files).map(file => resolve(process.cwd(), file))
    const isValidFile = picomatch(files)

    const onFileChange = (path) => {
      if (!isValidFile(path))
        return

      // Send custom HMR event to be handled by patch.mjs
      const appPath = relative(process.cwd(), path)
      ws.send({
        type: 'custom',
        event: 'rails-hmr:update',
        data: { path: appPath }
      })
    }

    watcher.add(files)
    watcher.on('add', onFileChange)
    watcher.on('change', throttle(onFileChange, 500))

    // On successful DOM patch
    ws.on('rails-hmr:patched', () => {
       // Trigger HMR change on imported CSS files to support JIT compilers
      cssFiles.forEach(file => {
        const path = `/${relative(root, file)}`

        ws.send({
          type: 'update',
          updates: [
            {
              type: 'js-update',
              timestamp: Math.floor(Date.now() / 1000),
              path: path,
              acceptedPath: path,
            }
          ]
        })
      })
    })
  },

  /**
   * Register virtual module
   * @param {string} id
   */
  resolveId: (id) => {
    if (id === 'virtual:rails-hmr')
      return id
  },

  /**
   * Resolve virtual module
   * @param {string} id
   */
  load: (id) => {
    if (id === 'virtual:rails-hmr')
      return `
        import { setup, patchDOM } from '@sigbit/vite-plugin-rails-hmr/runtime'

        if (import.meta.hot) {
          setup()
          import.meta.hot.on('rails-hmr:update', patchDOM)
        }
      `

    if (id.endsWith('.css'))
      cssFiles.add(id)
  },
})

/**
 * Throttle function call
 * @param {Function} callback
 * @param {number} delay
 */
function throttle(callback, delay) {
  let shouldWait = false

  return (...args) => {
    if (shouldWait)
      return

    callback(...args)
    shouldWait = true
    setTimeout(() => shouldWait = false, delay)
  }
}