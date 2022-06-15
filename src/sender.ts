import parsePhoneNumber, {isValidPhoneNumber} from "libphonenumber-js";
import { create, Whatsapp, Message, SocketState } from "venom-bot";


export type QRCode = {
    base64Qr: String
}
export type mensagens ={
    mensagens: String
}

class Sender {
    private client!: Whatsapp
    private connected!: boolean
    private qr!: QRCode
    private mensagens!: mensagens

    get getMensagens(): mensagens{
        return this.mensagens
    }
    get isConnected() : boolean {
        return this.connected
    }
    
    get qrCode() : QRCode {
        return this.qr
    }
    

    constructor() {
        this.initialize()
    }

    async sendText(to: string, body: string){

        if (!isValidPhoneNumber(to, "BR")){
            throw new Error("Esse Numero não é valido")
        }

        let phoneNumber = parsePhoneNumber(to, "BR")?.format("E.164")?.replace("+", "") as string

        phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`

        console.log("phoneNumber", phoneNumber)

        await this.client.sendText(phoneNumber, body)
        .then((result) => {console.log('Result: ', result);})
        .catch((error) => {console.error('Error when sending: ', error);});
    }

    
    async getAllMessagesInChat(to: string){

        if (!isValidPhoneNumber(to, "BR")){
            throw new Error("Esse Numero não é valido")
        }

        let phoneNumber = parsePhoneNumber(to, "BR")?.format("E.164")?.replace("+", "") as string

        phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`

        var all = await this.client.getAllMessagesInChat(phoneNumber, true, false)
        var mensagens: mensagens[] = []
        for (let index = 0; index < all.length; index++) {
            const element = all[index];
            const idmensagem = element["id"] 
            const mensagen = element["body"]
            const from = element["from"]
            const to = element["to"]
            const sender = element["sender"]

            const newMessage = {"idmensagem":idmensagem, "mensagem":mensagen, "form": from, "to":to, "sender":sender} as never

            mensagens.push(newMessage)
        }
        console.log("mensagens", mensagens)
        return mensagens
    }

    private initialize() {
        const qr = (base64Qr: string) => {
            this.qr = { base64Qr }
        }
        const status = (statusSession: string, session:string) => {
            this.connected = ["inLogged", "qrReadSuccess", "chatsAvailable"].includes(statusSession)
        }
        const start = (client: Whatsapp) => {
            this.client = client
            client.onStateChange((state) => {
                this.connected = state === SocketState.CONNECTED
            })

        }
        
        create('senderws', qr).then((client) => {start(client)}).catch((error) => {console.error(error)})
    }
}

export default Sender

