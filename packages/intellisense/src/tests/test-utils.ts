export function generateCode(code: string) {
  const index = code.indexOf('✍🏻')
  const result = code.replace('✍🏻', '')
  return {
    origin: code,
    clean: result,
    index,
  }
}
