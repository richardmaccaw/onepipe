import type { Env } from './env'
import type { IdentifySystemEvent, QueueMessage, TrackSystemEvent } from './types'
import { bigquery_handleIdentify, bigquery_handleTrack } from '@onepipe/destination-bigquery'

export async function safeConsumeMessage(message: Message<QueueMessage>, env: Env) {
  try {
    await consumeMessage(message, env)
    message.ack()
  } catch (error) {
    console.error(error)
    message.retry()
  }
}

function consumeMessage(message: Message<QueueMessage>, env: Env) {
  switch (message.body.type) {
    case 'track':
      return handleTrack(message.body.event as TrackSystemEvent, env)
    case 'identify':
      return handleIdentify(message.body.event as IdentifySystemEvent, env)
    default:
      throw new Error(`Unknown message type: ${message.body}`)
  }
}

function handleIdentify(event: IdentifySystemEvent, env: Env) {
  return bigquery_handleIdentify(event, env)
}

function handleTrack(event: TrackSystemEvent, env: Env) {
  return bigquery_handleTrack(event, env)
} 