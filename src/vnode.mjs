import { toVNode } from 'snabbdom'

/**
 * Create local vnode tree of the content between BEGIN/END sourcemap comments
 * @param {Node} beginComment BEGIN comment node
 * @param {string} hmrFilePath Path to the file that is being updated
 */
const createLocalVNodeTree = (beginComment, hmrFilePath) => {
  const parentNode = beginComment.parentNode
  const siblingNodes = parentNode.childNodes
  const beginCommentIndex = Array.from(siblingNodes).findIndex(child => child === beginComment)
  
  let endCommentIndex

  // Find the next END comment (may be many under the same parent)
  for (let i = beginCommentIndex + 1; i < siblingNodes.length; i++) {
    endCommentIndex = i
    const isEndComment = siblingNodes[i].nodeType === Node.COMMENT_NODE && siblingNodes[i].textContent.match(`END ${hmrFilePath}`)
    
    if (isEndComment)
      break
  }

  // Create vnode of parent (required for patching)
  const parentVNode = toVNode(parentNode)
  // Remove all irrelevant siblings not in the updated file
  parentVNode.children = parentVNode.children.slice(beginCommentIndex, endCommentIndex + 1)

  return parentVNode
}

/**
 * Find nodes injected by the updated HMR file and create vnode tree
 * @param {HTMLElement} rootElement Root element, usually document.body
 * @param {string} hmrFilePath Path to the file that is being updated
 * @returns List of local vnode trees where the content may have changed
 */
export const createIsolatedVnode = (rootElement, hmrFilePath) => {
  const nodeIterator = document.createNodeIterator(rootElement, NodeFilter.SHOW_COMMENT);
  const vnodes = []
  let beginComment

  // Find one or many placed where the update view/partial was rendered
  while (beginComment = nodeIterator.nextNode()) {
    const isBeginComment = beginComment.textContent.match(`BEGIN ${hmrFilePath}`)

    if (isBeginComment)
      // Try to find content in between begin and end comments and save the vnode
      vnodes.push(createLocalVNodeTree(beginComment, hmrFilePath))
  }

  return vnodes
}