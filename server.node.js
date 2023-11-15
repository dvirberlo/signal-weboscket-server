const WebSocket = require("ws");

const NEW_ID = ":new-id:";
const SET_ID = ":set-id:";

const connectionIdMap = new Map();
const idSet = new Set();

const PORT = process.env.PORT || 8181;
const wss = new WebSocket.Server({ port: PORT });

wss.on("connection", function (ws) {
  ws.on("message", function (data) {
    const message = data.toString();
    console.log("received message:", message);

    // check for commands:
    if (message.startsWith(NEW_ID)) {
      newId(ws, message);
    } else if (message.startsWith(SET_ID)) {
      setId(ws, message);
    }

    passMessage(ws, message);
  });
  ws.on("close", function () {
    const id = connectionIdMap.get(ws);
    if (id !== undefined) idSet.delete(id);
    connectionIdMap.delete(ws);
  });
});

// commands:
function newId(ws, message) {
  let id = Math.floor(Math.random() * 1000000);
  while (idSet.has(id)) {
    id = Math.floor(Math.random() * 1000000);
  }
  connectionIdMap.set(ws, id);
  idSet.add(id);
  ws.send(`${NEW_ID}${id}`);
}

function setId(ws, message) {
  const id = parseInt(message.slice(SET_ID.length));
  if (isNaN(id)) {
    console.log("set id with invalid id:", message);
    return;
  }
  connectionIdMap.set(ws, id);
  idSet.add(id);
}

function passMessage(ws, message) {
  const id = connectionIdMap.get(ws);
  if (id === undefined) {
    console.log("message from unregistered id:", message);
    return;
  }

  wss.clients.forEach((client) => {
    if (client !== ws && connectionIdMap.get(client) === id)
      client.send(message);
  });
}
