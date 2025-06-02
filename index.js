import express from 'express'
import Connection from './conection/conection.js'
import signup from './users/signup.js'
import { createServer } from 'http';
import { Server } from 'socket.io';
import login from './users/login.js';
const app = express()
const port = 3000
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import setupSocket, { onlineUsers } from './socketmaneger/socketmange.js';
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});
app.use(cors())
app.use(bodyParser.json())
app.use(express.json());

app.use(bodyParser.urlencoded({ extended: true }))
app.use(express.static('public'))
app.use('/api', signup(io),express.static('public'))
app.use('/api', login(io, onlineUsers),express.static('public'))
app.get('/', (req, res) => {
  res.send('Hello World!')
})
Connection();
setupSocket(io);
httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})