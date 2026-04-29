const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      date TEXT, client TEXT, type TEXT,
      priority TEXT, status TEXT, details TEXT, notes TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('Database ready');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/tasks', async (req, res) => {
  const r = await pool.query('SELECT * FROM tasks ORDER BY created_at DESC');
  res.json(r.rows);
});
app.post('/api/tasks', async (req, res) => {
  const {id,date,client,type,priority,status,details,notes} = req.body;
  await pool.query('INSERT INTO tasks VALUES($1,$2,$3,$4,$5,$6,$7,$8,NOW())',[id,date,client,type,priority,status,details,notes]);
  res.json({ok:true});
});
app.put('/api/tasks/:id', async (req, res) => {
  const {date,client,type,priority,status,details,notes} = req.body;
  await pool.query('UPDATE tasks SET date=$1,client=$2,type=$3,priority=$4,status=$5,details=$6,notes=$7 WHERE id=$8',[date,client,type,priority,status,details,notes,req.params.id]);
  res.json({ok:true});
});
app.delete('/api/tasks/:id', async (req, res) => {
  await pool.query('DELETE FROM tasks WHERE id=$1',[req.params.id]);
  res.json({ok:true});
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
