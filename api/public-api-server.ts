
import eventEmitter from './event-emitter'

let lastCollectedData: any = null;

function sendData(channel: string = 'default', payload: any) {
  return JSON.stringify({
    channel,
    payload: payload,
  })
}

const server = Bun.serve({
  port: 8001,
  fetch(req, server) {
    const success = server.upgrade(req);
    if (success) {
      // Bun automatically returns a 101 Switching Protocols
      // if the upgrade succeeds
      return undefined;
    }

    // handle HTTP request normally
    return new Response("Hello world!!!");
  },
  websocket: {
    open(ws) {
      console.log(`Websocket connection opened from ${ws}`);
      ws.subscribe('on-data-collected')

      if(lastCollectedData) {
        ws.send(sendData('on-data-collected', lastCollectedData));
      }
      ws.send('Welcome to the WebSocket server!');
    },
    // this is called when a message is received
    async message(ws, message) {
      console.log(`Received ${message}`);
      // send back a message
      ws.send(`You said: ${message}`);
    },
  },
});

eventEmitter.on('data-collected', (data : any) => {
  console.log('Data collected:', JSON.stringify(data));
  lastCollectedData = data
  server.publish('on-data-collected', sendData('on-data-collected', data))
})

console.log(`Websocket server is Listening on ${server.hostname}:${server.port}`);