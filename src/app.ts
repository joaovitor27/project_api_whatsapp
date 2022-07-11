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


app.get("/status", (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({ error: 'unauthorised' })
        } else {
            return res.status(200).json({
                qr_code: sender.qrCode,
                connected: sender.isConnected
            })
        }
    } catch (error) {
        console.error("error", error)
        res.status(500).json({ status: "error", message: error })
    }

})


app.post("/message", async (req: Request, res: Response) => {
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


app.post("/bot-enable", async (req: Request, res: Response) => {
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


app.post("/update-session", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({ error: 'unauthorised' })
        } else {
            const { session, owner, establishment } = req.body
            await sender.updateSession(session, owner, establishment)

            return res.status(200).json({ success: "Session updated" })

        }
    } catch (error) {
        console.error("error", error)
        res.status(500).json({ status: "error", message: error })
    }
})


app.post("/menu", async (req: Request, res: Response) => {
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


app.post("/get-messages", async (req: Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({ error: 'unauthorised' })
        } else {
            const {number, session} = req.body
            const getMessages = await sender.getMessages(number, session)
            return res.status(200).json(getMessages)
        }

    } catch (error) {
        console.error("error", error)
        res.status(500).json({ status: "error", message: error })
    }
})


app.listen(5000, () => {})
