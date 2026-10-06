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
      const errorOutput = error.stderr || error.message;

      // Check if it's the P3005 error (baseline required)
      if (errorOutput.includes('P3005')) {
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
      }
      // Check if it's the P3009 error (failed migrations in database)
      else if (errorOutput.includes('P3009')) {
        console.log('⚠️  Found failed migrations in database');
        console.log('Attempting to resolve failed migrations...');

        // Extract migration name from error if possible
        const match = errorOutput.match(/The `([^`]+)` migration/);
        const failedMigration = match ? match[1] : null;

        if (failedMigration) {
          try {
            console.log(`  Resolving failed migration: ${failedMigration}`);
            await execAsync(`npx prisma migrate resolve --rolled-back "${failedMigration}"`);
            console.log(`  ✅ ${failedMigration} marked as rolled back`);
          } catch (err) {
            console.warn(`  ⚠️  Could not resolve migration:`, err.message);
            throw err;
          }

          // Try to deploy again
          console.log('\nAttempting migration deploy after resolution...');
          await execAsync('npx prisma migrate deploy');
          console.log('✅ Migrations deployed after failed migration resolution');
        } else {
          console.error('❌ Could not extract failed migration name');
          throw error;
        }
      } else {
        // Re-throw if it's a different error
        console.error('❌ Migration failed:', errorOutput);
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
