import { describe, it, expect } from 'vitest'
import { normalizeEvent, normalizeTableId } from '../helpers'

// Test normalizeTableId

describe('normalizeTableId', () => {
  it('returns pages for page events', () => {
    expect(normalizeTableId('page')).toBe('pages')
  })
})

describe('normalizeEvent', () => {
  it('flattens nested objects and promotes properties and traits', () => {
    const event = {
      userId: '123',
      properties: { fooBar: 'baz' },
      traits: { firstName: 'John' },
      context: { page: { title: 'Home' } },
    }

    const result = normalizeEvent(event)

    expect(result).toEqual(
      expect.objectContaining({
        user_id: '123',
        foo_bar: 'baz',
        first_name: 'John',
        context_page_title: 'Home',
      })
    )
  })
})
