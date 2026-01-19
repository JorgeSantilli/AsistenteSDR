const fs = require('fs');
const path = require('path');
const { globSync } = require('glob');

/**
 * Script de validación para asegurar que los Route Handlers cumplen con Next.js 16.
 * 
 * Reglas:
 * 1. Usar NextRequest en lugar de Request.
 * 2. Usar Promise<{...}> para params.
 */

const API_DIR = path.join(process.cwd(), 'src/app/api');
const routeFiles = globSync('**/route.ts', { cwd: API_DIR, absolute: true });

let hasErrors = false;

console.log('🔍 Validando Route Handlers para Next.js 16...');

routeFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const relativePath = path.relative(process.cwd(), file);

    const errors = [];

    // Definición de métodos HTTP comunes
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

    methods.forEach(method => {
        // Regex para encontrar la exportación de la función del método
        // Captura los parámetros de la función
        const methodRegex = new RegExp(`export\\s+async\\s+function\\s+${method}\\s*\\(([^)]*)\\)`, 'g');
        let match;

        while ((match = methodRegex.exec(content)) !== null) {
            const paramsText = match[1].trim();

            if (paramsText) {
                // Regla 1: Validar uso de NextRequest
                if (paramsText.includes(': Request') && !paramsText.includes('NextRequest')) {
                    errors.push(`${method}: Usa 'NextRequest' en lugar de 'Request'`);
                }

                // Regla 2: Si hay un segundo parámetro (context/params), validar que sea Promise
                const paramsSplit = paramsText.split(',');
                if (paramsSplit.length > 1) {
                    const secondParam = paramsSplit[1].trim();

                    if (secondParam.includes('params:') && !secondParam.includes('Promise<')) {
                        errors.push(`${method}: 'params' debe estar tipado como 'Promise<{...}>'`);
                    }
                }
            }
        }
    });

    if (errors.length > 0) {
        hasErrors = true;
        console.log(`\n❌ Archivo: ${relativePath}`);
        errors.forEach(err => console.log(`   - ${err}`));
    }
});

if (hasErrors) {
    console.log('\n❌ Se detectaron handlers inválidos para Next.js 16. Corrige los errores antes del deploy.');
    process.exit(1);
} else {
    console.log('\n✅ Todos los Route Handlers son compatibles con Next.js 16.');
    process.exit(0);
}
