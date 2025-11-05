const express = require('express');
const cors = require('cors');
const { AccessToken, VideoGrant } = require('livekit-server-sdk');
const { WebhookReceiver } = require('livekit-server-sdk');

require('dotenv').config();

const app = express();

app.use(cors(
    {
  origin: [
    "http://localhost",
    "http://localhost:5080",
    "wss://jeeni-e11mo5mz.livekit.cloud",
    "http://localhost:5173"
  ]
}
));

app.get("/", async (req, res) => {res.status(200).send('ok')});

app.get("/getToken", async (req, res) => {
  // The user's identity and the room they want to join
  const { roomName, identity, user_id } = req.query;

  if (!roomName || !identity) {
    return res.status(400).send("Missing roomName or identity");
  }

  // Create a new AccessToken
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: identity,
    metadata: JSON.stringify({ user_id })
  });

  // Grant permissions to join a specific room
  at.addGrant({
    room: roomName,
    roomJoin: true,
    
  });

  // Generate the JWT token string
  const token = await at.toJwt();
 

  // Send the token to the client
  res.send({token})
});

const webhookReceiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY,
  process.env.LIVEKIT_API_SECRET
);

app.post("/livekit/webhook", async (req, res) => {
  try {
    const event = await webhookReceiver.receive(
      req.body,
      req.get("Authorization")
    );
    console.log(event);
  } catch (error) {
    console.error("Error validating webhook event", error);
  }
  res.status(200).send();
});


const PORT = 6080;
app.listen(PORT, () => {
  console.log(`Token server running on http://localhost:${PORT}`);
});

module.exports = app;
