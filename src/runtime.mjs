import { createCommentRegistry, removeComments, hasRenderedFile } from './sourcemap'
import { useSourcemapMode } from './sourcemap'
import { patchBody, patchWithSourcemap } from './patch'

export const setup = () => {
  // Create registry of <!-- BEGIN file/path.html.erb --> comments
  createCommentRegistry()

  // Remove all comments to reduce noise in the console
  removeComments()
}

/**
 * Patch DOM tree on incoming HMR event
 * @param {any} payload 
 */
export const patchDOM = ({ path }) => {
  const sourcemapMode = useSourcemapMode()
  if (sourcemapMode && !hasRenderedFile(path))
    return

  fetch(location.href)
    .then(response => response.text())
    .then(response => {
      // Parse HTML to Document object
      const parser = new DOMParser()
      const newDocument = parser.parseFromString(response, 'text/html')
      
      if (sourcemapMode)
        return patchWithSourcemap(newDocument, path)
      else
        return patchBody(newDocument, path)
    })
    .then(vnode => {
      // Tell server that DOM has been patched
      if (vnode)
        import.meta.hot.send('rails-hmr:patched')
    })
}