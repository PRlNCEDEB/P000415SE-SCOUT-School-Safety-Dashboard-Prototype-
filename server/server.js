const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('SCOUT backend is running');
});

app.get('/api/incidents', (req, res) => {
  res.json([
    { id: 1, title: 'Medical Emergency', status: 'triggered' },
    { id: 2, title: 'Fire Alarm', status: 'acknowledged' }
  ]);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});