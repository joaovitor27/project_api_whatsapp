import parsePhoneNumber, { isValidPhoneNumber } from "libphonenumber-js";
import { create, Whatsapp, Message, SocketState } from "venom-bot";


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

    get card(): cards{
        return this.cards
    }

    constructor() {
        this.initialize()
    }

    async sendCard() {
        var buttons = []
        buttons = [
            {
                "buttonText": {
                    "displayText": "Text of Button 1"
                }
            } as never,
            {
                "buttonText": {
                    "displayText": "Text of Button 2"
                }
            } as never
        ]
        await this.client.sendButtons('5586994404204@c.us', 'Teste', buttons as [], 'teste de envio de botões')

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
        this.client.options.debug = true;
        if (!isValidPhoneNumber(to, "BR")) {
            throw new Error("Esse Numero não é valido")
        }

        let phoneNumber = parsePhoneNumber(to, "BR")?.format("E.164")?.replace("+", "") as string

        phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`

        console.log("Phone", phoneNumber)

        // let chats = await this.client.getAllChats();
        // console.log("chat", chats)

        let chat = await this.client.getChatById(phoneNumber);
        console.log("chat", chat)
        
        let messagesAll = await this.client.getAllMessagesInChat(phoneNumber, false, true);
        // console.log("messages", messagesAll)

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
                    //  "sender": sender
                     } as never

            mensagens.push(newMessage)
        }
        console.log("mensagens", mensagens)
        return mensagens
    }

    private initialize() {
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
        create('arthur', qr).then((client) => { start(client) }).catch((error) => { console.error(error) })
        // create('revbot', qr).then((client) => { start(client) }).catch((error) => { console.error(error) })
    }
}

export default Sender

