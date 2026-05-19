const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('Iniciando servidor de AstilleroStock...');
const app = express();
const port = process.env.PORT || 3000;
const dbPath = process.env.DB_PATH || 'astillero_inventory.db';
const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_astillero_2026';

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.message);
  } else {
    console.log('Base de datos conectada.');
    setupTables();
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

function setupTables() {
  console.log('Configurando tablas...');
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT,
        role TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        cat TEXT,
        stock REAL DEFAULT 0,
        min REAL DEFAULT 0,
        unit TEXT,
        valor REAL DEFAULT 0,
        prov TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        tipo TEXT DEFAULT 'Barco',
        estado TEXT DEFAULT 'Activo',
        fecha_inicio TEXT
      )
    `);
    
    // En caso de que la tabla ya exista de la versión anterior, agregamos la columna
    db.run("ALTER TABLE projects ADD COLUMN tipo TEXT DEFAULT 'Barco'", (err) => {
        // Se ignora el error si la columna ya existe
    });

    db.run(`
      CREATE TABLE IF NOT EXISTS movements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        prod_nombre TEXT,
        tipo TEXT,
        qty REAL,
        nota TEXT,
        resp TEXT,
        project_id INTEGER,
        fecha TEXT,
        FOREIGN KEY(product_id) REFERENCES products(id),
        FOREIGN KEY(project_id) REFERENCES projects(id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        username TEXT,
        action TEXT,
        details TEXT,
        fecha TEXT
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `);

    // Inicializar ajustes
    db.run('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)', ['app_name', 'Astillero de Calbuco']);

    // Admin user
    const adminUser = 'admin';
    db.get('SELECT * FROM users WHERE username = ?', [adminUser], (err, row) => {
      if (!row) {
        const hashedPassword = bcrypt.hashSync('astillero2026', 10);
        db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', [adminUser, hashedPassword, 'admin']);
      }
    });
  });
}

function logActivity(userId, username, action, details) {
  const fecha = new Date().toLocaleString('es-CL');
  db.run('INSERT INTO audit_logs (user_id, username, action, details, fecha) VALUES (?, ?, ?, ?, ?)', [userId, username, action, details, fecha]);
}

// Auth Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Endpoints
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    logActivity(user.id, user.username, 'Login', 'Usuario ingresó al sistema');
    res.json({ token, user: { username: user.username, role: user.role } });
  });
});

app.get('/api/products', authenticateToken, (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    res.json(rows || []);
  });
});

app.post('/api/products', authenticateToken, (req, res) => {
  const { nombre, cat, stock, min, unit, valor, prov } = req.body;
  db.run('INSERT INTO products (nombre, cat, stock, min, unit, valor, prov) VALUES (?, ?, ?, ?, ?, ?, ?)', 
    [nombre, cat, stock, min, unit, valor, prov], function(err) {
      logActivity(req.user.id, req.user.username, 'Agregar Producto', `Creó: ${nombre}`);
      res.json({ id: this.lastID });
    });
});

app.put('/api/products/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { nombre, cat, stock, min, unit, valor, prov } = req.body;
  db.run('UPDATE products SET nombre=?, cat=?, stock=?, min=?, unit=?, valor=?, prov=? WHERE id=?', 
    [nombre, cat, stock, min, unit, valor, prov, id], (err) => {
      logActivity(req.user.id, req.user.username, 'Editar Producto', `Editó: ${nombre} (ID: ${id})`);
      res.json({ success: true });
    });
});

app.delete('/api/products/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.get('SELECT nombre FROM products WHERE id = ?', [id], (err, product) => {
    db.run('DELETE FROM movements WHERE product_id=?', [id], () => {
      db.run('DELETE FROM products WHERE id=?', [id], () => {
        logActivity(req.user.id, req.user.username, 'Eliminar Producto', `Borró: ${product ? product.nombre : id}`);
        res.json({ success: true });
      });
    });
  });
});

app.post('/api/products/bulk', authenticateToken, (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'Formato inválido' });
  }

  let inserted = 0;
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    const stmt = db.prepare('INSERT INTO products (nombre, cat, stock, min, unit, valor, prov) VALUES (?, ?, ?, ?, ?, ?, ?)');
    
    items.forEach(item => {
      const nombre = item.Nombre || item.nombre || 'Insumo sin nombre';
      const cat = item.Categoria || item.Categoría || item.cat || 'Otros';
      const stock = parseFloat(item.Stock || item.stock) || 0;
      const min = parseFloat(item.Minimo || item.Mínimo || item.min) || 0;
      const unit = item.Unidad || item.unit || 'unidades';
      const valor = parseFloat(item.Valor || item.valor) || 0;
      const prov = item.Proveedor || item.prov || '';
      
      stmt.run([nombre, cat, stock, min, unit, valor, prov]);
      inserted++;
    });

    stmt.finalize();
    db.run('COMMIT', (err) => {
      if (err) {
        res.status(500).json({ error: 'Error al importar los datos' });
      } else {
        logActivity(req.user.id, req.user.username, 'Importación Masiva', `Importó ${inserted} insumos desde Excel`);
        res.json({ success: true, inserted });
      }
    });
  });
});

// Projects endpoints
app.get('/api/projects', authenticateToken, (req, res) => {
  db.all('SELECT * FROM projects ORDER BY id DESC', [], (err, rows) => {
    res.json(rows || []);
  });
});

app.post('/api/projects', authenticateToken, (req, res) => {
  const { nombre, descripcion, tipo } = req.body;
  const projectType = tipo || 'Barco';
  const fecha_inicio = new Date().toLocaleString('es-CL');
  db.run('INSERT INTO projects (nombre, descripcion, tipo, estado, fecha_inicio) VALUES (?, ?, ?, ?, ?)', 
    [nombre, descripcion, projectType, 'Activo', fecha_inicio], function(err) {
      logActivity(req.user.id, req.user.username, 'Crear Proyecto', `Creó ${projectType}: ${nombre}`);
      res.json({ id: this.lastID });
    });
});

app.put('/api/projects/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  db.run('UPDATE projects SET estado=? WHERE id=?', [estado, id], (err) => {
    db.get('SELECT nombre FROM projects WHERE id=?', [id], (err, project) => {
      logActivity(req.user.id, req.user.username, 'Editar Proyecto', `Cambió estado a ${estado}: ${project ? project.nombre : id}`);
      res.json({ success: true });
    });
  });
});

app.delete('/api/projects/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.get('SELECT nombre FROM projects WHERE id = ?', [id], (err, project) => {
    db.run('UPDATE movements SET project_id=NULL WHERE project_id=?', [id], () => {
      db.run('DELETE FROM projects WHERE id=?', [id], () => {
        logActivity(req.user.id, req.user.username, 'Eliminar Proyecto', `Borró proyecto: ${project ? project.nombre : id}`);
        res.json({ success: true });
      });
    });
  });
});

app.get('/api/settings', (req, res) => {
  db.all('SELECT * FROM settings', [], (err, rows) => {
    const settingsMap = (rows || []).reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});
    res.json(settingsMap);
  });
});

app.get('/api/movements', authenticateToken, (req, res) => {
  db.all(`
    SELECT m.*, p.nombre as project_name, p.tipo as project_type
    FROM movements m
    LEFT JOIN projects p ON m.project_id = p.id
    ORDER BY m.id DESC
  `, [], (err, rows) => {
    res.json(rows || []);
  });
});

app.post('/api/movements', authenticateToken, (req, res) => {
  const { product_id, prod_nombre, tipo, qty, nota, resp, project_id, fecha } = req.body;
  
  db.serialize(() => {
    db.run('INSERT INTO movements (product_id, prod_nombre, tipo, qty, nota, resp, project_id, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [product_id, prod_nombre, tipo, qty, nota, resp, project_id || null, fecha]);
    
    db.get('SELECT stock FROM products WHERE id=?', [product_id], (err, product) => {
      let newStock = product.stock;
      if (tipo === 'in') newStock += qty;
      else if (tipo === 'out') newStock = Math.max(0, newStock - qty);
      else if (tipo === 'adj') newStock = qty;
      
      db.run('UPDATE products SET stock=? WHERE id=?', [newStock, product_id], () => {
        let movDetails = `${tipo.toUpperCase()}: ${prod_nombre} (${qty})`;
        if (project_id) movDetails += ` para Proyecto ID: ${project_id}`;
        logActivity(req.user.id, req.user.username, 'Movimiento', movDetails);
        res.json({ success: true, newStock });
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
