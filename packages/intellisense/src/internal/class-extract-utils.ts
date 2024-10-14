import {
  type ClassNode,
  classStringMatcher,
  type LanguageId as CSMLanguageId,
} from 'class-string-matcher'
import type { Boundary } from './types'
import type { ClassExtractionOptions } from '../types'

interface MatchResult {
  startIndex: number
  endIndex: number
  matchedText: string
}

export function _findLastRegexBeforeIndex(
  text: string,
  regex: RegExp,
  index: number,
): MatchResult | null {
  let match: RegExpExecArray | null
  let lastMatch: MatchResult | null = null
  const step = 100

  if (!regex.global) {
    regex = new RegExp(regex.source, regex.flags + 'g')
  }

  let i = index
  while (i > 0) {
    const searchRange = text.slice(Math.max(0, i - step), index)

    while ((match = regex.exec(searchRange)) !== null) {
      const [matchedText] = match
      const searchPos = { s: match.index, e: match.index + matchedText.length }
      const leftContentLength = index - searchRange.length

      lastMatch = {
        startIndex: leftContentLength + searchPos.s,
        endIndex: leftContentLength + searchPos.e,
        matchedText,
      }
    }

    if (lastMatch || i <= step) break

    i -= step
  }

  return lastMatch
}

/**
 * @example
 * `...<prefix><body>`
 */
function _getBodyStartIndexByPrefix(
  content: string,
  prefix: string | RegExp,
  offset: number,
): number {
  if (typeof prefix === 'string') {
    const index = content.lastIndexOf(prefix, offset)
    return index !== -1 ? index + prefix.length : -1
  } else {
    const match = _findLastRegexBeforeIndex(content, prefix, offset)
    return match ? match.endIndex : -1
  }
}

export function extractClassBoundaryAtOffset(
  content: string,
  offset: number,
  csmLanguageId: CSMLanguageId,
  options: ClassExtractionOptions,
): Boundary | null {
  let boundary: Boundary | null = null
  for (const prefix of options.prefixes) {
    const bodyStartIndex = _getBodyStartIndexByPrefix(content, prefix, offset)
    if (bodyStartIndex === -1) continue

    const body = content.slice(bodyStartIndex)

    let classNodes: ClassNode[] = []
    if (csmLanguageId === 'vue') {
      const inDynamicContext =
        /:class\s*=\s*$/.test(content.slice(0, bodyStartIndex)) || /^[`(]/.test(body)
      classNodes = classStringMatcher(body, 'vue', { inDynamicContext })
    } else {
      classNodes = classStringMatcher(body, csmLanguageId)
    }

    const targetNode = classNodes.find(({ pos, text }) => {
      const start = bodyStartIndex + pos.s
      const end = bodyStartIndex + pos.e
      return start <= offset && end >= (text === '' ? offset : offset - 1)
    })

    if (targetNode) {
      const ignoredBoundary = extractClassBoundaryAtOffset(
        body,
        offset - bodyStartIndex,
        csmLanguageId,
        { prefixes: options.ignorePrefixes, ignorePrefixes: [] },
      )
      const isIgnored =
        ignoredBoundary?.start === targetNode.pos.s && ignoredBoundary?.end === targetNode.pos.e
      if (isIgnored) {
        boundary = null
        continue
      }

      const boundaryStart = bodyStartIndex + targetNode.pos.s
      const boundaryEnd = bodyStartIndex + targetNode.pos.e
      const currentBoundary =
        targetNode.text === ''
          ? { content: '', start: boundaryStart, end: boundaryStart }
          : { content: targetNode.text, start: boundaryStart, end: boundaryEnd }

      if (boundary) {
        if (boundary.start < currentBoundary.start) {
          boundary = currentBoundary
        }
      } else {
        boundary = currentBoundary
      }
    }
  }
  return boundary
}

export function extractAllClasses(
  content: string,
  csmLanguageId: CSMLanguageId,
  options: ClassExtractionOptions,
): Boundary[] {
  const normalClasses = get(options.prefixes)
  const ignoredClasses = get(options.ignorePrefixes)

  const classes = normalClasses.filter(
    (normalClass) =>
      !ignoredClasses.some(
        (ignoredClass) =>
          normalClass.start === ignoredClass.start && normalClass.end === ignoredClass.end,
      ),
  )

  return classes

  function get(prefixes: Array<string | RegExp>) {
    const classes: Boundary[] = []
    const existingClasses = new Set</* start-end */ string>()

    for (const prefix of prefixes) {
      let offset = content.length

      while (offset > 0) {
        const bodyStartIndex = _getBodyStartIndexByPrefix(content, prefix, offset)
        if (bodyStartIndex === -1) break

        const body = content.slice(bodyStartIndex)
        let classNodes: ClassNode[] = []
        if (csmLanguageId === 'vue') {
          const inDynamicContext =
            /:class\s*=\s*$/.test(content.slice(0, bodyStartIndex)) || /^[`(]/.test(body)
          classNodes = classStringMatcher(body, 'vue', { inDynamicContext })
        } else {
          classNodes = classStringMatcher(body, csmLanguageId)
        }
        for (let i = classNodes.length - 1; i >= 0; i--) {
          const { pos, text } = classNodes[i]
          const boundaryStart = bodyStartIndex + pos.s
          const boundaryEnd = bodyStartIndex + pos.e
          const boundaryId = `${boundaryStart}-${boundaryEnd}`

          if (existingClasses.has(boundaryId)) continue

          classes.push(
            text === ''
              ? { content: '', start: boundaryStart, end: boundaryStart }
              : { content: text, start: boundaryStart, end: boundaryEnd },
          )
          existingClasses.add(boundaryId)
        }

        offset = bodyStartIndex - 1
      }
    }
    return classes.reverse()
  }
}
