import express from "express"
import pool from "./tatuSuperBola"

const app = express()
app.use(express.json())

// ==========================================
// ETAPA 5 - MIDDLEWARE DE LOG
// ==========================================
app.get('/chamados', async (req, res) => {
    try {
        const consulta = await pool.query("SELECT * FROM chamados")

        console.log(data.toLocaleDateString() + req.method + req.path)

        return res.status(200)(consulta.rows)
    } catch (e) {
        return res.status(500).json({ erro: mensagem })
    }
})

// ==========================================
// ETAPA 8 - VALIDAR CHAMADO
// ==========================================

function validarChamado(req, res, next) {

    const { titulo, descricao, setor, prioridade } = req.body

    if (!titulo || !descricao || !setor || !prioridade) {
        return res.status(400).json({
            erro: 'titulo, descricao, setor e prioridade são obrigatórios'
        })
    }

    next()
}


// ==========================================
// ETAPA 9 - VALIDAR PRIORIDADE
// ==========================================

function validarPrioridade(req, res, next) {

    const { prioridade } = req.body

    const prioridades = ['baixa', 'media', 'alta']

    if (!prioridades.includes(prioridade)) {
        return res.status(400).json({
            erro: 'Prioridade deve ser baixa, media ou alta'
        })
    }

    next()
}


// ==========================================
// ETAPA 11 E 12 - AUTENTICAÇÃO
// ==========================================

function verificarAutenticacao(req, res, next) {

    const token = req.headers.authorization

    const usuarios = {
        tecnico123: {
            nome: 'Carlos', tipo: 'tecnico'
        },
        admin123: {
            nome: 'Administrador', tipo: 'admin'
        }
    }

    const usuario = usuarios[token]

    if (!usuario) {
        return res.status(401).json({
            erro: 'Token inválido ou não informado'
        })
    }
    req.usuario = usuario
    next()
}


// ==========================================
// ETAPA 15 - AUTORIZAÇÃO
// ==========================================

function somenteAdmin(req, res, next) {

    if (req.usuario.tipo !== 'admin') {
        return res.status(403).json({
            erro: 'Apenas administradores podem realizar esta operação'
        })
    }

    next()
}


// ==========================================
// ROTA INICIAL / TESTE DO BANCO
// ==========================================

app.get('/', async (req, res, next) => {

    try {

        const resultado = await pool.query(
            'SELECT NOW()'
        )

        return res.status(200).json({
            mensagem: 'API de Chamados funcionando',
            banco: resultado.rows[0]
        })

    } catch (erro) {

        next(erro)
    }
})


// ==========================================
// ETAPA 6 E 17
// GET /chamados
// LISTAR E FILTRAR
// ==========================================

app.get('/chamados', async (req, res, next) => {

    try {
        const { status, prioridade } = req.query

        let sql = 'SELECT * FROM chamados'
        const valores = []
        const filtros = []
        if (status) {
            valores.push(status)
            filtros.push(`status = $${valores.length}`)

            if (prioridade) {
                valores.push(prioridade)
                filtros.push(`prioridade = $${valores.length}`)
            }

            if (filtros.length > 0) {

                sql += ' WHERE ' + filtros.join(' AND ')
            }
            sql += ' ORDER BY id'

            const resultado = await pool.query(sql, valores)

            return res.status(200).json(resultado.rows)

        } catch (erro) {

            next(erro)
        }
    })


// ==========================================
// ETAPA 18
// ESTATÍSTICAS
// ==========================================
// IMPORTANTE:
// Esta rota vem antes de /chamados/:id
// ==========================================

app.get('/chamados/estatisticas', async (req, res, next) => {

    try {

        const resultado = await pool.query(`
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'aberto') AS abertos,
                COUNT(*) FILTER (WHERE status = 'em_atendimento') AS "emAtendimento",
                COUNT(*) FILTER (WHERE status = 'finalizado') AS finalizados,
                COUNT(*) FILTER (WHERE prioridade = 'alta') AS "prioridadeAlta"
            FROM chamados
        `)

        const dados = resultado.rows[0]

        return res.status(200).json({
            total: Number(dados.total),
            abertos: Number(dados.abertos),
            emAtendimento: Number(dados.emAtendimento),
            finalizados: Number(dados.finalizados),
            prioridadeAlta: Number(dados.prioridadeAlta)
        })

    } catch (erro) {

        next(erro)
    }
})


// ==========================================
// ETAPA 7
// GET /chamados/:id
// ==========================================

app.get('/chamados/:id', async (req, res, next) => {

    try {

        const { id } = req.params

        const resultado = await pool.query(
            'SELECT * FROM chamados WHERE id = $1',
            [id]
        )

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                erro: 'Chamado não encontrado'
            })
        }
        return res.status(200).json(resultado.rows[0])

    } catch (erro) {

        next(erro)
    }
})


// ==========================================
// ETAPA 10
// POST /chamados
// ==========================================

app.post(
    '/chamados',
    validarChamado,
    validarPrioridade,
    async (req, res, next) => {

        const { titulo, descricao, setor, prioridade } = req.body
        try {

            const resultado = await pool.query(
                `INSERT INTO chamados (titulo, descricao, setor, prioridade, status, responsavel, data_abertura) VALUES ($1, $2, $3, $4, 'aberto', NULL, CURRENT_TIMESTAMP) RETURNING *
                `,
                [
                    titulo,
                    descricao,
                    setor,
                    prioridade
                ]
            )

            return res.status(201).json(resultado.rows[0])

        } catch (erro) {

            next(erro)
        }
    }
)


// ==========================================
// ETAPA 13
// ASSUMIR CHAMADO
// ==========================================

app.patch(
    '/chamados/:id/assumir',
    verificarAutenticacao,
    async (req, res, next) => {

        const { id } = req.params

        try {

            const consulta = await pool.query('SELECT * FROM chamados WHERE id = $1', [id]
            )
            if (consulta.rows.length === 0) {
                return res.status(404).json({
                    erro: 'Chamado não encontrado'
                })
            }
            const chamado = consulta.rows[0]
            if (chamado.status !== 'aberto') {
                return res.status(400).json({
                    erro: 'O chamado não está aberto'
                })
            }
            const resultado = await pool.query(`UPDATE chamados SET status = 'em_atendimento',responsavel = $1 WHERE id = $2 RETURNING *`,
                [req.usuario.nome, id]
            )
            return res.status(200).json(resultado.rows[0])

        } catch (erro) {

            next(erro)
        }
    }
)


// ==========================================
// ETAPA 14
// FINALIZAR CHAMADO
// ==========================================

app.patch(
    '/chamados/:id/finalizar',
    verificarAutenticacao,
    async (req, res, next) => {

        const { id } = req.params

        try {
            const consulta = await pool.query('SELECT * FROM chamados WHERE id = $1', [id]
            )

            if (consulta.rows.length === 0) {
                return res.status(404).json({
                    erro: 'Chamado não encontrado'
                })
            }

            const chamado = consulta.rows[0]

            if (chamado.status !== 'em_atendimento') {
                return res.status(400).json({
                    erro: 'O chamado precisa estar em atendimento para ser finalizado'
                })
            }

            const resultado = await pool.query(
                `
                UPDATE chamados SET status = 'finalizado' WHERE id = $1RETURNING *`, [id]
            )
            return res.status(200).json(resultado.rows[0])
        } catch (erro) {

            next(erro)
        }
    }
)


// ==========================================
// ETAPA 16
// DELETE /chamados/:id

app.delete('/chamados/:id', verificarAutenticacao,
    somenteAdmin,
    async (req, res, next) => {
        const { id } = req.params
        try {

            const resultado = await pool.query('DELETE FROM chamados WHERE id = $1 RETURNING *', [id]
            )
            if (resultado.rows.length === 0) {
                return res.status(404).json({
                    erro: 'Chamado não encontrado'
                })
            }
            return res.status(200).json({
                mensagem: 'Chamado excluído com sucesso',
                chamado: resultado.rows[0]
            })

        } catch (erro) {
            next(erro)
        }
    }
)


// ==========================================
// ETAPA 19

app.use((req, res) => {
    return res.status(404).json({
        erro: 'Rota não encontrada'
    })
})


// ==========================================
// ETAPA 20

app.use((erro, req, res, next) => {
    console.log('Erro:', erro)
    return res.status(500).json({
        erro: 'Erro interno do servidor'
    })
})


/* function validarChamado(req, res, next) {

    const { titulo, descricao, setor, prioridade } = req.body

    if (!titulo || !descricao || !setor || !prioridade) {
        return res.status(400).json({
            erro: 'titulo, descricao, setor e prioridade são obrigatórios'
        })
    }

    next()
} */
/* 
app.use(verificarApiKey)

function verificarApiKey(){
 if{
 
 }
next()
}
 */












app.listen(3000, () => { console.log("Serviço aberto em http://localhost:3000") })
