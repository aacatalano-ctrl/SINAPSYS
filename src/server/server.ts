import express from 'express';
import cors from 'cors';
import path from 'path'; // Added path import
import { fileURLToPath } from 'url'; // Added fileURLToPath import
import { connectDB, initializeDb } from '../main/database/index.ts'; // Import connectDB and initializeDb

const app = express();
const port = process.env.PORT || 3001; // Use process.env.PORT for deployment

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the 'renderer' directory
app.use(express.static(path.join(__dirname, '../../renderer/dist')));

app.use(cors());
app.use(express.json());

// --- HEALTH CHECK ---
app.get('/', (req, res) => {
  res.send('¡El servidor del laboratorio dental está funcionando!');
});

// Fallback for SPA - serves index.html for any unmatched routes
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../../renderer/dist/index.html'));
});


// Connect to DB and then start server
const startServer = async () => {
  await connectDB(); // Connect to MongoDB
  await initializeDb(); // Initialize data if collections are empty

  app.listen(port, () => {
    console.log(`Servidor backend escuchando en http://localhost:${port}`);
  });
};

startServer(); // Call the function to start the server
