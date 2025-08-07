import type { WebSocket } from "ws";

export class TwilioWebsocket {
  streamId: string | undefined;

  constructor(ws: WebSocket) {}
}

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

// ========================================
// Twilio Media Stream Actions
// https://www.twilio.com/docs/voice/media-streams/websocket-messages#send-websocket-messages-to-twilio
// ========================================

export type TwilioStreamAction = Clear | SendAudio | SendMark;

type Clear = {
  event: "clear";
  streamSid: string;
};

type SendAudio = {
  event: "media";
  streamSid: string;
  media: { payload: string };
};

type SendMark = {
  event: "mark";
  streamSid: string;
  mark: { name: string };
};

// ========================================
// Twilio Media Stream Messages
// https://www.twilio.com/docs/voice/media-streams/websocket-messages
// ========================================

export type TwilioStreamMessage =
  | ConnectedEvent
  | DTMFEvent
  | MarkEvent
  | MediaEvent
  | StartEvent
  | StopEvent;

type ExtractMessageEvent<T> = T extends { event: infer U } ? U : never;
export type TwilioStreamMessageTypes = ExtractMessageEvent<TwilioStreamMessage>;

type ConnectedEvent = {
  event: "connected";
  protocol: string;
  version: string;
};

type DTMFEvent = {
  event: "dtmf";
  dtmf: { digit: string; track: string };
  sequenceNumber: number;
  streamSid: string;
};

export type MarkEvent = {
  event: "mark";
  mark: { name: string };
  sequenceNumber: number;
  streamSid: string;
};

export type MediaEvent = {
  event: "media";
  sequenceNumber: number;
  media: { track: string; chunk: string; timestamp: string; payload: string };
  streamSid: string;
};

type StartEvent = {
  event: "start";
  sequenceNumber: string;
  start: {
    accountSid: string;
    streamSid: string;
    callSid: string;
    tracks: string[];
    mediaFormat: { encoding: string; sampleRate: number; channels: number };
    customParameters: Record<string, unknown>;
  };
  streamSid: string;
};

type StopEvent = {
  event: "stop";
  sequenceNumber: string;
  streamSid: string;
  stop: { accountSid: string; callSid: string };
};

// ========================================
// Misc Twilio
// ========================================
export type CallStatus = "completed" | "initializing" | "started" | "error";
