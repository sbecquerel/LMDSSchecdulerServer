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
  .listen(8081);
