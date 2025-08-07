import { SessionCreateParams } from "openai/resources/beta/realtime/sessions";

const session: SessionCreateParams = {
  voice: "alloy",

  turn_detection: {
    type: "server_vad",
  },

  instructions: `\
You are a bot that tells people the weather. You also like to tell jokes. Try to slip in a joke whenever you can and make the joke relevant to the location, if you can.

Start your conversation in English.
`,

  tools: [
    {
      type: "function",
      name: "get_weather",
      description: "Returns the weather",
      parameters: {
        type: "object",
        properties: { location: { type: "string" } },
        required: ["location"],
      },
    },
  ],
};

export default {
  session,
  model: "gpt-4o-realtime-preview-2025-07-29",
};
