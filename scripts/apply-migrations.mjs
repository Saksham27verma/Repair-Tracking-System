#!/usr/bin/env node
/**
 * Apply pending SQL migrations directly to the remote Supabase Postgres database.
 * Requires SUPABASE_DB_PASSWORD in .env.local (from Supabase Dashboard → Settings → Database).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const migrationsDir = path.join(root, 'supabase', 'migrations');

function loadEnv() {
  const envPath = path.join(root, '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) process.env[match[1].trim()] = match[2].trim();
  }
}

async function columnExists(client, table, column) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = $1 AND column_name = $2`,
    [table, column]
  );
  return rows.length > 0;
}

async function tableExists(client, table) {
  const { rows } = await client.query(
    `SELECT 1 FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = $1`,
    [table]
  );
  return rows.length > 0;
}

async function bootstrapAppliedMigrations(client) {
  const versions = [];

  const baseTables = ['customers', 'repairs'];
  if ((await Promise.all(baseTables.map((t) => tableExists(client, t)))).every(Boolean)) {
    versions.push('20240314000000_initial_schema');
  }

  if (await columnExists(client, 'repairs', 'ear')) {
    versions.push('20240515000000_update_warranty_status_add_ear_quantity_mould');
  }

  if (await columnExists(client, 'repairs', 'email')) {
    versions.push('20240620000000_add_email_field');
  }

  if (await tableExists(client, 'centers')) {
    versions.push('20240608000000_add_center_tracking');
  }

  if (await columnExists(client, 'customers', 'email')) {
    versions.push('20240701000000_add_email_to_customers');
  }

  const hasNotificationPrefs =
    (await columnExists(client, 'customers', 'notification_preference')) ||
    (await columnExists(client, 'repairs', 'notification_preference'));
  if (hasNotificationPrefs) {
    versions.push('20240610000000_add_notification_preferences');
  }

  if (await columnExists(client, 'repairs', 'device_format')) {
    versions.push('20240609000000_add_device_format');
  }

  if (await columnExists(client, 'repairs', 'manufacturer_invoice_number')) {
    versions.push('20240702000000_add_manufacturer_invoice');
  }

  if (await columnExists(client, 'repairs', 'manufacturer_invoice_cgst_amount')) {
    versions.push('20240702000001_add_invoice_cgst_sgst');
  }

  if (await columnExists(client, 'repairs', 'visit_number')) {
    versions.push('20240703000000_add_repair_visit_number');
  }

  return versions;
}

function getProjectRef() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] || 'kfyenqkbsqkzqzzwcgtf';
}

async function main() {
  loadEnv();

  const password = process.env.SUPABASE_DB_PASSWORD;
  const databaseUrl = process.env.DATABASE_URL;

  if (!password && !databaseUrl) {
    console.error(
      'Missing database credentials.\n' +
        'Add SUPABASE_DB_PASSWORD to .env.local (Supabase Dashboard → Project Settings → Database → Database password).\n' +
        'Or set DATABASE_URL with the full Postgres connection string.'
    );
    process.exit(1);
  }

  const projectRef = getProjectRef();
  const poolerRegion = process.env.SUPABASE_DB_REGION || 'ap-south-1';
  const connectionCandidates = databaseUrl
    ? [{ label: 'DATABASE_URL', config: { connectionString: databaseUrl, ssl: { rejectUnauthorized: false } } }]
    : [
        {
          label: `pooler (${poolerRegion})`,
          config: {
            host: `aws-0-${poolerRegion}.pooler.supabase.com`,
            port: 6543,
            database: 'postgres',
            user: `postgres.${projectRef}`,
            password,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 15000,
          },
        },
        {
          label: 'direct',
          config: {
            host: `db.${projectRef}.supabase.co`,
            port: 5432,
            database: 'postgres',
            user: 'postgres',
            password,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 15000,
          },
        },
      ];

  let client;
  let lastError;
  for (const candidate of connectionCandidates) {
    const attempt = new pg.Client(candidate.config);
    try {
      await attempt.connect();
      client = attempt;
      console.log(`Connected to Supabase Postgres (${projectRef}) via ${candidate.label}`);
      break;
    } catch (err) {
      lastError = err;
      try {
        await attempt.end();
      } catch {
        /* ignore */
      }
    }
  }

  if (!client) {
    throw lastError || new Error('Could not connect to Supabase Postgres');
  }

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  let { rows: applied } = await client.query(
    'SELECT version FROM public.schema_migrations ORDER BY version'
  );

  if (applied.length === 0) {
    const bootstrapped = await bootstrapAppliedMigrations(client);
    if (bootstrapped.length) {
      console.log('Bootstrapped already-applied migrations from live schema:');
      for (const version of bootstrapped) {
        await client.query(
          'INSERT INTO public.schema_migrations (version) VALUES ($1) ON CONFLICT DO NOTHING',
          [version]
        );
        console.log(`  mark  ${version}`);
      }
      ({ rows: applied } = await client.query(
        'SELECT version FROM public.schema_migrations ORDER BY version'
      ));
    }
  }

  const appliedSet = new Set(applied.map((r) => r.version));

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  let ran = 0;
  for (const file of files) {
    const version = file.replace(/\.sql$/, '');
    if (appliedSet.has(version)) {
      console.log(`  skip  ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`  apply ${file} ...`);

    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        'INSERT INTO public.schema_migrations (version) VALUES ($1)',
        [version]
      );
      await client.query('COMMIT');
      console.log(`  done  ${file}`);
      ran++;
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`  fail  ${file}: ${err.message}`);
      process.exit(1);
    }
  }

  await client.end();
  console.log(ran ? `\nApplied ${ran} migration(s).` : '\nAll migrations already up to date.');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
