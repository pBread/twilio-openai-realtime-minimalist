import type { WebSocket } from "ws";
import twilio from "twilio";
import type { TwilioStreamMessage, TwilioStreamMessageTypes } from "./types";

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

let streamSid: string;
export function setStreamSid(sid: string) {
  streamSid = sid;
}

export let ws: WebSocket; // This demo only supports on call at a time, hence the Twilio Media Stream websocket is globally scoped.
export function setWs(wss: WebSocket) {
  ws = wss;
}

/****************************************************
 Media Stream Actions, https://www.twilio.com/docs/voice/media-streams/websocket-messages#send-websocket-messages-to-twilio
****************************************************/
/** Clear Twilio's audio buffer (https://www.twilio.com/docs/voice/media-streams/websocket-messages#send-a-clear-message) */
export function clearAudio() {
  ws?.send(JSON.stringify({ event: "clear", streamSid }));
}

/** Send raw audio to Twilio call (https://www.twilio.com/docs/voice/media-streams/websocket-messages#send-a-media-message) */
export function sendAudio(audio: string) {
  ws?.send(
    JSON.stringify({ event: "media", streamSid, media: { payload: audio } })
  );
}

/****************************************************
 Websocket Listeners, https://www.twilio.com/docs/voice/media-streams/websocket-messages#websocket-messages-from-twilio 
****************************************************/
/** Adds an listener to an incoming message type from Twilio's Media Stream */
export function onMessage<T extends TwilioStreamMessageTypes>(
  type: T,
  callback: (message: TwilioStreamMessage & { event: T }) => void
) {
  ws.on("message", (data) => {
    const msg = JSON.parse(data.toString()) as TwilioStreamMessage;
    if (msg.event === type) callback(msg as TwilioStreamMessage & { event: T });
  });
}

export async function makeOutboundCall(to: string) {
  return client.calls.create({
    url: `https://${process.env.HOSTNAME}/incoming-call`,
    to: to,
    from: process.env.TWILIO_PHONE_NUMBER as string,
  });
}
