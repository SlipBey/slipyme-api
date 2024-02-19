require("dotenv").config();
const fs = require("fs");
const express = require("express");
const cors = require("cors");

const routers = fs.readdirSync(`${process.cwd()}/src/routers/`);
const app = express();
const PORT = 8080;

app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  const token = req.headers["authorization"];

  if (!token || token !== `Bearer ${process.env.TOKEN}`) {
    return res
      .status(401)
      .json({ status: "error", message: "Unauthorized: Invalid token" });
  } else {
    next();
  }
});

for (let route of routers) {
  const router = require(`${process.cwd()}/src/routers/${route}`);
  app.use(router.name, router.router);
}

// process.on("unhandledRejection", (a, b) => {})

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
