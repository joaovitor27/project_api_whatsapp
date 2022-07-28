import parsePhoneNumber, { isValidPhoneNumber } from "libphonenumber-js";
import { create, SocketState, Whatsapp } from "venom-bot";
import axios from "axios";
import http from 'http';
import express, { Request, Response } from "express"
import fs from "fs"
import * as dotenv from 'dotenv';

dotenv.config();
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

    async sendListMenu(session: string, number: string, title: string, subTitle: string, description: string, buttonText: string, listMenu: []) {
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

    async updateSession(session: any, owner: any, establishment: any) {
        sqlite.updateSession(session, owner, establishment)
    }

    async activated(session: any, enable: any) {
        if (!enable) {
            fs.writeFileSync("./tokens/" + session + "/enable", "false");
        } else {
            fs.writeFileSync("./tokens/" + session + "/enable", "true");
        }
    }

    async blackListAdd(number: any, session: any) {
        fs.writeFileSync("./tokens/" + session + "/number-enable/" + number, "");
    }

    async blackListRemove(number: any, session: any) {
        fs.rmSync("./tokens/" + session + "/number-enable/" + number);
    }

    private async initialize() {

        const app = express()
        const server = http.createServer(app);
        const io = require("socket.io")(server, { cors: { origin: "http://" + process.env.IO_ORIGIN, methods: ["GET", "POST"], transports: ['websocket', 'polling'], credentials: true }, allowEIO3: true })

        try {
            app.set("view engine", "ejs")
            app.get("/home", (req: Request, res: Response) => {
                res.render('home.ejs')
            })

            app.use(express.static(__dirname + "/static"));
            server.listen(3000, () => { })
            sqlite.crateTable()
            var clients = await sqlite.getClients()
            if (clients != null) {
                for (let index = 0; index < clients.length; index++) {
                    var element: any = clients[index];
                    var session = element["session"]
                    try {
                        await create(session).then((client) => {
                            this.clients.set(client.session, client)
                            fs.writeFile("./tokens/" + client.session + "/enable", "false", (err) => {
                                if (err) throw err;
                            });
                            const path = "tokens/" + client.session + "/number-enable";
                            fs.access(path, (error) => {
                                if (error) {
                                    fs.mkdir(path, { recursive: true }, (error) => {
                                        if (error) {
                                            console.log(error);
                                        }
                                    });
                                }
                            });
                            start(client)
                        }).catch((error) => {
                            console.error(error)
                        })
                    } catch (error) {
                        console.log(error)
                    }
                }
            }

            function start(client: Whatsapp) {
                const botRevGas = axios.create({
                    baseURL: "http://" + process.env.BASE_URL
                })
                try {
                    client.onAnyMessage(async (message) => {
                        const dataEstablishment = await sqlite.getClient(client.session)
                        const owner = dataEstablishment["ownerClient"]
                        const establishment = dataEstablishment["establishment"]
                        var enable = fs.readFileSync("./tokens/" + client.session + "/enable").toString() == "true"

                        if (enable && owner != undefined && establishment != undefined) {
                            var origen = message["from"] as string
                            if (!(origen.includes("@g.us") || origen.includes("@broadcast"))) {
                                if (!(origen != message.chatId)) {
                                    var phoneNumber = parsePhoneNumber(origen, "BR")?.format("E.164")?.replace("@c.us", "") as string
                                    var path = ".tokens/" + client.session + "/number-enable/" + phoneNumber;
                                    fs.access(path, (error) => {
                                        if (error) {
                                            botRevGas.post("/", {
                                                "appPackageName": "venom",
                                                "messengerPackageName": "com.whatsapp",
                                                "query": {
                                                    "session": client.session,
                                                    "type": message["type"],
                                                    "sender": phoneNumber,
                                                    "message": message.body
                                                }
                                            },
                                                { headers: { Token: owner, Id: establishment } })
                                                .then(async (res) => {
                                                    var message1 = res.data["replies"][0]["message"]
                                                    if (message1.includes("Não entendi") || message1.includes("não entendi") || message1.includes("Desculpe") || message1.includes("Lamentamos") || message1.includes("desculpe") || message1.includes("lamentamos") || message1.includes("sentimos") || message1.includes("Sentimos")) {
                                                        try {
                                                            fs.writeFile('tokens/' + client.session + '/number-enable/' + phoneNumber.replace("+", ""), '', (err) => {
                                                                if (err) throw err;
                                                            });
                                                            await client.sendText("558681243848@c.us", "Bot não entendeu na revenda: " + client.session + "com o cliente: " + phoneNumber)
                                                        } catch (erro) {
                                                            console.log(erro)
                                                        }
                                                    } else {
                                                        if (message1.includes("==list_values==")) {
                                                            console.log("Enviado a lista de Preço")
                                                        } else {
                                                            await client.sendText(message.from as string, message1 as string)
                                                        }
                                                    }
                                                })
                                                .catch((error) => {
                                                    console.log(error)
                                                })
                                        }
                                    });
                                }
                            }
                        }
                    })
                } catch (error) {
                    console.log(error)
                }
            }

            io.on("connection", (socket: { [x: string]: any; id: string; }) => {
                const clients = this.clients
                async function createSession(id: string) {
                    if (clients.size == 0) {
                        try {
                            create(id, (base64Qr, attempts) => {
                                socket.emit("attempts", attempts)
                                socket.on("chamarqr", function (data: string) {
                                    socket.emit("qrcode", base64Qr);
                                });
                            }, undefined, { logQR: false }
                            ).then((client) => {
                                clients.set(client.session, client)
                                fs.writeFile("./tokens/" + client.session + "/enable", "true", (err) => {
                                    if (err) throw err;
                                });
                                const path = "tokens/" + client.session + "/number-enable";

                                fs.access(path, (error) => {
                                    if (error) {
                                        fs.mkdir(path, { recursive: true }, (error) => {
                                            if (error) {
                                                console.log(error);
                                            }
                                        });
                                    }
                                });
                                try {
                                    sqlite.insertDados(client.session)
                                } catch { }

                                socket.emit('message', "CONNECTED")
                                start(client);

                            }).catch((erro) => {
                                console.log("não foi conectado", erro);
                            });
                        } catch (error) {
                            console.log(error)
                        }

                    } else {
                        const client = clients.get(id) as Whatsapp
                        try {
                            var state = await client.getConnectionState()
                        } catch {
                            var state = "" as SocketState
                        }

                        if (state == "CONNECTED") {
                            socket.emit('message', "CONNECTED")
                        } else {
                            try {
                                create(id, (base64Qr, attempts) => {
                                    socket.emit("attempts", attempts)
                                    socket.on("chamarqr", function (data: string) {
                                        socket.emit("qrcode", base64Qr);
                                    });
                                }, undefined, { logQR: false }
                                ).then((client) => {
                                    clients.set(client.session, client)
                                    fs.writeFile("./tokens/" + client.session + "/enable", "true", (err) => {
                                        if (err) throw err;
                                    });
                                    const path = "tokens/" + client.session + "/number-enable";
                                    fs.access(path, (error) => {
                                        if (error) {
                                            fs.mkdir(path, { recursive: true }, (error) => {
                                                if (error) {
                                                    console.log(error);
                                                }
                                            });
                                        }
                                    });

                                    try {
                                        sqlite.insertDados(client.session)
                                    } catch { }

                                    socket.emit('message', "CONNECTED")
                                    start(client);

                                }).catch((erro) => {
                                    console.log("não foi conectado", erro);
                                });
                            } catch (error) {
                                console.log(error)
                            }
                        }
                    }
                }

                socket.on("create-session", function (data: { id: string; }) {
                    createSession(data.id)
                });

                socket.on("activatedBot", function (data: { session: string; status: string | NodeJS.ArrayBufferView; }) {
                    fs.writeFileSync("./tokens/" + data.session.toString() + "/enable", data.status.toString())
                })
                socket.on("statusBot", function (data: string) {
                    var stateBot = fs.readFileSync("./tokens/" + data + "/enable").toString()
                    socket.emit("statusBot", stateBot)
                })
            })

        } catch (error) {
            console.log(error)
        }
    }
}

export default Sender
