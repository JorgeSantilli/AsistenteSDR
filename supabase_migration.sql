-- 1. Crear la tabla para rastrear las sugerencias de la IA
CREATE TABLE IF NOT EXISTS interaction_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interaction_id UUID REFERENCES interactions(id) ON DELETE CASCADE,
  objection_text TEXT NOT NULL,
  suggestion_text TEXT NOT NULL,
  is_useful BOOLEAN DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Habilitar Seguridad de Nivel de Fila (RLS)
ALTER TABLE interaction_suggestions ENABLE ROW LEVEL SECURITY;

-- 3. Eliminar la política existente si ya existe
DROP POLICY IF EXISTS "Users can manage suggestions for their org interactions" ON interaction_suggestions;

-- 4. Crear la política de acceso
CREATE POLICY "Users can manage suggestions for their org interactions"
ON interaction_suggestions FOR ALL USING (
  EXISTS (SELECT 1 FROM interactions WHERE interactions.id = interaction_suggestions.interaction_id)
);
