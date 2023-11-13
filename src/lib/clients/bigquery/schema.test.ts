import { deriveSchema } from './schema'
import { BigQueryEvent, BigQuerySchemaField } from './types'

describe('deriveSchema', () => {
  it('should correctly derive schema from event', () => {
    const event: BigQueryEvent = {
      name: 'test',
      age: 30,
      isActive: true,
    }

    const expectedSchema: BigQuerySchemaField[] = [
      { name: 'name', type: 'STRING' },
      { name: 'age', type: 'INTEGER' },
      { name: 'isActive', type: 'BOOLEAN' },
    ]

    const derivedSchema = deriveSchema(event)

    expect(derivedSchema).toEqual(expectedSchema)
  })
})
