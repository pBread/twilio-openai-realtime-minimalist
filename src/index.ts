import "dotenv-flow/config";
import express from "express";
import ExpressWs from "express-ws";
import OpenAI from "openai";
import { OpenAIRealtimeWebSocket } from "openai/beta/realtime/websocket";
import twilio from "twilio";
import bot from "./bot";
import log from "./logger";
import type { CallStatus } from "./twilio";
import { TwilioMediaStreamWebsocket } from "./twilio";

const { app } = ExpressWs(express());
app.use(express.urlencoded({ extended: true })).use(express.json());

// ========================================
// Twilio Voice Webhook Endpoints
// ========================================
app.post("/incoming-call", async (req, res) => {
  log.twl.info(`incoming-call from ${req.body.From} to ${req.body.To}`);

  try {
    // The session is created in the incoming-call webhook to avoid an extra delay after the call
    // is connected. The client_secret returned here is tied to the session and is passed to the WebSocket server via the <Parameter> element in the TwiML response.
    const oai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const session = await oai.beta.realtime.sessions.create({
      input_audio_format: "g711_ulaw",
      output_audio_format: "g711_ulaw",
      ...bot.session,
    });

    res.status(200);
    res.type("text/xml");

    // The <Stream/> TwiML noun tells Twilio to send the call to the websocket endpoint below.
    res.end(`\
<Response>
  <Connect>
    <Stream url="wss://${process.env.HOSTNAME}/media-stream/${session.client_secret.value}">
      <Parameter name="client_secret" value="${session.client_secret.value}" />
    </Stream>
  </Connect>
</Response>
`);
  } catch (error) {
    log.oai.error(
      "incoming call webhook failed, probably because OpenAI websocket could not connect.",
      error,
    );
    res.status(500).send();
  }
});

app.post("/call-status", async (req, res) => {
  const status = req.body.CallStatus as CallStatus;

  if (status === "error") log.twl.error(`call-status ${status}`);
  else log.twl.info(`call-status ${status}`);

  res.status(200).send();
});

// ========================================
// Twilio Media Stream Websocket Endpoint
// ========================================
app.ws("/media-stream/:client_secret", async (ws, req) => {
  log.twl.info("websocket initializing");

  console.log("req", req.params.client_secret);

  // The client_secret is passed in the start message
  let client_secret: string;
  const tw = new TwilioMediaStreamWebsocket(ws);
  await new Promise((resolve) => {
    tw.on("start", (msg) => {
      tw.streamSid = msg.start.streamSid;
      client_secret = msg.start.customParameters["client_secret"] as string;

      resolve(null);
    });
  });

  const rt = new OpenAIRealtimeWebSocket(
    { model: bot.model },
    new OpenAI({ apiKey: client_secret! }), // PROMPT: explain the session config is linked here. Concisely.
  );
  // Wait until the OpenAI WebSocket is connected and the session is fully initialized
  // before sending any audio. "session.created" is the first confirmation event.

  await new Promise((resolve) => rt.on("session.created", () => resolve(null)));

  // send bot's speech to twilio
  rt.on("response.audio.delta", (msg) =>
    tw.send({
      event: "media",
      media: { payload: msg.delta },
      streamSid: tw.streamSid!,
    }),
  );

  // send human speech to openai
  tw.on("media", (msg) =>
    rt.send({ type: "input_audio_buffer.append", audio: msg.media.payload }),
  );

  // clear buffer when the user starts speaking
  rt.on("input_audio_buffer.speech_started", () => {
    log.app.info("user started speaking");

    rt.send({ type: "input_audio_buffer.clear" });
    tw.send({ event: "clear", streamSid: tw.streamSid! });
  });

  // prompts the agent to say something
  rt.send({
    type: "response.create",
    response: {
      instructions: `You just answered the call. Say hello in English.`,
    },
  });

  // clean up websocket
  ws.on("close", () => {
    rt.close();
  });
});

/****************************************************
 Start Server
****************************************************/
const port = process.env.PORT || "3000";
app.listen(port, () => {
  log.app.info(`server running on http://localhost:${port}`);
});
