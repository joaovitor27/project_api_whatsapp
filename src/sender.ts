import parsePhoneNumber, {isValidPhoneNumber} from "libphonenumber-js";
import {create, SocketState, Whatsapp} from "venom-bot";
import axios from "axios";
// @ts-ignore
import http from 'http';
// @ts-ignore
import express, {Request, Response} from "express"
// @ts-ignore
import fs from "fs"
import * as dotenv from 'dotenv';

dotenv.config();
const sqlite = require("./clientsDB");


class Sender {
    private clients: Map<string, Whatsapp> = new Map();
    private timeOutSession: Map<string, Map<string, object>> = new Map();
    private messagesClient: Map<string, string> = new Map();

    constructor() {
        this.initialize().then(r => console.log(r))
    }

    async message(number: string, body: [], session: string) {
        if (!isValidPhoneNumber(number, "BR")) {
            throw new Error("Invalid number!")
        }
        let phoneNumber = parsePhoneNumber(number, "BR")?.format("E.164")?.replace("+", "") as string
        phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`
        let enable = fs.readFileSync("./tokens/" + session + "/enable").toString() == "true";
        if (enable) {
            const client = this.clients.get(session) as Whatsapp
            for (let i = 0; i < body.length; i++) {
                let msg = body[i] as string
                await client.sendText(phoneNumber, msg)
            }
            return 'Message sent successfully'
        } else {
            return 'Error when sending, bot disabled'
        }
    }

    async sendMenu(session: string, number: string, title: string, subTitle: string, description: string, buttonText: string, listMenu: []) {
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
            .catch((error: any) => {
                console.error('Error when sending: ', error);
            });
    }

    async sendButtons(session: string, number: string, msg: string, submsg: string, buttons: any) {
        if (!isValidPhoneNumber(number, "BR")) {
            throw new Error("Invalid number!")
        }
        let phoneNumber = parsePhoneNumber(number, "BR")?.format("E.164")?.replace("+", "") as string
        phoneNumber = phoneNumber.includes("@c.us") ? phoneNumber : `${phoneNumber}@c.us`
        let enable = fs.readFileSync("./tokens/" + session + "/enable").toString() == "true";
        if (enable) {
            const client = this.clients.get(session) as Whatsapp
            await client.sendButtons(phoneNumber, msg, buttons, submsg)
                .then((result) => {
                    console.log('Result: ', result); //return object success
                })
                .catch((error) => {
                    console.error('Error when sending: ', error); //return object error
                });
            return 'Buttons sent successfully'
        } else {
            return 'Error when sending, bot disabled'
        }
    }

    async updateSession(session: any, owner: any, establishment: any) {
        await sqlite.updateSession(session, owner, establishment)
    }

    async dataSession(session: any) {
        await sqlite.getClient(session)
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

    async blackList(session: any) {
        return fs.readdirSync("./tokens/" + session + "/number-enable");
    }

    async versionWA(session: any) {
        const client = this.clients.get(session) as Whatsapp
        return await client.getWAVersion()
    }

    async deleteSession(session: any) {
        await sqlite.deleteSession(session)
        fs.rmdirSync("./tokens/" + session, {recursive: true})
        return "delete successfully"
    }

    async closeSessions() {
        console.log(this.clients.values())
        const clients = await sqlite.getClients();
        for (let index = 0; index < this.clients.size; index++) {
            let element: any = clients[index];
            let session = element["session"]
            const client = this.clients.get(session) as Whatsapp
            await client.close()
        }
        return "closed sessions"
    }

    async healthCheck() {
        return "healthy instance"
    }

    private async initialize() {

        const app = express()
        const server = http.createServer(app);
        const io = require("socket.io")(server, {
            cors: {
                origin: "http://" + process.env.IO_ORIGIN,
                methods: ["GET", "POST"],
                transports: ['websocket', 'polling'],
                credentials: true
            }, allowEIO3: true
        })

        try {
            app.set("view engine", "ejs")
            app.get("/home", (req: Request, res: Response) => {
                res.render('home.ejs')
            })

            app.use(express.static(__dirname + "/static"));
            server.listen(3000, () => {
            })
            await sqlite.crateTable()
            const clients = await sqlite.getClients();
            if (clients != null) {
                for (let index = 0; index < clients.length; index++) {
                    let element: any = clients[index];
                    let session = element["session"]
                    try {
                        await create(session).then((client) => {
                            this.clients.set(client.session, client)
                            fs.writeFile("./tokens/" + client.session + "/enable", "false", (err) => {
                                if (err) throw err;
                            });
                            const path = "tokens/" + client.session + "/number-enable";
                            fs.access(path, (error) => {
                                if (error) {
                                    fs.mkdir(path, {recursive: true}, (error) => {
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
            const botRevGas = axios.create({
                baseURL: "http://" + process.env.BASE_URL
            })
            const postBotRevGas = (client: Whatsapp, messageBody: any, message: any, phoneNumber: string, owner: any, establishment: any, phoneNumberFormat: any) => {
                botRevGas.post("/", {
                    "appPackageName": "venom",
                    "messengerPackageName": "com.whatsapp",
                    "query": {
                        "session": client.session,
                        "type": message["type"],
                        "sender": phoneNumber,
                        "message": messageBody
                    }
                }, {headers: {Token: owner, Id: establishment}})
                    .then(async (res) => {
                        let message1 = res.data["replies"][0]["message"];
                        if (message1.includes("Não entendi") || message1.includes("não entendi") ||
                            message1.includes("Desculpe") || message1.includes("Lamentamos") ||
                            message1.includes("desculpe") || message1.includes("lamentamos") ||
                            message1.includes("sentimos") || message1.includes("Sentimos")) {
                            try {
                                fs.writeFileSync('tokens/' + client.session + '/number-enable/' + phoneNumberFormat, '')
                                await client.sendText("558681243848@c.us", "Bot não entendeu na revenda: " + client.session + " com o cliente: " + phoneNumberFormat)
                            } catch (error) {
                                console.log(error)
                            }
                        } else {
                            if (message1.includes("=@ignore@=")) {
                                console.log('message ignore')
                            } else {
                                let sendText = axios.create({
                                    baseURL: "http://" + process.env.BASE_URL_API
                                })
                                sendText.post("/api/message/", {
                                        'session': client.session,
                                        'number': phoneNumber,
                                        'message': message1
                                    },
                                    {
                                        headers: {
                                            'Authorization': process.env.API_KEY as string,
                                            'Content-Type': 'application/json'
                                        }
                                    }).then((res) => {
                                    console.log("Mensagem enviada!")
                                })
                            }
                        }
                    })
                    .catch((error) => {
                        console.log(error)
                    })
            };
            const timeOutSession = this.timeOutSession
            const messagesClient = this.messagesClient

            // @ts-ignore
            function start(client: Whatsapp) {
                console.log("start:  ===============================", client.session)
                try {
                    client.onAnyMessage(async (message) => {
                        const dataEstablishment = await sqlite.getClient(client.session)
                        const owner = dataEstablishment["ownerClient"]
                        const establishment = dataEstablishment["establishment"]
                        let enable = fs.readFileSync("./tokens/" + client.session + "/enable").toString() == "true";
                        console.log("enable", enable)
                        if (enable && owner != undefined && establishment != undefined) {
                            let origen = message["from"] as string;
                            if (!(origen.includes("@g.us") || origen.includes("@broadcast"))) {
                                if (!(origen != message.chatId)) {
                                    console.log(message.type)
                                    let phoneNumber = parsePhoneNumber(origen, "BR")?.format("E.164")?.replace("@c.us", "") as string;
                                    let phoneNumberFormat = phoneNumber;
                                    phoneNumberFormat = phoneNumberFormat.replace("+", "")
                                    phoneNumberFormat = phoneNumberFormat.replace("-", "")
                                    phoneNumberFormat = phoneNumberFormat.replace(" ", "")
                                    phoneNumberFormat = phoneNumberFormat.substring(0, 4) + "9" + phoneNumberFormat.substring(4);

                                    let listFiles = fs.readdirSync("./tokens/" + client.session + "/number-enable");
                                    let res = listFiles.find(element => element == phoneNumberFormat)
                                    const debounceEvent = (fn: Function, wait: number | undefined) => {
                                        let time: ReturnType<typeof setTimeout>
                                        return function debounceEvent() {
                                            console.log("body: ", message.body)
                                            let messageActual = messagesClient.get(origen);
                                            if (messagesClient.has(origen)) {
                                                if (message.type == 'sticker') {
                                                    console.log("Mensagem:", messageActual)
                                                    messagesClient.set(origen, messageActual as string)
                                                } else {
                                                    messageActual = messageActual + message.body + " "
                                                    console.log("Mensagem:", messageActual)
                                                    messagesClient.set(origen, messageActual)
                                                }
                                            } else {
                                                messagesClient.set(origen, message.body + " ")
                                            }
                                            if (!timeOutSession.has(client.session)) {
                                                timeOutSession.set(client.session, new Map);
                                            }
                                            let map = timeOutSession.get(client.session)
                                            let timeClientSession = timeOutSession.get(client.session)?.get(origen);
                                            if (timeClientSession) {
                                                clearTimeout(timeClientSession as NodeJS.Timeout)
                                            }
                                            time = setTimeout(() => {
                                                timeOutSession.delete(client.session)
                                                let messageActual = messagesClient.get(origen);
                                                messagesClient.delete(origen)
                                                console.log(messageActual)
                                                fn(client, messageActual, message, phoneNumber, owner, establishment, phoneNumberFormat)

                                            }, wait)
                                            if (map != null) {
                                                map.set(origen, time)
                                                console.log("teste")
                                            }
                                        }
                                    }
                                    if (res == null) {
                                        const debounce = debounceEvent(postBotRevGas, 0)
                                        console.log("TIMERRR", debounce())
                                    }
                                }
                            }
                        }
                    })

                    client.onStateChange((state) => {
                        console.log('State changed: ', state);
                        if ('DIS'.includes(state)) {
                            console.log('DISCONNECTED')
                            axios.post(process.env.WEBHOOK_SLACK as string, {
                                "text": "Error in Whatsapp Integration\n" +
                                    "Mudança de status na sessão: " + client.session + "\nStatus atual: " + state
                            })
                        }
                        if ('CONFLICT'.includes(state)) client.useHere();
                        if ('UNPAIRED'.includes(state)) console.log('logout');
                    });

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
                                    socket.on("chamarqr", function () {
                                        socket.emit("qrcode", base64Qr);
                                    });
                                }, undefined, {logQR: false}
                            ).then((client) => {
                                clients.set(client.session, client)
                                fs.writeFile("./tokens/" + client.session + "/enable", "true", (err) => {
                                    if (err) throw err;
                                });
                                const path = "tokens/" + client.session + "/number-enable";

                                fs.access(path, (error) => {
                                    if (error) {
                                        fs.mkdir(path, {recursive: true}, (error) => {
                                            if (error) {
                                                console.log(error);
                                            }
                                        });
                                    }
                                });
                                try {
                                    sqlite.insertData(client.session)
                                } catch {
                                }

                                socket.emit('message', "CONNECTED")
                                start(client);

                            }).catch((error) => {
                                console.log("não foi conectado", error);
                            });
                        } catch (error) {
                            console.log(error)
                        }

                    } else {
                        const client = clients.get(id) as Whatsapp
                        let state;
                        try {
                            state = await client.getConnectionState()
                        } catch {
                            state = "" as SocketState
                        }

                        if (state == "CONNECTED") {
                            socket.emit('message', "CONNECTED")
                        } else {
                            try {
                                create(id, (base64Qr, attempts) => {
                                        socket.emit("attempts", attempts)
                                        socket.on("chamarqr", function () {
                                            socket.emit("qrcode", base64Qr);
                                        });
                                    }, undefined, {logQR: false}
                                ).then((client) => {
                                    clients.set(client.session, client)
                                    fs.writeFile("./tokens/" + client.session + "/enable", "true", (err) => {
                                        if (err) throw err;
                                    });
                                    const path = "tokens/" + client.session + "/number-enable";
                                    fs.access(path, (error) => {
                                        if (error) {
                                            fs.mkdir(path, {recursive: true}, (error) => {
                                                if (error) {
                                                    console.log(error);
                                                }
                                            });
                                        }
                                    });

                                    try {
                                        sqlite.insertData(client.session)
                                    } catch {
                                    }

                                    socket.emit('message', "CONNECTED")
                                    start(client);

                                }).catch((error) => {
                                    console.log("não foi conectado", error);
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
                    let stateBot = fs.readFileSync("./tokens/" + data + "/enable").toString();
                    socket.emit("statusBot", stateBot)
                })
                socket.on("configSession", async function (data: string) {
                    let dataSession = await sqlite.getClient(data)
                    socket.emit("configSession", dataSession)
                })
                socket.on("dataSession", function (data: any) {
                    let session = data['session']
                    let owner = data['owner']
                    let establishment = data['establishment']
                    sqlite.updateSession(session, owner, establishment)
                })
                socket.on("blacklist", function (data: any) {
                    try {
                        let html = ''
                        let listFiles = fs.readdirSync("./tokens/" + data + "/number-enable");
                        for (let index = 0; index < listFiles.length; index++) {
                            const element = listFiles[index];
                            html = (html + `<tr id="${element}"><td>${element}</td><td><button class="btn btn-light" 
                            type="button" style="background-color: #d30000cb;" onclick="removeBlacklist(${element})"><i 
                            style="color: #ffffff;" class="fa fa-trash" aria-hidden="true"></i></button></td></tr>`)
                        }
                        socket.emit("blacklist", html);
                    } catch (error) {
                        console.log(error)
                    }
                })
                socket.on("blacklist-add", function (data: any) {
                    try {
                        fs.writeFileSync("./tokens/" + data['session'] + "/number-enable/" + data['number'], "");
                    } catch (error) {
                        console.log(error)
                    }
                })
                socket.on("blacklist-remove", function (data: any) {
                    try {
                        fs.rmSync("./tokens/" + data['session'] + "/number-enable/" + data['number']);
                    } catch (error) {
                        console.log(error)
                    }
                })
                socket.on("blacklist-all-remove", function (data: any) {
                    let listFiles = fs.readdirSync("./tokens/" + data + "/number-enable");
                    for (let index = 0; index < listFiles.length; index++) {
                        const element = listFiles[index];
                        try {
                            fs.rmSync("./tokens/" + data + "/number-enable/" + element);
                        } catch (error) {
                            console.log(error)
                        }
                    }
                })
            })

        } catch (error) {
            console.log(error)
        }
    }
}

export default Sender
