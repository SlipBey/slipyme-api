require("dotenv").config();
const fs = require("fs");
const express = require("express");

const routers = fs.readdirSync(`${process.cwd()}/src/routers/`);
const app = express();
const PORT = 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*'); // Tüm kaynaklara izin ver (Dikkatli kullanın)
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

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