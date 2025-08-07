/****************************************************
 Open AI Actions
 https://platform.openai.com/docs/api-reference/realtime-client-events
****************************************************/
export type OpenAIActions =
  | ConversationItemCreate
  | ConversationItemDelete
  | ConversationItemTruncate
  | InputAudioBufferAppend
  | InputAudioBufferClear
  | InputAudioBufferCommit
  | ResponseCancel
  | ResponseCreate
  | SessionUpdate;

type ConversationItemCreate = {
  type: "conversation.item.create";
  event_id?: string;
  previous_item_id?: string | null;
  item: {
    id?: string;
    type: "message" | "function_call" | "function_call_output";
    status?: "completed" | "in_progress" | "incomplete";
    role: "user" | "assistant" | "system";
    content: {
      type: "input_text" | "input_audio" | "text" | "audio";
      text?: string;
      audio?: string;
      transcript?: string;
    }[];
  };
};

type ConversationItemDelete = {
  type: "conversation.item.delete";
  event_id?: string;
  item_id: string;
};

type ConversationItemTruncate = {
  type: "conversation.item.truncate";
  event_id?: string;
  item_id: string;
  content_index?: number;
  audio_end_ms?: number;
};

type InputAudioBufferAppend = {
  type: "input_audio_buffer.append";
  event_id?: string;
  audio: string;
};

type InputAudioBufferClear = {
  type: "input_audio_buffer.clear";
  event_id?: string;
};

type InputAudioBufferCommit = {
  type: "input_audio_buffer.commit";
  event_id?: string;
};

type ResponseCancel = {
  type: "response.cancel";
  event_id?: string;
};

type ResponseCreate = {
  type: "response.create";
  event_id?: string;
  response: {
    modalities?: string[];
    instructions?: string;
    voice?: string;
    output_audio_format?: string;
    tools?: Tool[];
    tool_choice?: string;
    temperature?: number;
    max_output_tokens?: number;
  };
};

type SessionUpdate = {
  type: "session.update";
  event_id?: string;
  session: {
    modalities?: string[];
    instructions?: string;
    voice?: string;
    input_audio_format?: string;
    output_audio_format?: string;
    input_audio_transcription?: { enabled: boolean; model: string };
    turn_detection?: {
      type?: string;
      threshold?: number;
      prefix_padding_ms?: number;
      silence_duration_ms?: number;
    };
    tools?: Tool[];
    tool_choice?: string;
    temperature?: number;
    max_output_tokens?: any;
  };
};

// shared
type Tool = {
  type: string;
  name: string;
  description?: string;
  parameters: {
    type: string;
    properties?: { [key: string]: { type: string } };
    required?: string[];
  };
};

// ========================================
// Open AI Real Stime Websocket Events
// https://platform.openai.com/docs/api-reference/realtime-server-events
// ========================================

export type OpenAIStreamMessage =
  | ConversationItemCreatedEvent
  | ErrorEvent
  | InputAudioBufferCommittedEvent
  | InputAudioBufferSpeechStartedEvent
  | InputAudioBufferSpeechStoppedEvent
  | ResponseAudioDeltaEvent
  | ResponseAudioTranscriptDeltaEvent
  | ResponseAudioTranscriptDoneEvent
  | ResponseContentPartAddedEvent
  | ResponseCreatedEvent
  | ResponseOutputItemAddedEvent
  | SessionCreatedEvent
  | SessionUpdatedEvent;

type ExtractMessageType<T> = T extends { type: infer U } ? U : never;
export type OpenAIStreamMessageTypes = ExtractMessageType<OpenAIStreamMessage>;

// Event Types
type ConversationItemCreatedEvent = {
  type: "conversation.item.created";
  event_id: string;
  previous_item_id: string;
  item: RealtimeItem;
};

type ErrorEvent = {
  type: "error";
  event_id: string;
  error: {
    type: string;
    code: string;
    message: string;
    param: any;
    event_id: string;
  };
};

type InputAudioBufferCommittedEvent = {
  type: "input_audio_buffer.committed";
  event_id: string;
  previous_item_id: string | null;
  item_id: string;
};

type InputAudioBufferSpeechStartedEvent = {
  type: "input_audio_buffer.speech_started";
  event_id: string;
  audio_start_ms: number;
  item_id: string;
};

type InputAudioBufferSpeechStoppedEvent = {
  type: "input_audio_buffer.speech_stopped";
  event_id: string;
  audio_end_ms: number;
  item_id: string;
};

type ResponseAudioDeltaEvent = {
  type: "response.audio.delta";
  event_id: string;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
};

type ResponseAudioTranscriptDeltaEvent = {
  type: "response.audio_transcript.delta";
  event_id: string;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
};

type ResponseAudioTranscriptDoneEvent = {
  type: "response.audio_transcript.done";
  event_id: string;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  transcript: string;
};

type ResponseContentPartAddedEvent = {
  type: "response.content_part.added";
  event_id: string;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  part: {
    type: string;
    transcript: string;
  };
};

type ResponseCreatedEvent = {
  type: "response.created";
  event_id: string;
  response: RealtimeResponse;
};

type ResponseOutputItemAddedEvent = {
  type: "response.output_item.added";
  event_id: string;
  response_id: string;
  output_index: number;
  item: RealtimeItem;
};

type SessionCreatedEvent = {
  type: "session.created";
  event_id: string;
  session: RealtimeSession;
};

type SessionUpdatedEvent = {
  type: "session.updated";
  event_id: string;
  session: RealtimeSession;
};

// shared
type RealtimeSession = {
  id: string;
  object: string;
  model: string;
  expires_at: number;
  modalities: string[];
  instructions: string;
  voice: string;
  turn_detection: {
    type: string;
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
  };
  input_audio_format: string;
  output_audio_format: string;
  input_audio_transcription: string | null;
  tool_choice: string;
  temperature: number;
  max_response_output_tokens: string;
  tools: any[];
};

type RealtimeItem = {
  id: string;
  object: string;
  type: string;
  status: string;
  role: string;
  content: any[];
};

type RealtimeResponse = {
  object: string;
  id: string;
  status: string;
  status_details: string | null;
  output: any[];
  usage: any | null;
};

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

/****************************************************
 Twilio Media Stream Messages
 https://www.twilio.com/docs/voice/media-streams/websocket-messages
****************************************************/
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

/****************************************************
 Misc Twilio
****************************************************/
export type CallStatus = "completed" | "initializing" | "started" | "error";
