import parsePhoneNumber, { isValidPhoneNumber } from "libphonenumber-js";
import { create, Whatsapp, SocketState } from "venom-bot";
import axios from "axios";

export type QRCode = {
    base64Qr: String
}
export type mensagens = {
    mensagens: String
}
export type cards = {
    buttons: string
}

class Sender {
    private client!: Whatsapp
    private connected!: boolean
    private qr!: QRCode
    private mensagens!: mensagens
    private cards!: cards

    get getMensagens(): mensagens {
        return this.mensagens
    }
    get isConnected(): boolean {
        return this.connected
    }

    get qrCode(): QRCode {
        return this.qr
    }

    get card(): cards {
        return this.cards
    }

    constructor() {
        this.initialize()
    }


    async capturaMensagem() {
        const botRevGas = axios.create({
            baseURL: "http://18.231.43.57"
        })
        this.client.onAnyMessage((mensagem) => {
            var origen = mensagem["from"] as string
            if (origen.includes("@g.us") || origen.includes("@broadcast")) {
            } else {
                if (origen != mensagem.chatId) {

                } else {
                    let phoneNumber = parsePhoneNumber(mensagem.from, "BR")?.format("E.164")?.replace("@c.us", "") as string

                    botRevGas.post("/", {
                        "appPackageName": "venom",
                        "messengerPackageName": "com.whatsapp",
                        "query": {
                            "sender": phoneNumber,
                            "message": mensagem.body,
                            "isGroup": false,
                            "groupParticipant": "",
                            "ruleId": 43,
                            "isTestMessage": false
                        }
                    },
                    {headers: {Token: 7, Id: 19}}).
                    then(async (res) => {
                        await this.client.sendText(mensagem.from as string, res.data["replies"][0]["message"] as string)
                    }).catch((error) => {
                        console.log(error)
                    })
                }
            }
        })
    }


    async sendText(to: string, body: string) {

        if (!isValidPhoneNumber(to, "BR")) {
            throw new Error("Esse Numero não é valido")
        }

        let phoneNumber = parsePhoneNumber(to, "BR")?.format("E.164")?.replace("+", "") as string

        phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`

        console.log("phoneNumber", phoneNumber)

        await this.client.sendText(phoneNumber, body)
            .then((result) => { console.log('Result: ', result); })
            .catch((error) => { console.error('Error when sending: ', error); });
    }

    async getAllMessagesInChat(to: string) {

        if (!isValidPhoneNumber(to, "BR")) {
            throw new Error("Esse Numero não é valido")
        }

        let phoneNumber = parsePhoneNumber(to, "BR")?.format("E.164")?.replace("+", "") as string

        phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`

        let chat = await this.client.getChatById(phoneNumber);

        let messagesAll = await this.client.getAllMessagesInChat(phoneNumber, false, true);

        var mensagens: mensagens[] = []
        for (let index = 0; index < messagesAll.length; index++) {
            const element = messagesAll[index];
            const idmensagem = element["id"]
            const mensagen = element["body"]
            const from = element["from"]
            const to = element["to"]
            const sender = element["sender"]

            const newMessage = {
                "idmensagem": idmensagem,
                "mensagem": mensagen,
                "form": from,
                "to": to,
                "date": new Date(element["timestamp"] * 1000),
                "sender": sender
            } as never

            mensagens.push(newMessage)
        }
        return mensagens
    }


    private async initialize() {
        const qr = (base64Qr: string) => {
            this.qr = { base64Qr }
        }

        const status = (statusSession: string, session: string) => {
            this.connected = ["inLogged", "qrReadSuccess", "chatsAvailable"].includes(statusSession)
        }

        const start = (client: Whatsapp) => {
            this.client = client
            client.onStateChange((state) => {
                this.connected = state === SocketState.CONNECTED
            })
        }
        
        await create('revgas', qr).then((client) => { start(client) }).catch((error) => { console.error(error) })
        this.capturaMensagem()
    }
}

export default Sender

