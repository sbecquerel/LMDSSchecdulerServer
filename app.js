const app = require('express')();
const express = require('express');
const server = require('http').createServer(app);
const fs = require('fs');
const io = require('socket.io').listen(server);

const AUTH_TOKEN = '03DCB31856300AB56FB7313AEB664C76';

app
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .use((req, res, next) => {
    const authorization = req.header('Authorization');

    if (authorization === undefined) {
      return res.status(403).end();
    }

    const matchRes = authorization.match(/^Bearer ([A-Z0-9]+)$/);
    if (matchRes === null || matchRes.length != 2) {
      return res.status(403).end();
    }

    const token = matchRes[1];

    if (token !== AUTH_TOKEN) {
      return res.status(403).end();
    }

    next();
  })
  .get('/calendar', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(fs.readFileSync('./files/calendar.json'));
  })
  .post('/save', (req, res) => {
    if (req.body.teacherName === undefined
      || req.body.studentId === undefined
      || req.body.day === undefined
      || req.body.hour === undefined
      || req.body.minutes === undefined
      || req.body.selected === undefined
    ) {
      return res.status(500).end();
    }

    fs.appendFileSync('./files/result.csv', [
      Date.now(),
      req.body.teacherName,
      req.body.studentId,
      req.body.day,
      req.body.hour,
      req.body.minutes,
      req.body.selected ? 1 : 0,
    ].join(';') + "\n");

    res.status(200).end()
  })
  .use((req, res, next) => {
    res.status(404).end();
  })
  
io
  .on('connection', (socket) => {
    console.log('SocketIO: connection');
    socket.on('toggleStudentStatus', (teacherName, studentId, day, hour, minutes, selected) => {
      console.log('SocketIO: receive toggleStudentStatus message. Parameters: ', teacherName, studentId, day, hour, minutes, selected);
      console.log('SocketIO: broadcast message toggleStudentStatus');
      socket.broadcast.emit('toggleStudentStatus', teacherName, studentId, day, hour, minutes, selected);
    })
  });
  

server.listen(8081);

