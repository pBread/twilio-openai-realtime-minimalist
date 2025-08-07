import type { WebSocket } from "ws";

export class TwilioMediaStreamWebsocket {
  private ws: WebSocket;
  public conf: StartEvent["start"] | undefined;
  public setupPromise: Promise<void>;

  constructor(ws: WebSocket) {
    this.ws = ws;

    this.setupPromise = new Promise((resolve) => {
      this.on("start", (msg: StartEvent) => {
        this.conf = msg["start"];
        resolve();
      });
    });
  }

  send(action: TwilioStreamAction) {
    this.ws.send(JSON.stringify(action));
  }

  on<K extends TwilioStreamMessageTypes>(
    event: K,
    handler: (msg: Extract<TwilioStreamMessage, { event: K }>) => void,
  ) {
    this.ws.on("message", (data) => {
      const msg = JSON.parse(event.toString()) as TwilioStreamMessage;
      if (msg.event === event) handler(msg);
    });
  }
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
