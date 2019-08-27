const app = require('express')();
const express = require('express');
const server = require('http').createServer(app);
const fs = require('fs');

app
  .use(express.urlencoded({ extended: true }))
  .use(express.json())
  .get('/calendar', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(fs.readFileSync('./files/calendar.json'));
  })
  .post('/save', (req, res) => {
    if (req.body.teacherName === undefined
      || req.body.slotName === undefined
      || req.body.studentId === undefined
    ) {
      return res.status(500).end();
    }

    fs.appendFileSync('./files/result.csv', [
      req.body.teacherName,
      req.body.slotName,
      req.body.studentId
    ].join(';') + "\n");

    res.status(200).end()
  })
  .use((req, res, next) => {
    res.status(404).end();
  })
  .listen(8081);
