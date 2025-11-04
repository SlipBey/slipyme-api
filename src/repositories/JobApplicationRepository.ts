import path from "path";
import { client } from "../app";
import { writeLog } from "../libs/fileHandler";
import { IEmbedProp, sendEmbed } from "../libs/sendEmbed";
import { JobApplication } from "../models/JobApplication";
import { formatDate } from "../libs/date";

export class JobApplicationRepository {

  filePath = path.join(__dirname, "../../jsons/applications.json");

  create(app: JobApplication) {

    const educations = app.educations?.map(edu => ({
      name: `${edu.name}`,
      value: `${edu.level} - ${formatDate(edu.startTime)}/${edu.endTime ? formatDate(edu.endTime) : "Halen"}`,
      inline: true,
    })) ?? [];

    const jobs = app.jobs?.map(job => ({
      name: `${job.name}`,
      value: `${job.position} - ${formatDate(job.startTime)}/${job.endTime ? formatDate(job.endTime) : "Halen"}`,
      inline: true,
    })) ?? [];

    const embed: IEmbedProp = {
      client,
      channel: "1200179424461598780",
      title: `"${app.app}" Başvurusu`,
      description: `\n\n__**İletişim Bilgileri**__ \n**İsim Soyisim:** ${app.firstname} ${app.lastname}\n**E-Posta:** ${app.email}\n**Telefon:** ${app.phone}\n\n__**Kişisel Bilgiler**__\n**Doğum Tarihi:** ${formatDate(app.birthday)}\n**Adres:** ${app.adress}\n\n**Ek Bilgi:**\n${app.description}`,
      fields: [...educations, ...jobs],
    };

    sendEmbed(embed);

    writeLog(app, this.filePath);
  }
}