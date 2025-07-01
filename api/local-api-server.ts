import express from 'express'

import getDBInstance from './db'
import eventEmitter from './event-emitter'

const app = express()
const port = process.env.PORT || 8000

app.use(express.json())

app.get('/', async (req, res) => {
  res.send('hello')
})

app.post('/collect/:id', async (req, res) => {
  const fields = req.body?.data || []

  const db = await getDBInstance()

  const newData = {
    id: req.params.id,
    data: fields,
    createdAt: new Date()
  }
  db.collection('raw-data').insertOne(newData)

  eventEmitter.emit('data-collected', newData)

  res.json('ok')
})

app.get('/chart/:id', async (req, res) => {
  const db = await getDBInstance()

  const output = db.collection("processed-data").find({
    id: req.params.id,
    createdAt: {
      $lt: new Date(Date.now() - 86400000),
    },
  }).toArray()


  res.json(output)
})


app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`)
})