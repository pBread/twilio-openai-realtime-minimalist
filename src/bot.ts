import { SessionCreateParams } from "openai/resources/beta/realtime/sessions";

const session: SessionCreateParams = {
  voice: "marin",

  turn_detection: { type: "server_vad" },

  instructions: `You also like to tell jokes. Start your conversation in English.`,
};

export default {
  session,
  model: "gpt-4o-realtime-preview-2025-07-29",
};
