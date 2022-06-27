import parsePhoneNumber, { isValidPhoneNumber } from "libphonenumber-js";
import { create, Whatsapp, SocketState, Message } from "venom-bot";
import axios from "axios";


export type QRCode = {
    base64Qr: String
}
export type message = {
    message: String
}
export type cards = {
    buttons: string
}

class Sender {
    private client!: Whatsapp
    private connected!: boolean
    private qr!: QRCode
    private msg!: message
    private cards!: cards

    get getMessage(): message {
        return this.msg
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

    async message(to: string, body: string) {
        if (!isValidPhoneNumber(to, "BR")) {
            throw new Error("Invalid number!")
        }

        let phoneNumber = parsePhoneNumber(to, "BR")?.format("E.164")?.replace("+", "") as string
        phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`

        await this.client.sendText(phoneNumber, body).catch((error) => { console.error('Error when sending: ', error); });
    }

    async getMessages(to: string) {
        if (!isValidPhoneNumber(to, "BR")) {
            throw new Error("Invalid number!")
        }

        let phoneNumber = parsePhoneNumber(to, "BR")?.format("E.164")?.replace("+", "") as string
        phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`

        let messagesAll = await this.client.getAllMessagesInChat(phoneNumber, false, true);
        
        var mensagens: message[] = []
        for (let index = 0; index < messagesAll.length; index++) {
            const element: {[index:string]:any} = messagesAll[index];
            const idMessage = element["id"]
            const type = element["type"]
            const message = element["body"]
            const from = element["from"]
            const to = element["to"]
            const isNewMsg = element["isNewMsg"]
            const isMedia = element["isMedia"]
            const chatId = element["chatId"]
            const mediaData = element["mediaData"]

            if (type == "location"){
                const lat = element["lat"]
                const lng = element["lng"]

                const newMessage = {
                    "idMensagem": idMessage,
                    "type": type,
                    "message": message,
                    "form": from,
                    "to": to,
                    "chatId": chatId,
                    "isNewMsg": isNewMsg,
                    "latitude": lat,
                    "longitude": lng,
                    "isMedia": isMedia,
                    "date": new Date(element["timestamp"] * 1000),
                } as never
                mensagens.push(newMessage)

            } else{
                if (type == "image"||type == "video"||type=="audio"||type=="ptt"){
                    const newMessage = {
                        "idMensagem": idMessage,
                        "type": type,
                        "message": message,
                        "form": from,
                        "to": to,
                        "chatId": chatId,
                        "isNewMsg": isNewMsg,
                        "isMedia": isMedia,
                        "date": new Date(element["timestamp"] * 1000),
                        "mediaData": mediaData
                    } as never
                    mensagens.push(newMessage)

                } else {
                    const newMessage = {
                        "idMensagem": idMessage,
                        "type": type,
                        "message": message,
                        "form": from,
                        "to": to,
                        "chatId": chatId,
                        "isNewMsg": isNewMsg,
                        "isMedia": isMedia,
                        "date": new Date(element["timestamp"] * 1000)
                    } as never
                    mensagens.push(newMessage)
                }
            }
        }
        return mensagens
    }


    // async sendButtons(number:string, title:string, buttons:[], description:string) {

    //     if (!isValidPhoneNumber(number, "BR")) {
    //         throw new Error("Esse Numero não é valido")
    //     }
    //     let phoneNumber = parsePhoneNumber(number, "BR")?.format("E.164")?.replace("+", "") as string

    //     phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`

    //     await this.client.sendButtons(phoneNumber, title, buttons, description)
    //     .then((result) => {
    //         console.log('Result: ', result);
    //     })
    //     .catch((erro) => {
    //         console.error('Error when sending: ', erro);
    //     });
    // }


    async sendListMenu(number:string, title: string, subTitle: string, description: string, buttonText:string, listMenu: []) {
        if (!isValidPhoneNumber(number, "BR")) {
            throw new Error("Invalid number!")
        }

        let phoneNumber = parsePhoneNumber(number, "BR")?.format("E.164")?.replace("+", "") as string
        phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`

        await this.client.sendListMenu(phoneNumber, title, subTitle, description, buttonText, listMenu)
          .then((result) => {
            console.log('Result: ', result); //return object success
          })
          .catch((erro) => {
            console.error('Error when sending: ', erro); //return object error
          });
          
    }

    async closeSession(){
        console.log(this.client)
        this.client.close();
    }  

    private initialize() {
        const qr = (base64Qr: string) => {
            this.qr = { base64Qr }
        }

        const status = (statusSession: string, session: string) => {
            this.connected = ["inLogged", "qrReadSuccess", "chatsAvailable"].includes(statusSession)
        }

        try{
            const start = (client: Whatsapp) => {
                this.client = client
                client.onStateChange((state) => {
                    this.connected = state === SocketState.CONNECTED
                    
                })
                const botRevGas = axios.create({
                    baseURL: "http://18.231.43.57"
                })
                try{
                client.onAnyMessage(async (message) => {
                    var origen = message["from"] as string
                    if (!(origen.includes("@g.us") || origen.includes("@broadcast"))) {
                        if (!(origen != message.chatId)) {
                            let phoneNumber = parsePhoneNumber(message.from, "BR")?.format("E.164")?.replace("@c.us", "") as string
                            botRevGas.post("/", {
                                "appPackageName": "venom",
                                "messengerPackageName": "com.whatsapp",
                                "query": {
                                    "sender": phoneNumber,
                                    "message": message.body,
                                    "isGroup": false,
                                    "groupParticipant": "",
                                    "ruleId": 43,
                                    "isTestMessage": false
                                }
                            },
                            {headers: {Token: 7, Id: 19}}).
                            then(async (res) => {
                                await this.client.sendText(message.from as string, res.data["replies"][0]["message"] as string)
                            }).catch((error) => {
                                console.log(error)
                            })
                        }
                    }
                })
                }catch(error){
                    console.log(error)
                }
            }
            create('revgas', qr).then((revgas) => { start(revgas) }).catch((error) => { console.error(error) })

        }catch(error){
            console.log(error)
        }

    }
}

export default Sender

