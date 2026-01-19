# Arquitectura del Sistema - Asistente SDR AI

## Visión General
Plataforma SaaS para SDRs (Sales Development Representatives) que proporciona asistencia en tiempo real durante llamadas de ventas, sugerencias de manejo de objeciones y aprendizaje continuo basado en interacciones exitosas.

## Stack Tecnológico
*   **Frontend**: Next.js 14+ (App Router), React, TailwindCSS, Lucide Icons.
*   **Backend**: Next.js API Routes (Serverless), OpenAI API.
*   **Base de Datos**: Supabase (PostgreSQL) con extensión `pgvector`.
*   **Autenticación**: Supabase Auth (SSR).
*   **Orquestación**: n8n (Integración planificada), API de Feedback interna.

## Estructura de Datos (Supabase)

### 1. `organizations`
Entidad raíz para multi-tenancy.
*   `id`: UUID
*   `name`: Texto
*   `settings`: JSONB (Configuración regional, prompts)

### 2. `knowledge_base`
Almacén de conocimiento vectorial (RAG).
*   `organization_id`: FK -> organizations
*   `content`: Texto del fragmento (Chunk).
*   `embedding`: vector(1536) (OpenAI text-embedding-3-small).
*   `metadata`: JSONB (tags, source, trigger).

### 3. `deals` (Pipeline)
Gestión de oportunidades de venta.
*   `title`, `company`, `value`, `stage`, `probability`.
*   `organization_id`: FK -> organizations.

### 4. `interactions`
Registro de llamadas y transcripciones.
*   `transcript_full`: Texto completo (Lead + SDR).
*   `status`: 'SUCCESS' | 'FAILURE' | 'NEUTRAL'.
*   `organization_id`: FK -> organizations.

## Flujos Principales

### 1. Ingesta de Conocimiento
*   **Manual**: Vía UI `/dashboard/knowledge` -> API `/api/ingest`.
*   **Automática**: Script de Seed con datos de Pxsol scrapeados.

### 2. Asistencia en Vivo (RAG)
1.  **Input**: Usuario escribe/dicta en `/dashboard/assistant`.
2.  **API**: Llama a `/api/context`.
3.  **Recuperación**: RPC `match_documents` busca similitudes en `knowledge_base`.
4.  **Generación**: OpenAI (GPT-4o) actúa como "Sales Engineer" usando el contexto.
5.  **Output**: Sugerencia mostrada en el panel lateral.

### 3. Bucle de Aprendizaje (Feedback Loop)
1.  **Trigger**: Usuario finaliza llamada y marca "Great Job" (Modal).
2.  **Proceso**: API `/api/feedback`.
3.  **Análisis**: LLM extrae pares Objeción/Respuesta de la transcripción exitosa.
4.  **Aprendizaje**: Se insertan nuevos registros en `knowledge_base` con tag `dynamic_learning`.

## Componentes Clave
*   **Dashboard**: Vista de Pipeline con datos reales (`useEffect` -> `supabase.from('deals')`).
*   **Live Assistant**: Interfaz de chat simulado con integración de Co-Piloto.
*   **Knowledge Manager**: ABM de documentos e ingesta manual.

## Seguridad
*   **RLS (Row Level Security)**: Habilitado en todas las tablas.
*   **Aislamiento**: Políticas aseguran que un usuario solo acceda a datos de su `organization_id` (Actualmente prototipo con acceso autenticado general).

---
*Documento generado por el Agente Documentador - 18 Ene 2026*
