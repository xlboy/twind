import { test, expect } from 'vitest'
import { extractBoundary } from './react'

test('extractBoundary', () => {
  // expect(extractBoundary('<div className\n = "text-sm">;', 26)).toEqual({
  //   content: 'text-sm',
  //   start: 21,
  //   end: 27,
  // })
  // expect(extractBoundary("<div className\n={'text-sm'}>;", 35)).toEqual({
  //   content: 'text-sm',
  //   start: 21,
  //   end: 27,
  // })
})
