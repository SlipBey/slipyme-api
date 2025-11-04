import path from "path";
import { client } from "../app";
import { writeLog } from "../libs/fileHandler";
import { Contact } from "../models/Contact";
import { IEmbedProp, sendEmbed } from "../libs/sendEmbed";

export class ContactRepository {

  filePath = path.join(__dirname, "../../jsons/contact.json");

  create(contact: Contact) {

    const embed: IEmbedProp = {
      client,
      channel: "1060188579692818543",
      title: `"${contact.channel}" Kanalından İletişim`,
      description: `İsim & Soyisim: **${contact.name}**\nE-Mail: **${contact.email}**\nTelefon: **${contact.phone ?? "Girmemiş"}**\nKonu: **${contact.subject}**\n\nMesaj: \n**${contact.message}**`,
    };

    sendEmbed(embed);

    writeLog(contact, this.filePath);
  }
}
