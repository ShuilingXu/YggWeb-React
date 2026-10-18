import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dimensionError, passwordError, playerError } from '../src/lib/validate.ts'
import { paging } from '../src/lib/paging.ts'
import { typeLabel } from '../src/api/enums.ts'

test('upload accepts supported models and rejects mismatched dimensions', () => {
  for (const [width, height, type] of [[64, 32, 0], [64, 64, 0], [128, 128, 1], [64, 32, 2], [22, 17, 2]]) {
    assert.equal(dimensionError(width, height, type), '', `${width}x${height}, type=${type}`)
  }
  for (const [width, height, type] of [[64, 32, 1], [63, 64, 0], [64, 64, 2], [8192, 8192, 0], [0, 0, 0]]) {
    assert.notEqual(dimensionError(width, height, type), '', `${width}x${height}, type=${type}`)
  }
})
test('account input constraints match backend byte and character limits', () => {
  assert.equal(passwordError('a'.repeat(72)), '')
  assert.notEqual(passwordError('密'.repeat(25)), '')
  assert.notEqual(passwordError('short'), '')
  assert.equal(playerError('Explorer_01'), '')
  assert.notEqual(playerError('角色'), '')
})
test('pagination uses response headers and preserves unknown totals', () => {
  assert.deepEqual(paging(new Headers({ 'X-Total-Count': '25', 'X-Limit': '24', Link: '</api/textures?offset=24>; rel="next"' }), 24, 24), { total: 25, limit: 24, next: true })
  assert.deepEqual(paging(new Headers({ 'X-Total-Count': '0', 'X-Limit': '24' }), 0, 24), { total: 0, limit: 24, next: false })
  assert.deepEqual(paging(new Headers(), 50), { total: null, limit: 50, next: true })
})
test('stored integer texture types retain their displayed meaning', () => {
  assert.equal(typeLabel(0), '经典皮肤')
  assert.equal(typeLabel(1), '纤细皮肤')
  assert.equal(typeLabel(2), '披风')
})
