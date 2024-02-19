"use strict";

require("dotenv").config();
const webhook = require("webhook-discord")

const router = require("express").Router();
const Hook = new webhook.Webhook(process.env.CONTACT_WEBHOOK);

router.post("/", async (req, res) => {
  try {
    const result = await onContact(req.body);
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json(error);
  }
});

async function onContact(data) {
  if (data) {
    const msg = new webhook.MessageBuilder()
      .setName(data.name)
      .setText(
        `Mail: **${data.email}** - Telefon: **${data.phone}** - Konu: **${data.subject}** \nMesaj: **${data.message}**`,
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
  name: "/contact",
  router,
};
