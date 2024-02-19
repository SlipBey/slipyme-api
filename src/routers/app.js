"use strict";

require("dotenv").config();
const webhook = require("webhook-discord");

const router = require("express").Router();
const Hook = new webhook.Webhook(process.env.APP_WEBHOOK);

router.post("/", async (req, res) => {
  try {
    const result = await onApp(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

async function onApp(data) {
  if (data) {
    const msg = new webhook.MessageBuilder()
      .setName(data.name)
      .setText(
        `İsim: **${data.name}**, Yaş: **${data.old}**, İletişim; Discord: **${data.contact.discord}** Mail: **${data.contact.email}**, İş: **${data.job}**, Pozisyon: **${data.position}**, Deneyim: **${data.experience}**, \n İlgi Alanları: **${data.interest.join(", ")}**`,
      );
    Hook.send(msg);

    return {
      status: "success",
      message: "Post received and saved successfully!",
    };
  } else {
    return { status: "error", message: "Error processing POST request!" };
  }
}

module.exports = {
  name: "/app",
  router,
};
