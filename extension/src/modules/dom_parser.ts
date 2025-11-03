import type { DomNode } from '../types'

const IGNORED_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK'])

let nodeCounter = 0

function nextNodeId (): string {
  nodeCounter += 1
  return `node-${nodeCounter}`
}

function normalizeText (text: string | null): string | undefined {
  if (text == null) return undefined
  const normalized = text.replace(/\s+/g, ' ').trim()
  return normalized.length > 0 ? normalized : undefined
}

function extractBoundingBox (element: Element): DomNode['bbox'] {
  const rect = element.getBoundingClientRect()
  return [rect.left, rect.top, rect.right, rect.bottom]
}

function createDomNode (element: Element): DomNode {
  const nodeId = element.getAttribute('data-genaccess-id') ?? nextNodeId()
  element.setAttribute('data-genaccess-id', nodeId)

  const domNode: DomNode = {
    nodeId,
    tag: element.tagName.toLowerCase(),
    role: element.getAttribute('role') ?? undefined,
    text: normalizeText(element.textContent),
    bbox: extractBoundingBox(element),
    attributes: {},
    children: []
  }

  for (const { name, value } of Array.from(element.attributes)) {
    if (name === 'data-genaccess-id') continue
    domNode.attributes[name] = value
  }

  return domNode
}

export function collectDomTree (root: Document | Element = document): DomNode {
  nodeCounter = 0
  const target = root instanceof Document ? (root.documentElement ?? document.body) : root
  if (target == null) {
    return {
      nodeId: 'root',
      tag: 'body',
      attributes: {},
      children: []
    }
  }

  function traverse (element: Element): DomNode | null {
    if (IGNORED_TAGS.has(element.tagName)) return null

    const node = createDomNode(element)
    const children: DomNode[] = []

    for (const child of Array.from(element.children)) {
      const parsed = traverse(child)
      if (parsed != null) {
        children.push(parsed)
      }
    }

    node.children = children
    return node
  }

  return traverse(target) ?? {
    nodeId: 'root',
    tag: target.tagName.toLowerCase(),
    attributes: {},
    children: []
  }
}

export function serializeDom (): { tree: DomNode; timestamp: number } {
  const tree = collectDomTree()
  return {
    tree,
    timestamp: Date.now()
  }
}

