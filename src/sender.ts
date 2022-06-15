import parsePhoneNumber, {isValidPhoneNumber} from "libphonenumber-js";
import { create, Whatsapp, Message, SocketState } from "venom-bot";


export type QRCode = {
    base64Qr: String
}

class Sender {
    private client!: Whatsapp
    private connected!: boolean
    private qr!: QRCode

    
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

    async getAllMessagesInChat(){
        let result
        await this.client.getAllMessagesInChat("558694404204@c.us", true, false)
        .then((result) => {
            return result})
        .catch((error) => {console.error('Error when sending: ', error);})

        console.log("aquiiiiiiiiiiiii")
        console.log("aquiiiiiiiiiiiii")

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

