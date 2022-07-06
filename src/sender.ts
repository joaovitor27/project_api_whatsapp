import parsePhoneNumber, { isValidPhoneNumber } from "libphonenumber-js";
import { create, Whatsapp } from "venom-bot";
import axios from "axios";
import http from 'http';
import express, { Request, Response } from "express"
import fs from "fs"
import { Buffer } from 'buffer';

var sqlite = require("./clientsDB");


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
    private clients: Map<string, Whatsapp> = new Map();
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

    async message(to: string, body: string, session: string) {
        if (!isValidPhoneNumber(to, "BR")) {
            throw new Error("Invalid number!")
        }
        let phoneNumber = parsePhoneNumber(to, "BR")?.format("E.164")?.replace("+", "") as string
        phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`

        const client = this.clients.get(session) as Whatsapp
        await client.sendText(phoneNumber, body).catch((error: any) => { console.error('Error when sending: ', error); });
    }

    async getMessages(to: string, session: string) {
        if (!isValidPhoneNumber(to, "BR")) {
            throw new Error("Invalid number!")
        }
        let phoneNumber = parsePhoneNumber(to, "BR")?.format("E.164")?.replace("+", "") as string
        phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`

        const client = this.clients.get(session) as Whatsapp
        let messagesAll = await client.getAllMessagesInChat(phoneNumber, false, true);

        var mensagens: message[] = []
        for (let index = 0; index < messagesAll.length; index++) {
            const element: { [index: string]: any } = messagesAll[index];
            const idMessage = element["id"]
            const type = element["type"]
            const message = element["body"]
            const from = element["from"]
            const to = element["to"]
            const isNewMsg = element["isNewMsg"]
            const isMedia = element["isMedia"]
            const chatId = element["chatId"]
            const mediaData = element["mediaData"]

            if (type == "location") {
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

            } else {
                if (type == "image" || type == "video" || type == "audio" || type == "ptt") {
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


    async sendListMenu(session:string ,number: string, title: string, subTitle: string, description: string, buttonText: string, listMenu: []) {
        if (!isValidPhoneNumber(number, "BR")) {
            throw new Error("Invalid number!")
        }
        let phoneNumber = parsePhoneNumber(number, "BR")?.format("E.164")?.replace("+", "") as string
        phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`

        const client = this.clients.get(session) as Whatsapp
        await client.sendListMenu(phoneNumber, title, subTitle, description, buttonText, listMenu)
            .then((result: any) => {
                console.log('Result: ', result);
            })
            .catch((erro: any) => {
                console.error('Error when sending: ', erro);
            });

    }


    async activated(session: any, enable: any) {
        if (!enable) {
            fs.writeFileSync("./tokens/" + session + "/enable", "false");
        } else {
            fs.writeFileSync("./tokens/" + session + "/enable", "true");
        }
    }


    private async initialize() {

        const app = express()
        const server = http.createServer(app);
        const io = require("socket.io")(server, { cors: { origin: "http://localhost:3000", methods: ["GET", "POST"], transports: ['websocket', 'polling'], credentials: true }, allowEIO3: true })
        
        try {
            app.set("view engine", "ejs")

            app.get("/home", (req: Request, res: Response) => {
                res.render('home.ejs')
            })

            app.use(express.static(__dirname + "/static"));
            server.listen(3000, () => { })
            //sqlite.crateTable()
            io.on("connection", async (socket: {[x: string]: any; id: string;}) => {
                var clients = await sqlite.getClients()

                for(let index = 0; index < clients.length; index++){
                    var element: any = clients[index];
                    var session = element["session"]
                    try{
                        await create(session).then((client) => { start(client) }).catch((error) => { console.error(error) })
                    } catch (error) {
                        console.log(error)
                    }
                }

                function start (client: Whatsapp) {
                    const botRevGas = axios.create({
                        baseURL: "http://18.231.43.57"
                    })

                    try {
                        client.onAnyMessage(async (message) => {
                            var enable = fs.readFileSync("./tokens/" + client.session + "/enable").toString() == "true"
                            if (enable) {
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
                                        },{ headers: { Token: 7, Id: 19 } })
                                        .then(async (res) => {
                                            await client.sendText(message.from as string, res.data["replies"][0]["message"] as string)
                                        })
                                        .catch((error) => {
                                            console.log(error)
                                        })
                                    }
                                }
                            }
                        })
                    } catch (error) {
                        console.log(error)
                    }
                }

                const createSession = (id: string) => {
                    try{
                        create(id, (base64Qr, attempts) => {

                            socket.emit("attempts", attempts)
                            var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/) as any, response = {} as any;
                            if (matches.length !== 3) {
                                return new Error('Invalid input string');
                            }
    
                            response.type = matches[1];
                            response.data = Buffer.from(matches[2], 'base64');
                            var imageBuffer = response;
                            require('fs').writeFile(
                                './src/static/QRcodes/' + id + ".png",
                                imageBuffer['data'],
                                'binary',
                                function (err: null) {
                                    if (err != null) {
                                        console.log(err);
                                    }
                                }
                            );
                        }, undefined, { logQR: false }
                        ).then((client) => {

                            this.clients.set(client.session, client)

                            fs.writeFile("./tokens/" + client.session + "/enable", "true", (err) => {
                                if (err) throw err;
                            });

                            sqlite.insertDados(client.session, client)
                            socket.emit('message', "CONNECTED")
                            
                            start(client);

                        }).catch((erro) => { 
                            console.log("não foi conectado", erro); 
                        });

                    } catch (error) {
                        console.log(error)
                    }
                    //create(id, qr).then((client) => { start(client) }).catch((error) => { console.error(error) })
                }

                socket.on("create-session", function (data: { id: string; }) {
                    console.log("create session:", data.id)
                    createSession(data.id)
                });
                
                socket.on("chamarqr", function (data: string) {
                    socket.emit("qrcode","QRcodes/"+ data + ".png");
                });

                socket.on("activatedBot", function(data: { session: string; status: string | NodeJS.ArrayBufferView; }){
                    fs.writeFileSync("./tokens/" + data.session.toString() + "/enable", data.status.toString())
                    socket.emit("statusBot", data.status)
                })

            })

        } catch (error) {
            console.log(error)
        }

    }
}

export default Sender

