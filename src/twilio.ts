import type { WebSocket } from "ws";

/**
 * A typed WebSocket adapter for Twilio Media Streams.
 *
 * This class wraps a raw WebSocket connection and adds strong typing
 * for Twilio's media stream messages and actions. It handles automatic
 * JSON parsing and serializing, and provides a setup promise that resolves
 * once the `start` event is received.
 */

export class TwilioMediaStreamWebsocket {
  ws: WebSocket;

  conf: StartEvent["start"] | undefined;
  streamSid!: string;
  setupPromise: Promise<void>;

  constructor(ws: WebSocket) {
    this.ws = ws;

    this.setupPromise = new Promise((resolve) => {
      this.on("start", (msg: StartEvent) => {
        this.streamSid = msg.start.streamSid;
        this.conf = msg.start;
        resolve();
      });
    });
  }

  send = (action: TwilioStreamAction) => this.ws.send(JSON.stringify(action));

  on = <K extends TwilioStreamMessageTypes>(
    event: K,
    handler: (msg: Extract<TwilioStreamMessage, { event: K }>) => void,
  ) =>
    this.ws.on("message", (data) => {
      const msg = JSON.parse(data.toString()) as TwilioStreamMessage;
      if (msg.event === event) {
        handler(msg as Extract<TwilioStreamMessage, { event: K }>);
      }
    });
}

// ========================================
// Twilio Media Stream Types
// ========================================
export type TwilioStreamAction = Clear | SendAudio | SendMark;

type Clear = { event: "clear"; streamSid: string };
type SendAudio = {
  event: "media";
  streamSid: string;
  media: { payload: string };
};
type SendMark = { event: "mark"; streamSid: string; mark: { name: string } };

export type TwilioStreamMessage =
  | ConnectedEvent
  | StartEvent
  | MediaEvent
  | DTMFEvent
  | MarkEvent
  | StopEvent;

type ConnectedEvent = {
  event: "connected";
  protocol: string;
  version: string;
};

export type StartEvent = {
  event: "start";
  sequenceNumber: number;
  start: {
    streamSid: string;
    accountSid: string;
    callSid: string;
    tracks: ("inbound" | "outbound")[];
    mediaFormat: {
      encoding: "audio/x-mulaw";
      sampleRate: number;
      channels: number;
    };
    customParameters: Record<string, unknown>;
  };
};

export type MediaEvent = {
  event: "media";
  sequenceNumber: number;
  media: {
    track: string;
    chunk: string;
    timestamp: string;
    payload: string;
  };
  streamSid: string;
};

export type DTMFEvent = {
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

export type StopEvent = {
  event: "stop";
  sequenceNumber: number;
  streamSid: string;
  stop: { accountSid: string; callSid: string };
};

export type TwilioStreamMessageTypes = TwilioStreamMessage["event"];

// ========================================
// Miscellaneous Twilio Types
// ========================================
export type CallStatus = "completed" | "initializing" | "started" | "error";
