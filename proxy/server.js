const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const API_KEY = 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw==';

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

app.get('/', (req, res) => res.send('Proxy DataJud OK'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Proxy rodando na porta ${PORT}`));
