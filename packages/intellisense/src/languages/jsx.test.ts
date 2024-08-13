import { describe, expect, test } from 'vitest'
import { extractIntactBoundary, collectColors } from './jsx'
import { generateCode } from '../tests/test-utils'
import { createIntellisenseContext } from '../internal/create-context'
import { defineConfig } from '@twind/core'
import presetTailtwind from '@twind/preset-tailwind'

describe('extractIntactBoundary', () => {
  test('attributes', () => {
    const codes = [
      generateCode(`<div className\n = "✍🏻text-sm">;`),
      generateCode(`<div className\n = "text-✍🏻sm">;`),
      generateCode(`<div className\n = "text-sm ✍🏻">;`),
      generateCode(`<div className="✍🏻">`),
      generateCode(`<div className=✍🏻"">`),
      generateCode(`<div className=""✍🏻>`),
      generateCode(`<div className=✍🏻"text">`),
      generateCode(`<div className = '✍🏻bg-red'>`),
      generateCode(`<div className = {'text-1✍🏻'}>`),
      generateCode(`<div className = {'text-1 ' + 'font-bold ✍🏻'}>`),
      generateCode(`<div className = {'text-1 ' + 'font-bold'✍🏻}>`),
      generateCode(`<div className = {'text-1 ' + 'font-bold'}✍🏻>`),
    ]

    for (const code of codes) {
      const boundary = extractIntactBoundary(code.clean, code.index)
      expect({
        code: code.origin,
        index: code.index,
        boundary,
      }).toMatchSnapshot()
    }
  })

  test('function calls', () => {
    const codes = [
      generateCode(`tw\`✍🏻text-sm\`;`),
      generateCode(`tx\`text-✍🏻sm\`;`),
      generateCode(`tx✍🏻\`text-sm\`;`),
      generateCode(`tx\`✍🏻\`;`),
      generateCode(`tx\`\`✍🏻;`),
      generateCode(`tx\`text-1 font-bold ✍🏻\`;`),
      generateCode(`tw('✍🏻');`),
      generateCode(`tw(''✍🏻);`),
      generateCode(`tx('text-red ✍🏻');`),
      generateCode(`tx(\`text-red \n bg-none ✍🏻\`);`),
      generateCode(`tx(\`text-red \n bg-none\`, '✍🏻');`),
      generateCode(`tx(\`text-red \n bg-none\`, '✍🏻 center');`),
      generateCode(`tx(\`text-red \n bg-none\`, 'center', ["dddd", "red ✍🏻"]);`),
      generateCode(`tx(\`text-red \n bg-none\`, 'center', ["dddd", "red"✍🏻]);`),
    ]

    for (const code of codes) {
      const boundary = extractIntactBoundary(code.clean, code.index)
      expect({
        code: code.origin,
        index: code.index,
        boundary,
      }).toMatchSnapshot()
    }
  })
})
