window.AppDB = {
    db: null,
    fileName: 'sgg_database.sqlite',

    // Inicializar Motor SQLite con OPFS
    initDB: async function() {
        if (this.db) return;
        
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        // Intentar leer binario directamente de OPFS
        const opfsData = await this.readFromOPFS();

        if (opfsData) {
            this.db = new SQL.Database(opfsData);
        } else {
            // Si no existe localmente, crear esquema inicial
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
                    tipo TEXT NOT NULL DEFAULT 'egreso', -- 'ingreso' o 'egreso'
                    url_comprobante TEXT DEFAULT NULL,   -- URL provista por API REST
                    fecha_gasto DATE NOT NULL,
                    activo INTEGER DEFAULT 1,             -- Borrado lógico
                    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario) ON DELETE RESTRICT
                );

                CREATE INDEX idx_user_gastos ON gastos(id_usuario);
                CREATE INDEX idx_activo ON gastos(activo);
            `);

            // Datos de prueba
            this.db.run(`
                INSERT INTO usuarios (nombre, apellido, dob, email, username, password_hash, question, answer)
                VALUES 
                ('Melon', 'Test', '1990-01-01', 'melon@gmail.com', 'melon', 'Hola1234@', 'mascota', 'poroto'),
                ('Coco', 'Test', '1990-01-01', 'coco@gmail.com', 'coco', 'Chau1234@', 'mascota', 'masha');
            `);

            await this.save(); // Guardar archivo inicial en OPFS
        }
    },

    // --- LEER DE OPFS ---
    readFromOPFS: async function() {
        try {
            const root = await navigator.storage.getDirectory();
            const fileHandle = await root.getFileHandle(this.fileName);
            const file = await fileHandle.getFile();
            const buffer = await file.arrayBuffer();
            return new Uint8Array(buffer);
        } catch (error) {
            console.info("Archivo OPFS no encontrado. Creando nueva base de datos...");
            return null;
        }
    },

    // --- GUARDAR EN OPFS ---
    save: async function() {
        try {
            const data = this.db.export(); // ArrayBuffer binario
            const root = await navigator.storage.getDirectory();
            const fileHandle = await root.getFileHandle(this.fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(data);
            await writable.close();
        } catch (error) {
            console.error("Error al guardar en OPFS:", error);
        }
    },

    // --- RESPALDO A CLOUD BAAS (Supabase Storage / API Externa) ---
    uploadToBaaS: async function(supabaseUrl, supabaseKey, userId) {
        try {
            const fileData = await this.readFromOPFS();
            if (!fileData) return false;

            const blob = new Blob([fileData], { type: 'application/x-sqlite3' });
            const filePath = `backups/user_${userId}_database.sqlite`;

            const response = await fetch(`${supabaseUrl}/storage/v1/object/sgg-backups/${filePath}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'apikey': supabaseKey,
                    'x-upsert': 'true'
                },
                body: blob
            });

            return response.ok;
        } catch (error) {
            console.warn("Falla en sincronización BaaS Cloud:", error);
            return false;
        }
    },

    // Executador de consultas SQL
    query: function(sql, params = []) {
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
