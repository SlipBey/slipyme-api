'use strict';

const router = require("express").Router();

router.get("/", (req, res) => {
  res.status(500);
});

module.exports = {
  name: "/",
  router
}