import dotenv from "dotenv-flow";
import express from "express";
import ExpressWs from "express-ws";
import config from "../config";
import log from "./logger";
import * as oai from "./openai";
import type { CallStatus } from "./twilio";
import * as twlo from "./twilio";

dotenv.config();

const { app } = ExpressWs(express());
app.use(express.urlencoded({ extended: true })).use(express.json());

// ========================================
// Twilio Voice Webhook Endpoints
// ========================================
app.post("/incoming-call", async (req, res) => {
  log.twl.info(`incoming-call from ${req.body.From} to ${req.body.To}`);

  try {
    oai.createWebsocket(); // This demo only supports one call at a time, hence a single OpenAI websocket is stored globally
    oai.ws.on("open", () => log.oai.info("openai websocket opened"));
    oai.ws.on("error", (err) => log.oai.error("openai websocket error", err));

    // The incoming-call webhook is blocked until the OpenAI websocket is connected.
    // This ensures Twilio's Media Stream doesn't send audio packets to OpenAI prematurely.
    await oai.wsPromise;

    res.status(200);
    res.type("text/xml");

    // The <Stream/> TwiML noun tells Twilio to send the call to the websocket endpoint below.
    res.end(`
        <Response>
          <Connect>
            <Stream url="wss://${process.env.HOSTNAME}/media-stream" />
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

  if (status === "error" || status === "completed") oai.closeWebsocket();

  res.status(200).send();
});

// ========================================
// Twilio Media Stream Websocket Endpoint
// ========================================
app.ws("/media-stream", (ws, req) => {
  log.twl.info("incoming websocket");

  twlo.setWs(ws); // set the Twilio Media Stream websocket
  twlo.ws.on("error", (err) => log.twl.error(`websocket error`, err));

  // twilio media stream starts
  twlo.onMessage("start", (msg) => {
    log.twl.success("media stream started");
    twlo.setStreamSid(msg.streamSid);

    // OpenAI's websocket session parameters should probably be set when the it is
    // initialized. However, setting them slightly later (i.e. when the Twilio Media starts)
    // seems to make OpenAI's bot more responsive. I don't know why
    oai.setSessionParams();

    oai.speak(config.introduction); // tell OpenAI to speak the introduction
  });

  // relay audio packets between Twilio & OpenAI
  oai.onMessage("response.audio.delta", (msg) => twlo.sendAudio(msg.delta));
  twlo.onMessage("media", (msg) => oai.sendAudio(msg.media.payload));

  // user starts talking
  oai.onMessage("input_audio_buffer.speech_started", (msg) => {
    log.app.info("user started speaking");

    oai.clearAudio(); // tell OpenAI to stop sending audio
    twlo.clearAudio(); // tell Twilio to stop playing any audio that it has buffered
  });

  // bot final transcript
  oai.onMessage("response.audio_transcript.done", (msg) => {
    log.oai.info("bot transcript (final): ", msg.transcript);
  });
});

/****************************************************
 Start Server
****************************************************/
const port = process.env.PORT || "3000";
app.listen(port, () => {
  log.app.info(`server running on http://localhost:${port}`);
});
