import path from "path";
import { client } from "../app";
import { writeLog } from "../libs/fileHandler";
import { IEmbedProp, sendEmbed } from "../libs/sendEmbed";
import { Mail } from "../models/Mail";

export class MailAddRepository {

  filePath = path.join(__dirname, "../../jsons/mails.json");

  add(mail: Mail) {

    const embed: IEmbedProp = {
      client,
      channel: "1354543916157763777",
      title: `Mail Ekleme`,
      description: `E-Mail: **${mail.email}**`,
    };

    sendEmbed(embed);

    writeLog(mail, this.filePath);
  }
}
