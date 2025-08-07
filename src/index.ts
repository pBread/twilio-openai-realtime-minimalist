import dotenv from "dotenv-flow";
import express from "express";
import ExpressWs from "express-ws";
import log from "./logger";
import config from "./openai-config";
import type { CallStatus } from "./twilio";
import { TwilioWebsocket } from "./twilio";
import { OpenAIRealtimeWebSocket } from "openai/beta/realtime/websocket";

dotenv.config();

const { app } = ExpressWs(express());
app.use(express.urlencoded({ extended: true })).use(express.json());

// ========================================
// Twilio Voice Webhook Endpoints
// ========================================
app.post("/incoming-call", async (req, res) => {
  log.twl.info(`incoming-call from ${req.body.From} to ${req.body.To}`);

  try {
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

  res.status(200).send();
});

// ========================================
// Twilio Media Stream Websocket Endpoint
// ========================================
app.ws("/media-stream", (ws) => {
  const tw = new TwilioWebsocket(ws);
  const rt = new OpenAIRealtimeWebSocket({ model: config.openai.model });

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
