const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';
const TJRJ_BASE = 'https://www3.tjrj.jus.br/PortalConhecimento/api/precatorios';

// Entidades TJRJ com IDs reais
const ENTIDADES_TJRJ = [
  { id: 2,   nome: 'MUNICÍPIO DO RIO DE JANEIRO ',          regime: 'O' },
  { id: 7,   nome: 'MUNICÍPIO DE DUQUE DE CAXIAS',          regime: 'E' },
  { id: 9,   nome: 'MUNICÍPIO DE NITERÓI',                  regime: 'O' },
  { id: 27,  nome: 'MUNICÍPIO DE ANGRA DOS REIS',           regime: 'O' },
  { id: 34,  nome: 'MUNICÍPIO DE SÃO JOÃO DE MERITI',       regime: 'O' },
  { id: 290, nome: 'INSTITUTO  DE  PREVIDÊNCIA  DOS  SERVIDORES  PÚBLICOS  DE  SÃO  JOÃO  DE  MERITI - MERITI PREV', regime: 'O' },
  { id: 15,  nome: 'MUNICÍPIO DE SÃO GONÇALO',              regime: 'E' },
  { id: 22,  nome: 'MUNICÍPIO DE PETRÓPOLIS',               regime: 'E' },
  { id: 28,  nome: 'MUNICÍPIO DE NOVA IGUAÇU',              regime: 'E' },
];

// ===== DATAJUD =====
app.post('/datajud/:endpoint', async (req, res) => {
  const { endpoint } = req.params;
  const url = `https://api-publica.datajud.cnj.jus.br/${endpoint}/_search`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `ApiKey ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===== TJRJ — Lista de entidades =====
app.get('/tjrj/entidades', (req, res) => {
  res.json(ENTIDADES_TJRJ.map(({ id, nome, regime }) => ({ id, nome, regime })));
});

// ===== TJRJ — Fila de precatórios =====
// GET /tjrj/fila?id=34&natureza=A&ano=2026&regime=O&pagina=1&tamanho=100
app.get('/tjrj/fila', async (req, res) => {
  const { id, natureza, ano, pagina = 1, tamanho = 100 } = req.query;

  if (!id) return res.status(400).json({ erro: 'Parâmetro id é obrigatório' });

  const entidade = ENTIDADES_TJRJ.find(e => String(e.id) === String(id));
  if (!entidade) return res.status(404).json({ erro: `Entidade ${id} não configurada` });

  const regime = req.query.regime || entidade.regime || 'O';

  const params = new URLSearchParams({
    idEntidadeDevedora: entidade.id,
    nomeEntidadeDevedora: entidade.nome,
    ordemPagamento: 4,
    pagina,
    regimeEntidade: regime,
    tamanhoPagina: tamanho,
  });
  if (natureza) params.set('siglaNatureza', natureza);
  if (ano) params.set('anoOrcamento', ano);

  try {
    const url = `${TJRJ_BASE}/ordemPagamento?${params}`;
    console.log(`[TJRJ] GET ${url}`);
    const resp = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://www3.tjrj.jus.br/PortalConhecimento/precatorio',
      }
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return res.status(resp.status).json({ erro: `TJRJ retornou ${resp.status}`, detalhe: txt.substring(0, 300) });
    }

    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[TJRJ] Erro:', err.message);
    res.status(500).json({ erro: err.message });
  }
});

app.get('/', (req, res) => res.send('Proxy DataJud + TJRJ OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy rodando na porta ${PORT}`));
