export interface Env {
  TOKEN_CACHE: KVNamespace
  QUEUE: Queue<any>  // Using any for now, will be typed by the consuming app
} 