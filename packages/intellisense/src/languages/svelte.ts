import type { IntellisenseContext, Boundary } from '../internal/types'

import type { ParsedDevRule } from '@twind/core'
import type {
  ClassExtractionOptions,
  ColorInformation,
  Diagnostics,
  DocumentationAt,
} from '../types'
import { extractAllClasses, extractClassBoundaryAtOffset } from '../internal/class-extract-utils'

import { parse } from '@twind/core'
import { toClassName } from '../../../core/src/internal/to-class-name'

import { editabelColorRe, parseColor } from '../internal/color'
import { adjustRuleLocation } from '../internal/adjust-rule-location'

const defaultClassPrefixes = [
  // className='
  /class\s*=\s*(?=['"{])/,
  // tw( tx`
  /t[wx]\s*(?=`|\))/,
  // apply` apply()
  /apply\s*(?=`|\))/,
  // apply.card` apply.card()
  /apply\s*\.\s*[^`(]*(?=`|\))/,
  // apply['card']` apply['card']()
  /apply\s*\[[^`(]*(?=`|\))/,
]
const defaultIgnorePrefixes = [/css\s*(?=`)/]

export function documentationAt(
  content: string,
  offset: number,
  { isIgnored }: IntellisenseContext,
  options?: Partial<ClassExtractionOptions>,
): DocumentationAt | null {
  const intactBoundary = extractIntactBoundary(content, offset, {
    prefixes: options?.prefixes,
    ignorePrefixes: options?.ignorePrefixes,
  })
  if (!intactBoundary) return null

  let result: DocumentationAt | null = null
  const rules = parse(intactBoundary.content) as ParsedDevRule[]

  for (const rule of rules) {
    const start = intactBoundary.start + rule.l[0]
    const end = intactBoundary.start + rule.l[1]

    if (start <= offset && offset < end) {
      if (isIgnored(rule.n)) continue
      result = {
        ...adjustRuleLocation(intactBoundary.content, rule, intactBoundary.start),
        value: toClassName(rule),
      }
    }
  }

  return result
}

export function collectColors(
  content: string,
  { classes, isIgnored }: IntellisenseContext,
  options?: Partial<ClassExtractionOptions>,
): ColorInformation[] {
  const allClasses = extractAllClasses(content, 'svelte', {
    prefixes: [...defaultClassPrefixes, ...(options?.prefixes || [])],
    ignorePrefixes: [...defaultIgnorePrefixes, ...(options?.ignorePrefixes || [])],
  })
  const allDirectives: Boundary[] = [...content.matchAll(/class:([^\s=]+)\s*=?\s*\{?/g)].map(
    (match) => {
      const content = match[1]
      const start = match.index + 6 // 6 is the length of `class:`
      const end = start + content.length
      return { content, start, end }
    },
  )
  allClasses.push(...allDirectives)

  if (allClasses.length === 0) return []

  const colors: ColorInformation[] = []

  for (const classBoundary of allClasses) {
    const rules = parse(classBoundary.content) as ParsedDevRule[]

    for (const rule of rules) {
      if (isIgnored(rule.n)) continue

      const completion = classes.get(rule.n)

      if (completion?.color) {
        const color = parseColor(completion.color)

        if (color) {
          colors.push({
            ...adjustRuleLocation(classBoundary.content, rule, classBoundary.start),
            value: completion.color,
            rgba: color,
          })

          continue
        }
      }

      const editableMatch = rule.n.match(editabelColorRe)

      if (editableMatch) {
        const { 1: currentColor } = editableMatch
        const color = parseColor(currentColor)

        if (color) {
          colors.push({
            ...adjustRuleLocation(classBoundary.content, rule, classBoundary.start),
            value: currentColor,
            rgba: color,
            editable: true,
          })

          continue
        }
      }
    }
  }

  return colors
}

export function validate(
  content: string,
  { variants, classes, isIgnored, generateCSS }: IntellisenseContext,
): Diagnostics[] {
  return []
}

export function extractIntactBoundary(
  content: string,
  offset: number,
  options?: Partial<ClassExtractionOptions>,
): Boundary | null {
  const nearestDirectiveStartIndex = content.slice(0, offset).search(/class:[^\s]+$/)

  // If nearestDirectiveStartIndex === -1, it means the current position is not within a class:xxxx={boolean} structure
  if (nearestDirectiveStartIndex === -1) {
    return extractClassBoundaryAtOffset(content, offset, 'svelte', {
      prefixes: [...defaultClassPrefixes, ...(options?.prefixes || [])],
      ignorePrefixes: [...defaultIgnorePrefixes, ...(options?.ignorePrefixes || [])],
    })
  }

  // Logic to handle the class:xxxx={boolean} structure
  const directiveClassMatch = content
    .slice(nearestDirectiveStartIndex)
    .match(/^class:([^\s]+)\s*=\s*{/)
  if (directiveClassMatch) {
    const directiveClassName = directiveClassMatch[1]
    const start = nearestDirectiveStartIndex + 6 // 6 is the length of "class:"
    const end = start + directiveClassName.length
    return {
      start,
      end,
      content: directiveClassName,
    }
  }

  // If no match is found, return null or handle accordingly
  return null
}
