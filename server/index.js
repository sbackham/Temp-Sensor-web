const cors = require("cors");
const dotenv = require('dotenv');
dotenv.config();
const express = require("express");
const APP = express();
const http = require('http');
const MQTT = require('mqtt');
const server = http.createServer(APP);
const { Server } = require("socket.io");

const SERVERHOSTNAME = "230166eb60024a72b256ff9f4b53fbe9.s1.eu.hivemq.cloud"; // Enclosed in quotes
const PORT = 8883;
const USERNAME = "team14";
const PASSWORD = "GirlCoded12";
const CLIENTID = "team14"; // Enclosed in quotes
const CONNECTURL = `mqtts://${SERVERHOSTNAME}:${PORT}`;
const TOPIC = 'Temp';
const EXPRESSPORT = 3001;
const io = new Server(server); // Created an instance of Server

const client = MQTT.connect(CONNECTURL, {
    clientId: CLIENTID, // Changed to camelCase
    clean: true,
    connectTimeout: 7200,
    username: USERNAME,
    password: PASSWORD,
    reconnectPeriod: 10000,
});

APP.post('/turnOffLCD', (req, res) => {
    // Publish a message to the MQTT broker to turn off the LCD.
    client.publish('lcd/command', 'off');
    res.send('LCD Turn Off command sent.');
  });
  
  APP.listen(EXPRESSPORT, () => {
    console.log(`Server is running at http://localhost:${EXPRESSPORT}`);
  }
  );

let ay_latest = {}; // Declared with let

client.on("error", function (error) { console.log("Can't connect" + error) })

const corsOptions = {
    origin: '*'
}

APP.use(cors(corsOptions))

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.on('Client', (message) => {
        console.log(message)
    })
    console.log('Emitting')
    setInterval(function () {
        socket.emit('Echo', ay_latest.value);
    }, 1000); //1000ms
    socket.on("disconnect", () => console.log("Client disconnected"));
});

client.on('connect', async () => {
    console.log('Connected')
    client.subscribe([TOPIC], () => {
        console.log('Echo', `Subscribe to TOPIC '${TOPIC}'`)
    })
})

client.on('message', (TOPIC, payload) => {
    console.log('Received Message:', TOPIC, payload.toString())
    ay_latest.value = payload.toString()
})


server.listen(3000, () => { console.log("Server started") })
