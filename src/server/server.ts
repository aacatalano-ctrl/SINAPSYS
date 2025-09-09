import express from 'express';
import cors from 'cors';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// --- HEALTH CHECK ---
app.get('/', (req, res) => {
  res.send('¡El servidor del laboratorio dental está funcionando!');
});

app.listen(port, () => {
  console.log(`Servidor backend escuchando en http://localhost:${port}`);
});