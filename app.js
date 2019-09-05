const app = require('express')();
const express = require('express');
const server = require('http').createServer(app);
const fs = require('fs');

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
  .listen(8081);
