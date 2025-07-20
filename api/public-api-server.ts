
import eventEmitter from './event-emitter'
import getDBInstance from './db'
import dayjs from 'dayjs'

let lastCollectedData: any = null

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
    async open(ws) {
      console.log(`Websocket connection opened from ${ws}`);

      try {
        const db = await getDBInstance()

        const output = await db.collection("processed-data").find(
          {
            // id: req.params.id,
            timestamp: {
              $gte: dayjs().subtract(3, 'day').toDate(),
            },
          },
          {
            sort: {
              timestamp: 1
            }
          }
        ).toArray()

        console.log('output data length', output.length - 1)

        ws.send(sendData('initial-chart', output))

        // if(lastCollectedData) {
        //   ws.send(sendData('on-data-collected', lastCollectedData))
        // }

        ws.subscribe('on-data-collected')
        ws.subscribe('on-data-processed') 
      } catch (error) {
        console.error(error)
      }
      // ws.send('Welcome to the WebSocket server!');
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
  // console.log('data-collected', data)
  lastCollectedData = data
  server.publish('on-data-collected', sendData('on-data-collected', data))
})

eventEmitter.on('data-processed', (data : any) => {
  // lastCollectedData = data
  server.publish('on-data-processed', sendData('on-data-processed', data))
})

console.log(`Websocket server is Listening on ${server.hostname}:${server.port}`);