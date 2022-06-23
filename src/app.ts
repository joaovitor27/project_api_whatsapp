import console from "console";
import express, { Request, Response } from "express"

import Sender from "./sender";

const sender = new Sender()

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: false }))


app.get("/status", (req:Request, res: Response) => {
    return res.send({
        qr_code: sender.qrCode,
        connected: sender.isConnected,
    })
})


app.post("/message", async (req:Request, res: Response) => {
    const { number, message } = req.body

    try {
        await sender.message(number, message)
        return res.status(200).json()
        
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
    let number = req.query.number as string
    console.log(number)
    try {
        const getMessages = await sender.getMessages(number)
        return res.status(200).json(getMessages)

    }catch(error){
        console.error("error", error)
        res.status(500).json({status:"error", message:error})
    }
})


app.listen(5000, () => {})
