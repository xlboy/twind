import type { IntellisenseContext, Boundary } from '../internal/types'

import type { ParsedDevRule } from '@twind/core'
import type { ColorInformation, Diagnostics, DocumentationAt } from '../types'

import csstreeParse from 'css-tree/parser'
import csstreeWalk from 'css-tree/walker'
import csstreeGenerate from 'css-tree/generator'

import { parse } from '@twind/core'
import { fixClassList, parseHTML } from '../../../core/src/internal/parse-html'
import { toClassName } from '../../../core/src/internal/to-class-name'

import { editabelColorRe, parseColor } from '../internal/color'
import { adjustRuleLocation } from '../internal/adjust-rule-location'

export function documentationAt(
  content: string,
  offset: number,
  { isIgnored }: IntellisenseContext,
): DocumentationAt | null {
  return null
}

export function collectColors(
  content: string,
  { classes, isIgnored }: IntellisenseContext,
): ColorInformation[] {
  return []
}

export function validate(
  content: string,
  { variants, classes, isIgnored, generateCSS }: IntellisenseContext,
): Diagnostics[] {
  return []
}

export function extractBoundary(content: string, position: number): Boundary | null {
  const attributes = ['className', 'classNames', 'class']
  // [
  //   /className\s*/
  // ]
  return null
}
