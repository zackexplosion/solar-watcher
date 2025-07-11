import { MongoClient } from "mongodb"

let MONGODB_URI = process.env.MONGODB_URI?.toString() || ''
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

let client: MongoClient

export default async function db() {

  if (!client) {
    client = await MongoClient.connect(MONGODB_URI)
  }

  return client.db(process.env.MONGODB_NAME)
}