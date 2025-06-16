import type { Env } from '../types'
import type { IdentifySystemEvent, TrackSystemEvent } from '@onepipe/core'
import type { QueueMessage } from '../types'
import { triggerIdentify, triggerTrack } from '../plugin-loader'

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
  return triggerIdentify(event, env)
}

function handleTrack(event: TrackSystemEvent, env: Env) {
  return triggerTrack(event, env)
}

