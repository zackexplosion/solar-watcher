import 'dotenv/config'

console.log(process.env)

import { SerialPort } from 'serialport'
import { autoDetect } from "@serialport/bindings-cpp"
import { ReadlineParser } from '@serialport/parser-readline'
import axios from 'axios'
const SEND_DATA_INTERVAL = parseInt(process.env.SEND_DATA_INTERVAL) || 1000 // Interval to send data in milliseconds
const CONNECT_PATH = process.env.CONNECT_PATH
const Binding = autoDetect()
const ports = await Binding.list()




console.table(ports)

// const parser = new ReadlineParser({ delimiter: '\r' })
// Replace with your serial port path and baud rate (OPTI-Solar usually uses 2400)
const port = new SerialPort({
  path: CONNECT_PATH,  // change to your port
  baudRate: 2400,
  autoOpen: false
})

// Use a parser to read lines ending with carriage return (0x0D)
const parser = port.pipe(new ReadlineParser({ delimiter: '\r' }))


function sendCommand(port) {
  const command = Buffer.from([0x51, 0x50, 0x49, 0x47, 0x53, 0xB7, 0xA9, 0x0D])
  
  port.write(command, (err) => {
    if (err) {
      return console.error('Error writing command:', err.message)
    }
    console.log('Command sent:', command.toString('hex'))
  })
} 

// Open the port
port.open((err) => {
  if (err) {
    return console.error('Error opening port:', err.message);
  }
  console.log('Serial port opened');

  // Example: Send QPIGS command to get inverter status
  // Command bytes for QPIGS with CRC and ending with 0x0D
  // You need to calculate CRC for your commands or use a fixed command if known
  // Here is an example command buffer for QPIGS (replace with correct CRC)
  sendCommand(port)

  setInterval(function(){
      sendCommand(port)
  }, SEND_DATA_INTERVAL)
})

async function handleData(data) {

  var startFrom = data.indexOf('2')

  if(startFrom <= -1) return
  let output = data.slice(startFrom)

  const fields = output.split(' ')

  // Last field usually has some length issue
  fields[fields.length - 1]  = fields[fields.length - 1].slice(0, 4)
  console.log('data received', fields.join(' '))
  try {
    await axios.post(`${process.env.API_SERVER_URL}/collect/opti-handy-6k`, {
      data: fields,
      // headers: {
      //   'Content-Type': 'application/json',
      //   'Authorization': `Bearer ${process.env.API_TOKEN}`
      // }
    })    
  } catch (error) {
    console.error('Error sending data to API:')
    
    // if(error.response && error.response.data) {
    //   console.error(error.response.data)
    // } else {
    //   console.error(error)
    // }
  }

}

// Listen for data from the inverter
parser.on('data', (data) => {
  // console.log('Received:', data)
  handleData(data)
  // Parse the response string here as needed
})

// Handle errors
port.on('error', (err) => {
  console.error('Serial port error:', err.message);
});
