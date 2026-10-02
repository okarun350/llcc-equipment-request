import test from 'node:test'
import assert from 'node:assert/strict'

import {
  normalizeRequestedItems,
  timeRangeOverlaps,
} from './request-helpers.js'

test('normalizeRequestedItems keeps a custom other item when selected', () => {
  const items = ['LED Wall', 'Other']
  const next = normalizeRequestedItems(items, 'Portable PA system')

  assert.deepEqual(next, ['LED Wall', 'Portable PA system'])
})

test('timeRangeOverlaps detects overlapping bookings', () => {
  assert.equal(timeRangeOverlaps('09:00', '11:00', '10:00', '12:00'), true)
  assert.equal(timeRangeOverlaps('09:00', '10:30', '10:30', '12:00'), false)
})
