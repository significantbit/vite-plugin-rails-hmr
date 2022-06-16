import {
  classModule,
  propsModule,
  datasetModule,
  attributesModule,
  styleModule,
  eventListenersModule,
  init,
  toVNode,
} from 'snabbdom'
import { isEqual } from 'lodash-es'
import { createCommentRegistry, restoreComments, removeComments } from './sourcemap'
import { createIsolatedVnode } from './vnode'

// Setup virtual representation of DOM tree
const patch = init([
  classModule,
  propsModule,
  datasetModule,
  attributesModule,
  styleModule,
  eventListenersModule,
])

/**
 * Patch DOM tree using sourcemap comments
 * @param {Document} newDocument New DOM document
 * @param {string} path Path of the file that has been updated
 */
export const patchBody = (newDocument, path) => {
  const vnode = toVNode(document.body)
  const newVnode = toVNode(newDocument.body)

  patch(vnode, newVnode)
  return !isEqual(vnode, newVnode)
}

/**
 * Patch DOM tree using sourcemap comments
 * @param {Document} newDocument New DOM document
 * @param {string} path Path of the file that has been updated
 */
 export const patchWithSourcemap = (newDocument, path) => {
  // Temporarily restore all sourcemap comments
  restoreComments()

  // Create virtual representation old and new local DOM tree
  const vnodes = createIsolatedVnode(document.body, path)
  const newVnodes = createIsolatedVnode(newDocument.body, path)
  
  // Unclear how to patch this case
  if (vnodes.length !== newVnodes.length) {
    console.error('Cannot patch DOM tree, performing full reload')
    location.reload()
  }

  // Patch DOM tree
  vnodes.forEach((vnode, index) => patch(vnode, newVnodes[index]))

  // Update comment registry
  createCommentRegistry()
  // Remove comments again
  removeComments()

  // If anything was patched
  return vnodes.length > 0
}