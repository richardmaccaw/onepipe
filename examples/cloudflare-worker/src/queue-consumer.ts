import type { Env, QueueMessage, IdentifySystemEvent, TrackSystemEvent } from './types'
import { triggerIdentify, triggerTrack } from './destination-loader'

export async function safeConsumeMessage(message: Message<QueueMessage>, env: Env) {
  try {
    await consumeMessage(message, env)
    message.ack()
  } catch (error) {
    console.error('Error processing queue message:', error)
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
      throw new Error(`Unknown message type: ${(message.body as any).type}`)
  }
}

function handleIdentify(event: IdentifySystemEvent, env: Env) {
  return triggerIdentify(event, env)
}

function handleTrack(event: TrackSystemEvent, env: Env) {
  return triggerTrack(event, env)
}