// @ts-ignore
import console from "console";
// @ts-ignore
import express, {Request, response, Response} from "express"
import Sender from "./sender";
import axios from "axios";
import * as dotenv from 'dotenv';


const sender = new Sender()

const app = express()
dotenv.config();

app.use(express.json())
app.use(express.urlencoded({extended: false}))
app.set("view engine", "ejs")

app.post("/api/message", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'});
        } else {
            let {number, message, session} = req.body;
            session = session.replace(/\D/g, '')
            try {
                const message_res = await sender.message(number, message, session);
                return res.status(200).json({reply: message_res});
            } catch (e: any) {
                axios.post(process.env.WEBHOOK_SLACK as string, {"text": "Error in Whatsapp Integration\n" + e.toString() + "Session:" + session})
                    .catch((error: any) => {
                        console.error('Error when sending: ', error);
                    });
                console.error(e);
                console.error(req);
                return res.status(500).json({error: e.message});
            }
        }
    } catch (error) {
        console.error("error", error)
        res.status(500).json({status: "error", message: error})
    }
})

app.post("/api/bot-enable", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'})
        } else {
            let {session, enable} = req.body
            session = session.replace(/\D/g, '')
            await sender.activated(session, enable)
            if (enable) {
                return res.status(200).json({success: "Bot " + session + " activated"})
            } else {
                return res.status(200).json({success: "Bot " + session + " disabled"})
            }
        }
    } catch (error) {
        console.error("error", error)
        res.status(500).json({status: "error", message: error})
    }
})

app.get("/api/data-session", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'})
        } else {
            let session = req.query.session
            try {
                let dataSession = await sender.dataSession(session);
                return res.status(200).json(dataSession)
            } catch (e) {
                return res.status(500).json({success: e})
            }
        }

    } catch (error) {
        console.error("error", error)
        res.status(500).json({status: "error", message: error})
    }
})

app.post("/api/data-session", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'})
        } else {
            const {session, owner, establishment} = req.body
            try {
                await sender.updateSession(session, owner, establishment)
                return res.status(200).json({success: "Session updated"})
            } catch (e) {
                return res.status(500).json({success: e})
            }
        }

    } catch (error) {
        console.error("error", error)
        res.status(500).json({status: "error", message: error})
    }
})

app.post("/api/menu", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'})
        } else {
            let {session, number, title, subTitle, description, buttonText, listMenu} = req.body
            session = session.replace(/\D/g, '')
            await sender.sendMenu(session, number, title, subTitle, description, buttonText, listMenu)
            return res.status(200).json({success: "Message sent successfully"})
        }
    } catch (error) {
        console.error("error", error)
        res.status(500).json({status: "error", message: error})
    }
})

app.post("/api/buttons", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'})
        } else {
            let {number, session, message, buttons, submsg = 'teste'} = req.body
            session = session.replace(/\D/g, '')
            const buttonsRes = await sender.sendButtons(session, number, message, submsg, buttons)
            return res.status(200).json({reply: buttonsRes})
        }

    } catch (error) {
        console.error("error", error)
        res.status(500).json({status: "error", message: error})
    }
})

app.put("/api/blacklist/:number/remove", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'})
        } else {
            const number = req.params
            const {session} = req.body
            await sender.blackListRemove(number['number'], session)
            return res.status(200).json({result: 'successfully remove'})
        }

    } catch (error) {
        console.error("error", error)
        res.status(404).json({message: "Number does not exist"})
    }
})

app.post("/api/blacklist", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'})
        } else {
            const {number, session} = req.body
            await sender.blackListAdd(number, session)
            return res.status(200).json({result: 'successfully added'})
        }

    } catch (error) {
        console.error("error", error)
        res.status(404).json({message: "number already exists"})
    }
})

app.get("/api/blacklist", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'})
        } else {
            let session = req.query.session
            let blackList = await sender.blackList(session)
            return res.status(200).json(blackList)
        }

    } catch (error) {
        console.error("error", error)
        res.status(404).json({message: "session already exists"})
    }
})

app.post("/api/version-web", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'})
        } else {
            const {session} = req.body
            const version = await sender.versionWA(session)
            return res.status(200).json({result: version})
        }

    } catch (error) {
        console.error("error", error)
        res.status(404).json({message: "session already exists"})
    }
})

app.delete("/api/delete-session/:session", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'})
        } else {
            const {session} = req.params
            const result = await sender.deleteSession(session)
            return res.status(200).json({result: result})
        }

    } catch (error) {
        console.error("error", error)
        res.status(404).json({message: "session already exists"})
    }
})

app.get("/api/close-session", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'})
        } else {
            const result = await sender.closeSessions()
            return res.status(200).json({result: result})
        }

    } catch (error) {
        console.error("error", error)
        res.status(404).json({message: "session already exists"})
    }
})

app.listen(5000, () => {
    console.log('STARTED!')
})
