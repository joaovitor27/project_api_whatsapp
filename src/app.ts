import console from "console";
import express, { Request, Response } from "express"
import Sender from "./sender";
import * as dotenv from 'dotenv';

const sender = new Sender()

const app = express()
dotenv.config();

app.use(express.json())
app.use(express.urlencoded({ extended: false }))


app.get("/status", (req:Request, res: Response, next) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'})
        }else{
            return res.status(200).json({
                qr_code: sender.qrCode,
                connected: sender.isConnected
            })
        }
    }catch(error){
        console.error("error", error)
        res.status(500).json({status:"error", message:error})
    }

})


app.post("/message", async (req:Request, res: Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'})
        }else{
            const { number, message } = req.body
            await sender.message(number, message)
            return res.status(200).json({success: "Message sent successfully"})
        }
    }catch (error){
        console.error("error", error)
        res.status(500).json({status:"error", message:error})
    }
})


// app.post("/sendButtons", async (req:Request, res: Response) => {
//     const { number, title, buttons, description } = req.body
//     console.log("postman", number,title,buttons,description)
//     try {
//         await sender.sendButtons(number, title, buttons, description)
//         return res.status(200).json()
        
//     }catch (error){
//         console.error("error", error)
//         res.status(500).json({status:"error", message:error})
//     }
// })


app.get("/get-messages", async (req:Request, res:Response) => {
    try {
        const apiKey = req.get('Authorization')
        if (!apiKey || apiKey !== process.env.API_KEY) {
            res.status(401).json({error: 'unauthorised'})
        }else{
            let number = req.query.number as string
            const getMessages = await sender.getMessages(number)
            return res.status(200).json(getMessages)
        }

    }catch(error){
        console.error("error", error)
        res.status(500).json({status:"error", message:error})
    }
})


app.listen(5000, () => {})
