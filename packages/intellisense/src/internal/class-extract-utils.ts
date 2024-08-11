import { classStringMatcher, LanguageId as CSMLanguageId } from 'class-string-matcher'
import { Boundary } from './types'

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
  options: {
    prefixes: Array<string | RegExp>
  },
): Boundary | null {
  for (const prefix of options.prefixes) {
    const bodyStartIndex = _getBodyStartIndexByPrefix(content, prefix, offset)
    if (bodyStartIndex === -1) continue

    const body = content.slice(bodyStartIndex)
    const classNodes = classStringMatcher(body, csmLanguageId)
    const targetNode = classNodes.find(({ pos, text }) => {
      const start = bodyStartIndex + pos.s
      const end = bodyStartIndex + pos.e
      return text === '' ? start <= offset && end >= offset : start <= offset && end >= offset - 1
    })

    if (targetNode) {
      const start = bodyStartIndex + targetNode.pos.s
      const end = bodyStartIndex + targetNode.pos.e
      return targetNode.text === ''
        ? { content: '', start, end: start }
        : { content: targetNode.text, start, end }
    }
  }
  return null
}

export function extractAllClasses(
  content: string,
  csmLanguageId: CSMLanguageId,
  options: {
    prefixes: Array<string | RegExp>
  },
): Boundary[] {
  const classes: Boundary[] = []
  const existingClasses = new Set</* start-end */ string>()

  for (const prefix of options.prefixes) {
    let offset = content.length

    while (offset > 0) {
      const bodyStartIndex = _getBodyStartIndexByPrefix(content, prefix, offset)
      if (bodyStartIndex === -1) break

      const body = content.slice(bodyStartIndex)
      const classNodes = classStringMatcher(body, csmLanguageId)
      for (let i = classNodes.length - 1; i >= 0; i--) {
        const { pos, text } = classNodes[i]
        const start = bodyStartIndex + pos.s
        const end = bodyStartIndex + pos.e
        const key = `${start}-${end}`

        if (existingClasses.has(key)) continue

        classes.push(
          text === '' ? { content: '', start, end: start } : { content: text, start, end },
        )
        existingClasses.add(key)
      }

      offset = bodyStartIndex - 1
    }
  }
  return classes.reverse()
}
