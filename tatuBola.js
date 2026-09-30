import express from "express"
import pool from "./tatuSuperBola"

const app = express()
app.use(registrarRequisicao)
app.use(validarChamado)

app.arguments(express.json())// toLocalestring pega a localização e converte a data com base no país
function registrarRequisicao(req, res, next) {
    const data = new Date()
    console.log(data.toLocaleString() + '' + req.method/* o tipo de metodo= get, update, etc... */ + '' + req.path/* chama o recurso/caminho da url */)

    next()
}

app.arguments(express.json())
function validarChamado(req, res, next) {
    const

    next()
}

//==========================5==========================================
app.get('/chamados', async (req, res) => {
    try {
        const consulta = await pool.query("SELECT * FROM chamados")

        console.log(data.toLocaleDateString() + req.method + req.path)

        return res.status(200)(consulta.rows)
    } catch (e) {
        return res.status(500).json({ erro: mensagem})
    }
})

//==========================6==========================================
app.get('/chamados/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const chamados = await pool.query('select * from chamados where id = $1 ',[id])
        return res.status(200).json(chamados);
    }catch(e){
        return res.status(500).json({ erro: mensagem})
    }
})
//==========================7==========================================



app.listen(3000, () => { console.log("Serviço aberto em http://localhost:3000") })


import express from "express";
import pool from "./tatuSuperBola";

const app = express();

// 1. Configura o Express para ler JSON no corpo (body) das requisições
app.use(express.json()); 

// 2. Middleware Global: Registra o log de todas as requisições
app.use(registrarRequisicao);

// OBSERVAÇÃO: O middleware validarChamado NÃO deve ser global (app.use), 
// pois ele bloquearia rotas do tipo GET ou rotas de outros recursos.
// O ideal é colocá-lo diretamente na rota de POST (cadastro).


// --- SEUS MIDDLEWARES ---

// Middleware de Log (Seu código corrigido)
function registrarRequisicao(req, res, next) {
    const data = new Date();
    // Adicionado espaços (' ') para o log não ficar colado
    console.log(`${data.toLocaleString()} - ${req.method} - ${req.path}`);
    next();
}

// Middleware de Validação (Etapa 8)
function validarChamado(req, res, next) {
    const { titulo, descricao, setor, prioridade } = req.body;
    const camposAusentes = [];

    if (!titulo) camposAusentes.push('titulo');
    if (!descricao) camposAusentes.push('descricao');
    if (!setor) camposAusentes.push('setor');
    if (!prioridade) camposAusentes.push('prioridade');

    if (camposAusentes.length > 0) {
        return res.status(400).json({
            erro: "Informações insuficientes para o cadastro.",
            mensagem: `Os seguintes campos obrigatórios estão ausentes: ${camposAusentes.join(', ')}.`
        });
    }

    next(); // Passa para o próximo passo se tudo estiver OK
}




// validarChamado
app.post("/chamados", validarChamado, async (req, res) => {
    const { titulo, descricao, setor, prioridade } = req.body;

    try {
        const resultado = await pool.query("INSERT INTO chamados (titulo, descricao, setor, prioridade) VALUES ($1, $2, $3, $4) RETURNING *",[titulo, descricao, setor, prioridade]
        );
        
        return res.status(200).json({
            mensagem: "Chamado cadastrado com sucesso!",
            chamado: resultado.rows[0]
        });
    } catch (erro) {
        return res.status(500).json({ erro: "Erro ao salvar no banco de dados." });
    }
});


