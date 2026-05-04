const fs = require('fs');
const path = require('path');

const outputDir = 'C:\\Users\\GONZALO\\.gemini\\antigravity\\brain\\6c3fb499-cd82-4a8d-8e22-ce2c0076a82b\\.system_generated';

const tables = [
    { name: 'venezuela_dpa', file: 'steps/642/output.txt' },
    { name: 'profiles', file: 'steps/634/output.txt' },
    { name: 'catalog_items', file: 'steps/637/output.txt' },
    { name: 'cat_bodegas_moviles', file: 'steps/643/output.txt' },
    { name: 'cat_emprendimiento_tipos', content: `[{"id":"8c683ffd-ef74-4077-b0c3-ceab686fc729","nombre":"CALZADO","created_at":"2026-03-14 17:55:24.967827+00"},{"id":"b9db2443-9d79-42f3-9dec-97369b9ea177","nombre":"COMIDA CASERA","created_at":"2026-03-14 17:55:24.967827+00"},{"id":"cae164d3-1ef2-446c-9bad-5afb24690bfd","nombre":"TEXTIL / ROPA","created_at":"2026-03-14 17:55:24.967827+00"},{"id":"d30dcecb-e2e4-4230-a6fe-40aedbfbaa40","nombre":"ARTESANÍA","created_at":"2026-03-14 17:55:24.967827+00"},{"id":"2189d504-14f2-4542-9952-3c7b189d0af7","nombre":"VARIEDADES","created_at":"2026-03-14 17:55:24.967827+00"},{"id":"d6a941ca-11ff-49d6-9a68-d0665b24b4ca","nombre":"PRODUCTOS DE LIMPIEZA","created_at":"2026-03-14 17:55:24.967827+00"},{"id":"e811fbe6-350b-4cd6-bb5e-8c1fe4b4cb36","nombre":"DULCERÍA CRIOLLA","created_at":"2026-03-14 17:55:24.967827+00"}]` },
    { name: 'cat_emprendimiento_campos', content: `[{"id":"fd077591-8a43-42e1-a515-8b21c4c24a4b","nombre":"nombre","etiqueta":"Nombre del Emprendedor","tipo":"texto","requerido":true,"activo":true,"orden":1,"created_at":"2026-03-14 18:21:02.799703+00"},{"id":"ca719163-3197-4820-a9c9-232550c0ff04","nombre":"actividad","etiqueta":"Tipo de Actividad","tipo":"texto","requerido":true,"activo":true,"orden":2,"created_at":"2026-03-14 18:21:02.799703+00"},{"id":"da754237-01cf-4825-bf6c-aac368f9c7c0","nombre":"telefono","etiqueta":"Teléfono de Contacto","tipo":"telefono","requerido":false,"activo":true,"orden":3,"created_at":"2026-03-14 18:21:02.799703+00"},{"id":"4391dff4-a15a-4643-878d-ba5c27f192b9","nombre":"correo_electrnico","etiqueta":"CORREO ELECTRÓNICO","tipo":"email","requerido":false,"activo":true,"orden":10,"created_at":"2026-03-14 18:59:42.66627+00"}]` },
    { name: 'vulnerability_data', content: `[{"id":"0fb2fc38-2cb2-4eb0-b86f-56b2453b2bd9","estado":"ZULIA","municipio":"MARACAIBO","parroquia":"IDELFONSO VASQUEZ","nivel_prioridad":5,"descripcion_problema":"Comunidad indígena con alta inseguridad alimentaria","latitud":10.7167,"longitud":-71.6667,"fecha_registro":"2026-03-13 18:30:28.723283+00","fecha_actualizacion":"2026-03-13 18:30:28.723283+00"},{"id":"59c13893-46db-4706-bc67-b5d7f1f4bb03","estado":"SUCRE","municipio":"BERMUDEZ","parroquia":"CARUPANO","nivel_prioridad":4,"descripcion_problema":"Zonas costeras con déficit de proteína","latitud":10.6678,"longitud":-63.2585,"fecha_registro":"2026-03-13 18:30:28.723283+00","fecha_actualizacion":"2026-03-13 18:30:28.723283+00"},{"id":"b01b991b-fbb3-4bb1-b1f1-07af298311bb","estado":"APURE","municipio":"PAEZ","parroquia":"GUASDUALITO","nivel_prioridad":5,"descripcion_problema":"Zonas fronterizas con difícil acceso a rubros básicos","latitud":7.2424,"longitud":-70.7322,"fecha_registro":"2026-03-13 18:30:28.723283+00","fecha_actualizacion":"2026-03-13 18:30:28.723283+00"},{"id":"2311ba19-c218-4f23-b46a-3461cac5c1db","estado":"AMAZONAS","municipio":"ATURES","parroquia":"PUERTO AYACUCHO","nivel_prioridad":4,"descripcion_problema":"Bajo suministro constante por temas logísticos","latitud":5.6639,"longitud":-67.6258,"fecha_registro":"2026-03-13 18:30:28.723283+00","fecha_actualizacion":"2026-03-13 18:30:28.723283+00"},{"id":"c2b70986-de90-49f4-9aed-538e48c3fb4a","estado":"BOLIVAR","municipio":"CARONI","parroquia":"SAN FELIX","nivel_prioridad":3,"descripcion_problema":"Necesidad moderada en sectores periféricos","latitud":8.3513,"longitud":-62.641,"fecha_registro":"2026-03-13 18:30:28.723283+00","fecha_actualizacion":"2026-03-13 18:30:28.723283+00"},{"id":"31b0c00e-6620-4a42-b3e8-451e04dc01cf","estado":"AMAZONAS","municipio":"SAN CARLOS DE RIO NEGRO","parroquia":"SAN CARLOS DE RIO NEGRO","nivel_prioridad":4,"descripcion_problema":"Dificil acceso","latitud":1.92,"longitud":-67.06,"fecha_registro":"2026-03-13 19:48:28.037967+00","fecha_actualizacion":"2026-03-13 19:48:28.037967+00"}]` },
    { name: 'reports', file: 'steps/635/output.txt' },
    { name: 'report_items', file: 'steps/636/output.txt' },
    { name: 'report_payment_methods', file: 'steps/640/output.txt' },
    { name: 'report_entrepreneurs', file: 'steps/651/output.txt' },
    { name: 'report_minppal_presencia', file: 'steps/641/output.txt' },
    { name: 'state_product_planning', content: `[{"id":"5ab16e49-3088-4ae0-b95c-f440ba6c2eb2","estado":"AMAZONAS","product_id":"77abb3c9-4134-476f-a6b1-2f7aea3e11f9","cantidad_planificada":"10000.00","cantidad_asignada":"9000.00","cantidad_recibida":"8500.00","periodo":"2026-W14","created_at":"2026-04-01 17:45:03.985551+00","updated_at":"2026-04-01 17:45:03.985551+00"},{"id":"8ddc4a58-5c7f-47f6-a1e6-7291cb3e3089","estado":"AMAZONAS","product_id":"e6f88138-16ce-4cfd-b92b-c8b74a763323","cantidad_planificada":"1000.00","cantidad_asignada":"800.00","cantidad_recibida":"750.00","periodo":"2026-W14","created_at":"2026-04-01 17:45:03.985551+00","updated_at":"2026-04-01 17:45:03.985551+00"},{"id":"73f71bb4-1aec-4eaa-b0a5-e569a77c8707","estado":"APURE","product_id":"e6f88138-16ce-4cfd-b92b-c8b74a763323","cantidad_planificada":"2.00","cantidad_asignada":"0.00","cantidad_recibida":"0.00","periodo":"2026-W14","created_at":"2026-04-01 17:53:05.458136+00","updated_at":"2026-04-01 17:53:05.458136+00"},{"id":"f37a5c7c-793b-4618-b4f1-051bde4fb790","estado":"APURE","product_id":"4686aa12-80d2-46ef-975c-e3b1c00b0205","cantidad_planificada":"100.00","cantidad_asignada":"0.00","cantidad_recibida":"0.00","periodo":"2026-W14","created_at":"2026-04-01 17:53:05.458136+00","updated_at":"2026-04-01 17:53:05.458136+00"},{"id":"548ce41c-6c9a-4c4e-acd4-0200f1093fc0","estado":"APURE","product_id":"55c3b340-2f56-4c1b-8536-5bda3bc40210","cantidad_planificada":"3.50","cantidad_asignada":"0.00","cantidad_recibida":"0.00","periodo":"2026-W14","created_at":"2026-04-01 17:53:05.458136+00","updated_at":"2026-04-01 17:53:05.458136+00"}]` },
    { name: 'chat_messages', content: `[{"id":"ef513f02-d0b4-44dc-b322-d0a919eeac99","sender_id":"8ab61321-c31d-47d7-96e4-bf72bddd39fc","receiver_id":"842b9872-ed5e-42a6-8c79-647cfbef7ef3","content":"Esto es solo un mensaje de prueba, el Servidor estuvo caido casi una hora","created_at":"2026-03-06 17:06:10.244423+00","read":false},{"id":"b03198c2-baea-4347-ad26-d7c3c4640dbf","sender_id":"8ab61321-c31d-47d7-96e4-bf72bddd39fc","receiver_id":"6969e394-4942-41b3-98a4-3efe72758098","content":"Hola buenos dias","created_at":"2026-03-29 14:57:29.347131+00","read":true},{"id":"3fbb6dc4-6129-46bd-891e-7d944cf6feed","sender_id":"6969e394-4942-41b3-98a4-3efe72758098","receiver_id":"8ab61321-c31d-47d7-96e4-bf72bddd39fc","content":"Buenos días","created_at":"2026-03-30 11:59:43.975718+00","read":true},{"id":"806a8619-4408-49ac-8f70-c10d9b1d041e","sender_id":"8ab61321-c31d-47d7-96e4-bf72bddd39fc","receiver_id":"6969e394-4942-41b3-98a4-3efe72758098","content":"Hoy es lunes Santo 30 marzo 2026","created_at":"2026-03-30 13:15:28.482807+00","read":true},{"id":"7463c0d9-7759-4e43-b071-dbdd7ce1fb85","sender_id":"6969e394-4942-41b3-98a4-3efe72758098","receiver_id":"8ab61321-c31d-47d7-96e4-bf72bddd39fc","content":"Feliz lunes","created_at":"2026-03-30 13:15:52.301505+00","read":true},{"id":"11cc2254-72bd-480d-8b1d-f7e287c966a1","sender_id":"6969e394-4942-41b3-98a4-3efe72758098","receiver_id":"8ab61321-c31d-47d7-96e4-bf72bddd39fc","content":"Buenos días a todos .en la mañana de hoy","created_at":"2026-03-30 14:10:42.857075+00","read":true},{"id":"a9e752df-f6e7-4939-8835-b37deb3a9c3f","sender_id":"8ab61321-c31d-47d7-96e4-bf72bddd39fc","receiver_id":"6969e394-4942-41b3-98a4-3efe72758098","content":"Recibido","created_at":"2026-03-30 15:03:32.934195+00","read":true},{"id":"032748c9-b901-4654-906f-222f62152d56","sender_id":"48cfc817-a3f7-479a-b1aa-2efdfdf42031","receiver_id":"8ab61321-c31d-47d7-96e4-bf72bddd39fc","content":"hermano bt. no me carga la foto de galeria zulia.","created_at":"2026-04-18 20:03:12.674947+00","read":true}]` }
];

let sqlHeader = `-- RESPALDO INTEGRAL DE LA NUBE (SUPABASE) - FERIA CAMPO SOBERANO\n`;
sqlHeader += `-- Fecha: ${new Date().toISOString()}\n\n`;
sqlHeader += `SET session_replication_role = 'replica';\n\n`;

const fd = fs.openSync('respaldo_completo_nube.sql', 'w');
fs.writeSync(fd, sqlHeader);

function formatValue(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
    if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
    if (Array.isArray(val)) return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
    return val;
}

tables.forEach(table => {
    let data;
    console.log(`Procesando tabla: ${table.name}`);
    if (table.file) {
        const filePath = path.join(outputDir, table.file);
        if (fs.existsSync(filePath)) {
            try {
                // Leer el archivo como Buffer para evitar problemas con strings gigantescos en reports
                const rawBuffer = fs.readFileSync(filePath);
                const rawString = rawBuffer.toString('utf8');
                
                // Extraer el campo "result" manualmente para evitar JSON.parse en el objeto exterior que puede ser muy grande
                const resultStartKey = '"result":"';
                let resStartIndex = rawString.indexOf(resultStartKey);
                if (resStartIndex === -1) {
                    // Quizás sea minúscula o sin comillas dobles extremas (raro)
                    throw new Error('No se encontró el campo "result"');
                }
                resStartIndex += resultStartKey.length;
                
                // Encontrar el inicio real del JSON (el primer '[' después de la intro)
                const startBracket = rawString.indexOf('[', resStartIndex);
                const endBracket = rawString.lastIndexOf(']');
                
                if (startBracket !== -1 && endBracket !== -1 && endBracket > startBracket) {
                    const jsonStr = rawString.substring(startBracket, endBracket + 1);
                    // IMPORTANTE: El JSON dentro del string "result" tiene escapes para las comillas y newlines
                    // Tenemos que "des-escapar" si lo extraemos así, o mejor, parseamos solo esa parte.
                    // Pero espera, si extraemos del JSON exterior, las comillas internas están escapadas como \"
                    // Vamos a intentar un truco: parsear el objeto exterior pero solo si no es el de 292MB.
                    
                    if (rawBuffer.length > 100 * 1024 * 1024) { // > 100MB
                         console.log(`Archivo masivo detected (${(rawBuffer.length/1024/1024).toFixed(2)} MB), procesando por fragmentos...`);
                         // Para el archivo de 292MB, necesitamos una limpieza de escapes manual o usar un parser de streams.
                         // Por ahora, intentaremos un parseo simplificado de los escapes.
                         const cleanJson = jsonStr.replace(/\\"/g, '"').replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t');
                         data = JSON.parse(cleanJson);
                    } else {
                        const outerJson = JSON.parse(rawString);
                        const resultStr = outerJson.result;
                        const innerStart = resultStr.indexOf('[');
                        const innerEnd = resultStr.lastIndexOf(']');
                        if (innerStart !== -1 && innerEnd !== -1) {
                            data = JSON.parse(resultStr.substring(innerStart, innerEnd + 1));
                        }
                    }
                }
            } catch (e) {
                console.error(`Error procesando archivo para ${table.name}: ${e.message}`);
            }
        }
    } else if (table.content) {
        data = JSON.parse(table.content);
    }

    if (data && data.length > 0) {
        fs.writeSync(fd, `-- Datos para la tabla: ${table.name} (${data.length} filas)\n`);
        const columns = Object.keys(data[0]);
        
        // Insertar en bloques para evitar sentencias SQL gigantescas
        const batchSize = 100;
        for (let i = 0; i < data.length; i += batchSize) {
            const batch = data.slice(i, i + batchSize);
            fs.writeSync(fd, `INSERT INTO public.${table.name} (${columns.join(', ')}) VALUES\n`);
            for (let j = 0; j < batch.length; j++) {
                const row = batch[j];
                const values = columns.map(col => formatValue(row[col])).join(', ');
                fs.writeSync(fd, `(${values})${j === batch.length - 1 ? ';' : ','}\n`);
            }
        }
        fs.writeSync(fd, `\n`);
    } else {
        fs.writeSync(fd, `-- No hay datos para la tabla: ${table.name}\n\n`);
    }
});

fs.writeSync(fd, `SET session_replication_role = 'origin';\n`);
fs.closeSync(fd);
console.log('Respaldo generado exitosamente en respaldo_completo_nube.sql');
