/**
 * Sourcemap comments registry
 * @type {Array<{ parent: Node, node: Node, before: Node }}
 */
let registry = []

/**
 * Save location of all sourcemap comments before removal
 */
export const createCommentRegistry = () => {
  const nodeIterator = document.createNodeIterator(document.body, NodeFilter.SHOW_COMMENT)
  registry = []
  let node

  while (node = nodeIterator.nextNode()) {
    // Find all sourcemap comments
    if (node.nodeType !== Node.COMMENT_NODE || !node.textContent.match(/ (BEGIN|END) /))
      return

    registry.push({
      parent: node.parentNode,
      node,
      before: node.nextSibling,
      path: node.textContent.match(/ (BEGIN|END) (.*) /)[2],
    })
  }

  return registry
}

/**
 * Remove all sourcemap comments from the DOM
 */
export const removeComments = () => {
  registry.forEach(({ node }) => node.parentNode.removeChild(node))
}

/**
 * Restore all sourcemap comments to the DOM
 */
export const restoreComments = () => {
  registry.forEach(({ node, parent, before }) => parent.insertBefore(node, before))
}

/**
 * Find injected comment by path
 * @param {string} path 
 */
export const hasRenderedFile = (path) => {
  return registry.some(({ path: commentPath }) => commentPath === path)
}

/**
 * Use source map comments to patch DOM tree
 */
export const useSourcemapMode = () => {
  return registry.length !== 0
}