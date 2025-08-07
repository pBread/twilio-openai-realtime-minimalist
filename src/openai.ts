import WS from "ws";
import config from "./openai-config";
import log from "./logger";
import { OpenAIRealtimeWebSocket } from "openai/beta/realtime/websocket";

export class OpenAIRealtimeAdapter extends OpenAIRealtimeWebSocket {
  constructor(params: { model: string }) {
    super(params);
  }

  clearAudio = () => this.send({ type: "input_audio_buffer.clear" });
  speak = (text: string) =>
    this.send({
      type: "response.create",
      response: {
        // instructions: `Say this:\n${text}`,
        input: [
          {
            type: "message",
            role: "assistant",
            content: [{ text, type: "input_text" }],
          },
        ],
      },
    });
}

// ========================================
// Websocket Lifecycle
// https://platform.openai.com/docs/guides/realtime/overview
// ========================================

// ========================================
// Websocket Actions
// https://platform.openai.com/docs/api-reference/realtime-client-events
// ========================================

/** Clears OpenAI's audio buffer (https://platform.openai.com/docs/api-reference/realtime-client-events/input_audio_buffer/clear) */
export function clearAudio() {
  ws?.send(JSON.stringify({ type: "input_audio_buffer.clear" }));
}

/** Create a response record that prompts the voicebot to say something (https://platform.openai.com/docs/api-reference/realtime-client-events/response/create) */
export function speak(text: string) {
  ws?.send(
    JSON.stringify({
      type: "response.create",
      response: {
        modalities: ["text", "audio"],
        instructions: `Say this verbatum:\n${text}`,
      },
    }),
  );
}

/** Send raw audio packets to OpenAI's websocket (https://platform.openai.com/docs/api-reference/realtime-client-events/input_audio_buffer/append) */

/** Sets the OpenAI Realtime session parameter per the demo configuation.
 *
 * Note, these config params should probably be set when the OpenAI websocket is initialized
 * but, setting them slightly later (i.e. when the Twilio Media starts) seems to make
 * OpenAI's bot more responsive.
 */

// ========================================
// Websocket Listeners
// https://platform.openai.com/docs/api-reference/realtime-server-events
// ========================================

// ========================================
// Open AI Actions
// https://platform.openai.com/docs/api-reference/realtime-client-events
// ========================================
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
