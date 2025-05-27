import { BigQueryEvent, BigQueryConnectOptions, BigQueryInsertResponse, baseUrl } from './types'

/**
 * This function is used to insert a new event into the BigQuery table.
 * It first ensures that the table exists, then inserts the event.
 *
 * @param {BigQueryEvent} event - The event to be inserted into the BigQuery table.
 * @param {BigQueryConnectOptions} options - The connection options for the BigQuery client.
 *
 * @example
 *
 * const event = {
 *   name: 'test',
 *   timestamp: new Date(),
 *   value: 123
 * };
 *
 * const options = {
 *   projectId: 'my-project-id',
 *   datasetId: 'my-dataset-id',
 *   tableId: 'my-table-id'
 * };
 *
 * await insert(event, options);
 *
 * @returns {Promise<void>} - A promise that resolves when the event has been inserted.
 */

export async function insertEvents(events: BigQueryEvent[], options: BigQueryConnectOptions) {
  const url = `${baseUrl}/projects/${options.projectId}/datasets/${options.datasetId}/tables/${options.tableId}/insertAll`

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${options.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rows: events.map((event) => ({
        json: event,
        insertId: event.id,
      })),
    }),
  })

  if (!response.ok) {
    throw new Error(`Failed to insert event: ${await response.text()}`)
  }

  const insertResponse = (await response.json()) as BigQueryInsertResponse

  if (insertResponse.insertErrors?.length) {
    throw new Error(`Failed to insert event: ${JSON.stringify(insertResponse.insertErrors)}`)
  }
} 