import { Client, EmbedBuilder, TextChannel } from "discord.js"

export interface IEmbedProp {
    client: Client;
    channel: string;
    description?: string;
    fields?: { name: string, value: string, inline?: boolean }[];
    title?: string;
}

export const sendEmbed = async (sendEmbed: IEmbedProp) => {

    const image = "https://www.slipyme.com/icons/512x512.png";

    const embed = new EmbedBuilder()
        .setColor("#2563eb")
        .setAuthor({ iconURL: image, name: "Slipyme Company" })
        .setTitle(sendEmbed.title ?? "Slipyme Company")
        .setThumbnail(image)
        .setFooter({ iconURL: image, text: "Slipyme Company" })
        .setTimestamp();

    if (sendEmbed.description && sendEmbed.description.length > 0) {
        embed.setDescription(sendEmbed.description);
    }

    if (sendEmbed.fields && sendEmbed.fields.length > 0) {
        embed.addFields(sendEmbed.fields);
    }

    const channel = sendEmbed.client.channels.cache.get(sendEmbed.channel) as TextChannel;
    if (!channel) throw new Error("Yazı Kanalı Bulunamadı!");

    channel.send({ embeds: [embed] });

}