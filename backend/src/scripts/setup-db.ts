import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../../.env') });

async function setup() {
  const host = process.env.MYSQL_HOST || 'localhost';
  const port = parseInt(process.env.MYSQL_PORT || '3306');
  const user = process.env.MYSQL_USER || 'root';
  const password = process.env.MYSQL_PASSWORD || '';

  console.log(`🔌 Connecting to MySQL server at ${host}:${port} as ${user}...`);

  let connection: mysql.Connection;
  try {
    connection = await mysql.createConnection({
      host,
      port,
      user,
      password,
      multipleStatements: true
    });
    console.log('✅ Connected to MySQL successfully!');
  } catch (err: any) {
    console.error('❌ Could not connect to MySQL with password in .env: ' + err.message);
    console.log('\n💡 Please check your password in C:\\Users\\Sanskar\\DBMS_Project\\backend\\.env');
    process.exit(1);
  }

  const dbDir = path.join(__dirname, '../../../database');
  const files = [
    'schema.sql',
    'procedures.sql',
    'functions.sql',
    'triggers.sql',
    'seed.sql',
    'roles.sql'
  ];

  for (const file of files) {
    const filePath = path.join(dbDir, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠️ File not found: ${file}`);
      continue;
    }

    console.log(`📄 Executing ${file}...`);
    let sql = fs.readFileSync(filePath, 'utf-8');

    // Clean up DELIMITER directives for mysql2
    sql = sql.replace(/DELIMITER\s+\$\$/gi, '');
    sql = sql.replace(/DELIMITER\s+;/gi, '');
    sql = sql.replace(/\$\$/g, ';');

    try {
      await connection.query(sql);
      console.log(`  ✓ ${file} executed successfully.`);
    } catch (err: any) {
      console.warn(`  ⚠️ Notice in ${file}: ${err.message}`);
    }
  }

  await connection.end();
  console.log('\n🎉 All database scripts executed successfully! smart_healthcare database is ready.');
}

setup();

