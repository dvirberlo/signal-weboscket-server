import {
  WebSocketClient,
  WebSocketServer,
} from "https://deno.land/x/websocket@v0.1.4/mod.ts";

const NEW_ID = ":new-id:";
const SET_ID = ":set-id:";

const connectionIdMap = new Map<WebSocketClient, number>();
const idSet = new Set<number>();

const wss = new WebSocketServer(8080);

wss.on("connection", function (ws: WebSocketClient) {
  ws.on("message", function (message: string) {
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
function newId(ws: WebSocketClient, message: string) {
  let id = Math.floor(Math.random() * 1000000);
  while (idSet.has(id)) {
    id = Math.floor(Math.random() * 1000000);
  }
  connectionIdMap.set(ws, id);
  idSet.add(id);
  ws.send(`${NEW_ID}${id}`);
}

function setId(ws: WebSocketClient, message: string) {
  const id = parseInt(message.slice(SET_ID.length));
  if (isNaN(id)) {
    console.log("set id with invalid id:", message);
    return;
  }
  connectionIdMap.set(ws, id);
  idSet.add(id);
}

function passMessage(ws: WebSocketClient, message: string) {
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
