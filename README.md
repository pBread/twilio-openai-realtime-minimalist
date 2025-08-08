# Minimalist Voice Bot with Twilio & OpenAI Realtime

This project demonstrates how to integrate [Twilio's Programmable Voice API](https://www.twilio.com/docs/voice) with [OpenAI's real-time streaming API](https://platform.openai.com/docs/guides/realtime/overview). It is intentionally minimal. The goal is simply to show how a [Twilio Media Stream](https://www.twilio.com/docs/voice/media-streams) connects to the OpenAI Realtime API and exchanges audio in both directions.

## How it Works

- The `/incoming-call` endpoint responds to Twilio's incoming call webhook with the TwiML noun [`<Stream/>`](https://www.twilio.com/docs/voice/twiml/stream)
- A [Media Stream](https://www.twilio.com/docs/voice/media-streams) is established with the app's websocket endpoint.
- Audio packets from the voice call are forwarded to [OpenAI's Realtime API](https://platform.openai.com/docs/guides/realtime/overview).
- OpenAI responds with audio packets, which are forwarded to Twilio.

## Get Started

### 0. Prerequisites

- [Twilio account](https://www.twilio.com/try-twilio) with a [phone number](https://help.twilio.com/articles/223135247-How-to-Search-for-and-Buy-a-Twilio-Phone-Number-from-Console)
- [OpenAI Platform Account](https://platform.openai.com/signup) and `OPENAI_API_KEY`
- [nGrok installed globally](https://ngrok.com/docs/getting-started/)

### 1. Clone Repo

```bash
git clone https://github.com/pBread/twilio-openai-realtime-minimalist
cd twilio-openai-realtime-minimalist
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Ngrok Tunnel

The application needs to know the domain (`HOSTNAME`) it is deployed to in order to function correctly. This domain is set in the `HOSTNAME` environment variable and it must be configured before starting the app.

Start ngrok by running this command.

```bash
ngrok http 3000
```

Then copy the domain

<img src="./docs/grok.png"/>

_Note: ngrok provides [static domains for all ngrok users](https://ngrok.com/blog-post/free-static-domains-ngrok-users). You can avoid updating the `HOSTNAME` every time by provisioning your own static domain._

### 4. Add Environment Variables

```bash
OPENAI_API_KEY=your-openai-api-key
```

```bash
HOSTNAME=your-ngrok-domain.ngrok.app
```

### 5. Run the App

This command will start the Express server which handles incoming Twilio webhook requests and media streams.

```bash
npm run dev
```

### 6. Configure Twilio Phone Number Webhooks

Go to your [Twilio Console](https://console.twilio.com/) and configure the Voice webhooks for your Twilio phone number:

- <b>Incoming Call Webhook</b>: Select `POST` and set url to: `https://your-ngrok-domain.ngrok.app/incoming-call`
- <b>Call Status Update Webhook</b>: Select `POST` and set url to: `https://your-ngrok-domain.ngrok.app/call-status-update`

### 7. Place a Call to Your Twilio Phone Number

You're all set. Place a call to your Twilio Phone Number and you should see the real-time transcript logged to your local terminal.
