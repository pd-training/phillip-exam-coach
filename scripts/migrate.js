#!/usr/bin/env node
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

async function runMigrations() {
  try {
    console.log('Starting Prisma migrations...');
    
    // First attempt to deploy migrations
    try {
      const { stdout, stderr } = await execAsync('npx prisma migrate deploy');
      console.log('✅ Migrations deployed successfully');
      console.log(stdout);
    } catch (error) {
      // Check if it's the P3005 error (baseline required)
      if (error.stderr && error.stderr.includes('P3005')) {
        console.log('⚠️  Database schema exists but migrations not tracked');
        console.log('Running baseline process...');
        
        // Read migrations directory
        const migrationsDir = path.join(process.cwd(), 'prisma', 'migrations');
        const migrations = fs.readdirSync(migrationsDir)
          .filter(f => fs.statSync(path.join(migrationsDir, f)).isDirectory());
        
        console.log(`Found ${migrations.length} migrations to baseline`);
        
        // Mark each migration as applied
        for (const migration of migrations) {
          try {
            console.log(`  Resolving migration: ${migration}`);
            await execAsync(`npx prisma migrate resolve --applied "${migration}"`);
            console.log(`  ✅ ${migration} marked as applied`);
          } catch (err) {
            console.warn(`  ⚠️  Could not resolve ${migration}:`, err.message);
          }
        }
        
        // Try to deploy again
        console.log('\nAttempting migration deploy after baseline...');
        await execAsync('npx prisma migrate deploy');
        console.log('✅ Migrations deployed after baseline');
      } else {
        // Re-throw if it's a different error
        console.error('❌ Migration failed:', error.stderr || error.message);
        process.exit(1);
      }
    }
    
    console.log('✅ All migrations completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error during migrations:', error.message);
    console.error(error.stderr);
    process.exit(1);
  }
}

runMigrations();
