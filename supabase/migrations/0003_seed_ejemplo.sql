-- Datos de ejemplo opcionales para probar la plataforma.
-- NO ejecutar en producción con datos reales de gremios del banco:
-- este archivo es solo para levantar un entorno de prueba local/staging.
--
-- Corre los tres archivos de supabase/migrations en orden (0001, 0002, 0003)
-- en el SQL Editor de Supabase.
--
-- Los usuarios (Auth) se crean desde el dashboard de Supabase o con
-- supabase.auth.admin.createUser(); el trigger handle_new_user ya crea
-- el perfil automáticamente con rol 'delegado'. Para promover a alguien
-- a administrador:
--
--   update public.profiles set role = 'administrador' where id = '<uuid-del-usuario>';
--
-- Gremios de ejemplo (datos reales de la matriz de relacionamiento gremial,
-- útiles como referencia del "shape" de datos que espera la UI):
insert into public.gremios
  (nombre, objetivos, estado, nombre_completo, perfil_institucional, metas, temas_priorizados, valor_estrategico, periodicidad_reuniones, renovacion_directorio, comites, nivel_prioridad, champions)
values
  (
    'Cámara de Comercio de Quito',
    'Fortalecer la relación institucional con el banco y monitorear la agenda regulatoria que afecta al sector comercial.',
    'activo',
    'Cámara de Comercio de Quito',
    'Gremio multisectorial que agrupa al comercio de Quito.',
    'Presencia puntual, sin asumir un rol de liderazgo.',
    '["Relacionamiento institucional", "Visibilidad en el ecosistema empresarial de Quito"]',
    'Visibilidad institucional en el ecosistema empresarial de Quito, con esfuerzo puntual.',
    'Reuniones mensuales',
    'Cada 2 años (periodo vigente 2025–2027)',
    '["Ambiente y Energía", "Economía Digital", "Anticorrupción y Responsabilidad Corporativa", "Arbitraje y Resolución Alternativa de Conflictos (ADR)", "Competencia", "Propiedad Intelectual", "Aduanas y Facilitación del Comercio"]',
    'media',
    '["Gabriela Borja"]'
  ),
  (
    'Asociación de Bancos Privados del Ecuador',
    'Dar seguimiento conjunto a iniciativas normativas del sector financiero y coordinar posiciones gremiales.',
    'activo',
    'Asociación de Bancos Privados del Ecuador',
    'Gremio que agrupa a la banca privada del Ecuador; principal interlocutor del sector financiero ante el regulador y la opinión pública. Opera con Directorio rotativo y comités técnicos especializados en temas regulatorios.',
    'Alinear la participación en comités con las prioridades del Banco y mantener presencia de alto nivel en la rotación del Directorio.',
    '["Agenda regulatoria y financiera", "Protección de la operación bancaria", "Posicionamiento ante el regulador"]',
    'Principal vehículo de incidencia sectorial; asegura que las prioridades regulatorias del Banco se incorporen y defiendan colectivamente.',
    'Reuniones mensuales, el primer miércoles de cada mes.',
    'Cada 2 años (periodo vigente 2023–2025); el presidente mantiene su mandato en 2026 pese a la finalización del periodo.',
    '["Comité Ecuatoriano de Derecho Bancario", "Comité Ecuatoriano de Seguridad Bancaria Integral – física", "Comité Ecuatoriano de Seguridad Bancaria Integral – información", "Comité Ecuatoriano de Oficiales de Cumplimiento", "Comité Ecuatoriano de Recursos Humanos", "Comité Ecuatoriano de Riesgos Bancarios", "Comité Ecuatoriano de Finanzas Sostenibles"]',
    'alta',
    '["Alejandro Ribadeneira"]'
  ),
  (
    'Cámara de Industrias y Producción',
    'Coordinar una posición conjunta en temas de competitividad industrial y financiamiento productivo.',
    'en_pausa',
    'Cámara de Industrias y Producción de Quito',
    'Gremio empresarial que agrupa al sector industrial y productivo de Quito. Opera con Directorio y comités técnicos; referente de incidencia regulatoria para el sector productivo.',
    'Participar en los comités Jurídico y Energético; posicionar seguridad jurídica, competitividad, energía y digitalización.',
    '["Seguridad jurídica", "Competitividad", "Energía", "Digitalización"]',
    'Plataforma de liderazgo empresarial y entorno de negocios; proyecta al Banco como articulador del sector productivo de Quito.',
    'Reuniones mensuales o bimensuales.',
    'Cada 2 años (periodo vigente 2025–2027)',
    '["Comisión Jurídica y de Cumplimiento", "Comisión de Comunicación", "Comisión de Competitividad", "Comisión de Comercio Exterior y Competencia Desleal", "Comisión de Sostenibilidad e Innovación", "Comisión de Territorio", "Comisión de Seguridad", "Comisión de Mejoramiento de Edificio las Cámaras", "Comisión de Energía"]',
    'alta',
    '["Alejandro Ribadeneira"]'
  ),
  (
    'Federación Nacional de Cámaras de Comercio',
    'Mapear la agenda nacional gremial y mantener puntos de contacto clave en cada provincia.',
    'activo',
    'Federación Nacional de Cámaras de Comercio del Ecuador',
    'Organización que agrupa a las cámaras de comercio provinciales del país, articulando su agenda gremial a nivel nacional.',
    'Mantener puntos de contacto activos en cada cámara provincial relevante para la operación del Banco.',
    '["Agenda gremial nacional", "Comercio provincial", "Puntos de contacto regionales"]',
    'Acceso a la red nacional de cámaras de comercio, útil para la presencia territorial del Banco.',
    'Reuniones trimestrales.',
    'Cada 2 años.',
    '["Comisión de Comercio Interior", "Comisión de Relaciones Interinstitucionales"]',
    'media',
    '["Por definir"]'
  ),
  (
    'CITEC',
    'Incidir en comités técnicos sobre marco regulatorio digital, fintech y transformación tecnológica.',
    'activo',
    'Cámara de Innovación y Tecnología Ecuatoriana',
    'Gremio sectorial enfocado en la agenda digital y tecnológica del país: marco regulatorio digital, entidades de certificación, fintech y transformación tecnológica.',
    'Presencia activa en comités y uso de la vocería gremial para acompañar reformas relevantes.',
    '["Marco regulatorio digital", "Entidades de certificación", "Fintech", "Transformación tecnológica"]',
    'Vehículo de incidencia técnica en la agenda digital y de transformación tecnológica relevante para el negocio del Banco.',
    'Reuniones mensuales.',
    'Cada 3 años (periodo vigente 2025–2028)',
    '["Marco Regulatorio", "Talento Humano", "Internacionalización", "E-commerce", "Inteligencia Artificial", "Entidades de Certificación", "Fintech", "Mujeres en Tecnología"]',
    'media_alta',
    '["Carolina Turín", "Gabriela Borja"]'
  );
