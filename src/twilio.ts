import type { WebSocket } from "ws";
import type { TwilioStreamMessage, TwilioStreamMessageTypes } from "./types";

let streamSid: string;
export const setStreamSid = (sid: string) => (streamSid = sid);

export let ws: WebSocket; // This demo only supports on call at a time, hence the Twilio Media Stream websocket is globally scoped.
export const setWs = (wss: WebSocket) => (ws = wss);

// ========================================
// Media Stream Actions
// https://www.twilio.com/docs/voice/media-streams/websocket-messages#send-websocket-messages-to-twilio
// ========================================

/** Clear Twilio's audio buffer (https://www.twilio.com/docs/voice/media-streams/websocket-messages#send-a-clear-message) */
export function clearAudio() {
  ws?.send(JSON.stringify({ event: "clear", streamSid }));
}

/** Send raw audio to Twilio call (https://www.twilio.com/docs/voice/media-streams/websocket-messages#send-a-media-message) */
export function sendAudio(audio: string) {
  ws?.send(
    JSON.stringify({ event: "media", streamSid, media: { payload: audio } }),
  );
}

// ========================================
// Websocket Listeners
// https://www.twilio.com/docs/voice/media-streams/websocket-messages#websocket-messages-from-twilio
// ========================================

/** Adds an listener to an incoming message type from Twilio's Media Stream */
export function onMessage<T extends TwilioStreamMessageTypes>(
  type: T,
  callback: (message: TwilioStreamMessage & { event: T }) => void,
) {
  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString()) as TwilioStreamMessage;
    if (msg.event === type) callback(msg as TwilioStreamMessage & { event: T });
  });
}
