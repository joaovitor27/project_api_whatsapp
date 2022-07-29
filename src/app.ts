import console from "console";
import express, { Request, Response } from "express"
import Sender from "./sender";
import * as dotenv from 'dotenv';

const sender = new Sender()

const app = express()
dotenv.config();

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.set("view engine", "ejs")

app.post("/api/message", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({ error: 'unauthorised' })
        } else {
            const { number, message, session } = req.body
            await sender.message(number, message, session)
            return res.status(200).json({ success: "Message sent successfully" })
        }
    } catch (error) {
        console.error("error", error)
        res.status(500).json({ status: "error", message: error })
    }
})

app.post("/api/bot-enable", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({ error: 'unauthorised' })
        } else {
            const { session, enable } = req.body
            await sender.activated(session, enable)
            if (enable) {
                return res.status(200).json({ success: "Bot " + session + " activated" })
            } else {
                return res.status(200).json({ success: "Bot " + session + " disabled" })
            }
        }
    } catch (error) {
        console.error("error", error)
        res.status(500).json({ status: "error", message: error })
    }
})

app.get("/api/data-session", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({ error: 'unauthorised' })
        } else {
            let session = req.query.session
            try {
                var dataSession = await sender.dataSession(session)
                return res.status(200).json(dataSession)
            } catch (e) {
                return res.status(500).json({ success: e })
            }
        }

    } catch (error) {
        console.error("error", error)
        res.status(500).json({ status: "error", message: error })
    }
})

app.post("/api/data-session", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({ error: 'unauthorised' })
        } else {
            const { session, owner, establishment } = req.body
            try {
                await sender.updateSession(session, owner, establishment)
                return res.status(200).json({ success: "Session updated" })
            } catch (e) {
                return res.status(500).json({ success: e })
            }
        }

    } catch (error) {
        console.error("error", error)
        res.status(500).json({ status: "error", message: error })
    }
})

app.post("/api/menu", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({ error: 'unauthorised' })
        } else {
            const { session, number, title, subTitle, description, buttonText, listMenu } = req.body
            await sender.sendListMenu(session, number, title, subTitle, description, buttonText, listMenu)

            return res.status(200).json({ success: "Message sent successfully" })
        }
    } catch (error) {
        console.error("error", error)
        res.status(500).json({ status: "error", message: error })
    }
})

app.post("/api/get-messages", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({ error: 'unauthorised' })
        } else {
            const { number, session } = req.body
            const getMessages = await sender.getMessages(number, session)
            return res.status(200).json(getMessages)
        }

    } catch (error) {
        console.error("error", error)
        res.status(500).json({ status: "error", message: error })
    }
})

app.put("/api/blacklist/:number/remove", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({ error: 'unauthorised' })
        } else {
            const number = req.params
            console.log("saaaaaaaaaaaaaaa",number['number'])
            const { session } = req.body
            await sender.blackListRemove(number['number'], session)
            return res.status(200).json({ result: 'successfully remove' })
        }

    } catch (error) {
        console.error("error", error)
        res.status(404).json({ message: "Number does not exist" })
    }
})

app.post("/api/blacklist", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({ error: 'unauthorised' })
        } else {
            const { number, session } = req.body
            await sender.blackListAdd(number, session)
            return res.status(200).json({ result: 'successfully added' })
        }

    } catch (error) {
        console.error("error", error)
        res.status(404).json({ message: "number already exists" })
    }
})

app.listen(5000, () => { })
