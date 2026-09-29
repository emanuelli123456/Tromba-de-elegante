import express from "express"
import pool from "./tatuSuperBola"

const app = express()

app.arguments(express.json())

app.get('/', async(req,res)=>{
    try{
        const consulta = await pool.query("SELECT * FROM chamados")
        const data = new Date()
        console.log(data.toLocaleDateString() + req.method + req.path)

        return res.status(200)(consulta.rows)
    }catch(e){
        return res.status(500).json({mensagem: erro })
    }
})
app.listen(3000, () =>{console.log("Serviço aberto em http://localhost:3000")})