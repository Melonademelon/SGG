window.AppDB = {
  db: null,

  initDB: async function () {
    if (this.db) return;
    const SQL = await initSqlJs({
      locateFile: (file) =>
        `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
    });
    const savedData = localStorage.getItem("sqlite_sgg_db");

    if (savedData) {
      const binaryString = window.atob(savedData);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      this.db = new SQL.Database(bytes);
    } else {
      this.db = new SQL.Database();
      this.db.run(`
                CREATE TABLE usuarios (
                    id_usuario INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    nombre TEXT NOT NULL,
                    apellido TEXT NOT NULL,
                    dob TEXT NOT NULL,
                    question TEXT NOT NULL,
                    answer TEXT NOT NULL,
                    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
                );
                CREATE TABLE gastos (
                    id_gasto INTEGER PRIMARY KEY AUTOINCREMENT,
                    id_usuario INTEGER NOT NULL,  
                    descripcion TEXT NOT NULL,
                    monto REAL NOT NULL CHECK (monto > 0), 
                    categoria TEXT NOT NULL,
                    fecha_gasto DATE NOT NULL,
                    estado_activo INTEGER DEFAULT 1, 
                    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
                );
                CREATE INDEX idx_user_gastos ON gastos(id_usuario);
                CREATE INDEX idx_estado ON gastos(estado_activo);
            `);

      // Usuarios iniciales de prueba
      this.db.run(`
                INSERT INTO usuarios (nombre, apellido, dob, email, username, password_hash, question, answer)
                VALUES 
                ('Melon', 'Test', '1990-01-01', 'melon@gmail.com', 'melon', 'Hola1234@', 'mascota', 'poroto'),
                ('Coco', 'Test', '1990-01-01', 'coco@gmail.com', 'coco', 'Chau1234@', 'mascota', 'masha');
            `);
      this.save();
    }
  },

  save: function () {
    const data = this.db.export();
    let binaryString = "";
    for (let i = 0; i < data.length; i++) {
      binaryString += String.fromCharCode(data[i]);
    }
    localStorage.setItem("sqlite_sgg_db", window.btoa(binaryString));
  },

  query: function (sql, params = []) {
    const stmt = this.db.prepare(sql);
    stmt.bind(params);
    const result = [];
    while (stmt.step()) {
      result.push(stmt.getAsObject());
    }
    stmt.free();
    return result;
  }
};
