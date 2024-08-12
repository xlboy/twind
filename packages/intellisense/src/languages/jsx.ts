import type { IntellisenseContext, Boundary } from '../internal/types'

import type { ParsedDevRule } from '@twind/core'
import type { ColorInformation, Diagnostics, DocumentationAt } from '../types'
import { extractAllClasses, extractClassBoundaryAtOffset } from '../internal/class-extract-utils'
import { classStringMatcher } from 'class-string-matcher'

import { parse } from '@twind/core'
import { toClassName } from '../../../core/src/internal/to-class-name'

import { editabelColorRe, parseColor } from '../internal/color'
import { adjustRuleLocation } from '../internal/adjust-rule-location'

const defaultClassPrefixes = [
  // className='
  /class(Name)?\s*=\s*(?=['"{])/,
  // tw( tx`
  /t[wx]\s*(?=`|\()/,
]

export function documentationAt(
  content: string,
  offset: number,
  { isIgnored }: IntellisenseContext,
  options?: { prefixes?: Array<string | RegExp> },
): DocumentationAt | null {
  const intactBoundary = extractIntactBoundary(content, offset, { prefixes: options?.prefixes })
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
  options?: { prefixes?: Array<string | RegExp> },
): ColorInformation[] {
  const allClasses = extractAllClasses(content, 'jsx', {
    prefixes: [...defaultClassPrefixes, ...(options?.prefixes || [])],
  })
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
  options?: { prefixes?: Array<string | RegExp> },
): Boundary | null {
  const intactBoundary = extractClassBoundaryAtOffset(content, offset, 'jsx', {
    prefixes: [...defaultClassPrefixes, ...(options?.prefixes || [])],
  })

  return intactBoundary
}
