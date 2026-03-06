/**
 * Seed: MES 3 - Semana 1 y 2 (CICLO B)
 * duration = segundos de descanso entre series
 */
exports.seed = async function (knex) {
  await knex('routine_exercises').del();
  await knex('routines').del();
  await knex('exercises').del();
  await knex('categories').del();

  // ── CATEGORIAS ──────────────────────────────────────────────────────────────
  const catIds = {};
  const categories = [
    'Acondicionamiento', 'Piernas', 'Core',
    'Empuje', 'Jale', 'Gluteos', 'Metabolico',
  ];
  for (const name of categories) {
    const [id] = await knex('categories').insert({ name });
    catIds[name] = id;
  }

  // ── EJERCICIOS ───────────────────────────────────────────────────────────────
  const ex = {};
  const exercises = [
    // Acondicionamiento
    { key: 'rot_cadera',       name: 'Rotacion externa de cadera sentada con rollo', cat: 'Acondicionamiento' },
    { key: 'clamshell',        name: 'Clamshell', cat: 'Acondicionamiento' },
    { key: 'disoc_lumbar',     name: 'Disociacion lumbar + rotaciones con banda roja', cat: 'Acondicionamiento' },
    { key: 'hip_trust_apoyo',  name: 'Hip trust a un apoyo', cat: 'Acondicionamiento' },
    { key: 'dorsiflexion',     name: 'Dorsiflexion frontal para tobillo', cat: 'Acondicionamiento' },
    { key: 'switch_alt',       name: 'Switch alternado', cat: 'Acondicionamiento' },
    { key: 'russian_baby',     name: 'Russian baby maker', cat: 'Acondicionamiento' },
    // Core
    { key: 'plancha_alta',     name: 'Plancha alta con carga', desc: 'Apretar abdomen y cola. 20 segundos.', cat: 'Core' },
    { key: 'plancha_lat',      name: 'Plancha lateral baja', desc: '20 segundos por lado.', cat: 'Core' },
    { key: 'abd_bolita',       name: 'Abdominales bolita', cat: 'Core' },
    { key: 'twist_ruso',       name: 'Twist ruso', cat: 'Core' },
    { key: 'mountain',         name: 'Mountain climbers', cat: 'Core' },
    // Piernas
    { key: 'back_squat',       name: 'Back squat', desc: 'Carga fija al 70% de tu mejor carga. Escala 3x6 desde barra vacia.', cat: 'Piernas' },
    { key: 'curl_cuad',        name: 'Curl de cuadricep', desc: 'Carga progresiva.', cat: 'Piernas' },
    { key: 'peso_muerto',      name: 'Peso muerto convencional', desc: 'Escala 3x6 desde barra vacia.', cat: 'Piernas' },
    { key: 'sentadillas',      name: 'Sentadillas', cat: 'Piernas' },
    { key: 'estocadas',        name: 'Estocadas', desc: 'Que la rodilla llegue al piso.', cat: 'Piernas' },
    // Gluteos
    { key: 'patada_glutea',    name: 'Patada glutea con carga suave', desc: 'Controla la vuelta.', cat: 'Gluteos' },
    { key: 'puente_gluteo',    name: 'Puente gluteo', cat: 'Gluteos' },
    // Empuje
    { key: 'bench_press',      name: 'Bench press', desc: 'Carga progresiva desde el 70%. Escala 10, 8 y 6 reps desde barra vacia.', cat: 'Empuje' },
    { key: 'push_banda',       name: 'Push ups con banda desde rack', cat: 'Empuje' },
    { key: 'barbell_press',    name: 'Empty barbell seated press', desc: '15kg, piernas a 90°.', cat: 'Empuje' },
    { key: 'lateral_raises',   name: 'Doble mancuerna lateral raises', cat: 'Empuje' },
    { key: 'flexiones',        name: 'Flexiones de brazo', desc: 'Podes apoyar las rodillas.', cat: 'Empuje' },
    { key: 'fondos_tricep',    name: 'Fondos para tricep', cat: 'Empuje' },
    { key: 'pike_push',        name: 'Pike push ups', cat: 'Empuje' },
    // Jale
    { key: 'chin_ups',         name: 'Strict chin ups', cat: 'Jale' },
    // Metabolico
    { key: 'cf_swing',         name: 'CF swing', desc: '9kg.', cat: 'Metabolico' },
    { key: 'prisoner_lunges',  name: 'Prisoner lunges', cat: 'Metabolico' },
    { key: 'cal_row',          name: 'Cal row', desc: 'AMRAP.', cat: 'Metabolico' },
    { key: 'cal_bike',         name: 'Cal bike', cat: 'Metabolico' },
    { key: 'estocadas_cam',    name: 'Estocadas caminando sin carga', cat: 'Metabolico' },
    { key: 'half_burpee',      name: 'Half burpee plate', cat: 'Metabolico' },
    { key: 'shuttle_run',      name: 'Shuttle run 7.5 metros', cat: 'Metabolico' },
    { key: 'plank_jacks',      name: 'Plank jacks', cat: 'Metabolico' },
    { key: 'cal_remo',         name: 'Calorias en remo', cat: 'Metabolico' },
    { key: 'half_burpee_s2',   name: 'Half burpee plate', cat: 'Metabolico' },
    { key: 'trot_suave',       name: 'Trote suave', desc: '40 segundos.', cat: 'Metabolico' },
    { key: 'walk_out',         name: 'Walk out', cat: 'Metabolico' },
  ];

  for (const e of exercises) {
    const [id] = await knex('exercises').insert({
      name: e.name,
      description: e.desc || null,
      category_id: catIds[e.cat],
    });
    ex[e.key] = id;
  }

  // ── HELPER ───────────────────────────────────────────────────────────────────
  async function addExercises(routineId, list) {
    for (const item of list) {
      await knex('routine_exercises').insert({
        routine_id: routineId,
        exercise_id: item.id,
        sets: item.sets || null,
        reps: item.reps || null,
        duration: item.rest || null, // segundos de descanso entre series
      });
    }
  }

  // ── RUTINAS ──────────────────────────────────────────────────────────────────

  // ─── SEMANA 1 / DIA 1 ───────────────────────────────────────────────────────
  const [r_s1d1] = await knex('routines').insert({
    title: 'MES 3 - Semana 1 - DIA 1',
    notes: 'Ciclo B (09.02)',
  });
  await addExercises(r_s1d1, [
    // Acondicionamiento x3 rondas
    { id: ex.rot_cadera,      sets: 3, reps: 8,  rest: 0 },
    { id: ex.clamshell,       sets: 3, reps: 8,  rest: 0 },
    { id: ex.plancha_alta,    sets: 3, reps: 1,  rest: 0 },   // 20''
    // Bloque 1: 4 sets x2' descanso
    { id: ex.back_squat,      sets: 4, reps: 6,  rest: 120 },
    // Bloque 2: 3 sets x2' descanso
    { id: ex.curl_cuad,       sets: 3, reps: 12, rest: 120 },
    { id: ex.patada_glutea,   sets: 3, reps: 12, rest: 120 },
    // Bloque 3: 4 sets x2' descanso
    { id: ex.bench_press,     sets: 4, reps: 6,  rest: 120 },
    // Metabolico: 4 sets x3' c/1' descanso
    { id: ex.cf_swing,        sets: 4, reps: 15, rest: 60 },
    { id: ex.prisoner_lunges, sets: 4, reps: 14, rest: 60 },
    { id: ex.cal_row,         sets: 4, reps: null, rest: 60 },
  ]);

  // ─── SEMANA 1 / DIA 2 ───────────────────────────────────────────────────────
  const [r_s1d2] = await knex('routines').insert({
    title: 'MES 3 - Semana 1 - DIA 2',
    notes: 'Ciclo B (09.02)',
  });
  await addExercises(r_s1d2, [
    // Acondicionamiento x3 rondas
    { id: ex.disoc_lumbar,    sets: 3, reps: 10, rest: 0 },
    { id: ex.hip_trust_apoyo, sets: 3, reps: 8,  rest: 0 },
    { id: ex.plancha_lat,     sets: 3, reps: 1,  rest: 0 },   // 20''
    // Bloque 1: 4 sets x2' descanso
    { id: ex.peso_muerto,     sets: 4, reps: 6,  rest: 120 },
    // Bloque 2: 3 sets x2' descanso
    { id: ex.chin_ups,        sets: 3, reps: 5,  rest: 120 },
    { id: ex.push_banda,      sets: 3, reps: 7,  rest: 120 },
    // Bloque 3: 3 sets x2' descanso
    { id: ex.barbell_press,   sets: 3, reps: 8,  rest: 120 },
    { id: ex.lateral_raises,  sets: 3, reps: 8,  rest: 120 },
    // Metabolico: EMOM 16'
    { id: ex.cal_bike,        sets: 4, reps: 5,  rest: 0 },
    { id: ex.estocadas_cam,   sets: 4, reps: null, rest: 0 },  // 40''
    { id: ex.half_burpee,     sets: 4, reps: 7,  rest: 0 },
    { id: ex.shuttle_run,     sets: 4, reps: null, rest: 0 },  // 40''
  ]);

  // ─── SEMANA 1 / DIA 3 ───────────────────────────────────────────────────────
  const [r_s1d3] = await knex('routines').insert({
    title: 'MES 3 - Semana 1 - DIA 3',
    notes: 'Ciclo B (09.02)',
  });
  await addExercises(r_s1d3, [
    // Acondicionamiento x3 rondas
    { id: ex.dorsiflexion,    sets: 3, reps: 8,  rest: 0 },
    { id: ex.switch_alt,      sets: 3, reps: 8,  rest: 0 },
    { id: ex.russian_baby,    sets: 3, reps: 8,  rest: 0 },
    // Bloque 1: 3 rondas (core circuit)
    { id: ex.abd_bolita,      sets: 3, reps: 10, rest: 0 },
    { id: ex.twist_ruso,      sets: 3, reps: 20, rest: 0 },
    { id: ex.mountain,        sets: 3, reps: 30, rest: 0 },
    // Bloque 2: 3 sets x90'' descanso
    { id: ex.sentadillas,     sets: 3, reps: 10, rest: 90 },
    { id: ex.estocadas,       sets: 3, reps: 10, rest: 90 },
    { id: ex.puente_gluteo,   sets: 3, reps: 10, rest: 90 },
    // Bloque 3: 3 sets x90'' descanso
    { id: ex.flexiones,       sets: 3, reps: 10, rest: 90 },
    { id: ex.fondos_tricep,   sets: 3, reps: 10, rest: 90 },
    { id: ex.pike_push,       sets: 3, reps: 10, rest: 90 },
  ]);

  // ─── SEMANA 2 / DIA 1 ───────────────────────────────────────────────────────
  const [r_s2d1] = await knex('routines').insert({
    title: 'MES 3 - Semana 2 - DIA 1',
    notes: 'Ciclo B (16.02)',
  });
  await addExercises(r_s2d1, [
    { id: ex.rot_cadera,      sets: 3, reps: 8,  rest: 0 },
    { id: ex.clamshell,       sets: 3, reps: 8,  rest: 0 },
    { id: ex.plancha_alta,    sets: 3, reps: 1,  rest: 0 },
    // Bloque 1: 4 sets x2' — carga progresiva desde 70%
    { id: ex.back_squat,      sets: 4, reps: 6,  rest: 120 },
    // Bloque 2: 3 sets x2'
    { id: ex.curl_cuad,       sets: 3, reps: 10, rest: 120 },
    { id: ex.patada_glutea,   sets: 3, reps: 10, rest: 120 },
    // Bloque 3: 4 sets x2' — carga desde 75%
    { id: ex.bench_press,     sets: 4, reps: 4,  rest: 120 },
    // Metabolico: 4 sets x3' c/1' descanso
    { id: ex.cal_remo,        sets: 4, reps: 10, rest: 60 },
    { id: ex.half_burpee,     sets: 4, reps: 10, rest: 60 },
    { id: ex.plank_jacks,     sets: 4, reps: null, rest: 60 },
  ]);

  // ─── SEMANA 2 / DIA 2 ───────────────────────────────────────────────────────
  const [r_s2d2] = await knex('routines').insert({
    title: 'MES 3 - Semana 2 - DIA 2',
    notes: 'Ciclo B (16.02)',
  });
  await addExercises(r_s2d2, [
    { id: ex.disoc_lumbar,    sets: 3, reps: 10, rest: 0 },
    { id: ex.hip_trust_apoyo, sets: 3, reps: 8,  rest: 0 },
    { id: ex.plancha_lat,     sets: 3, reps: 1,  rest: 0 },
    // Bloque 1: 4 sets x2' — levemente + pesado
    { id: ex.peso_muerto,     sets: 4, reps: 6,  rest: 120 },
    // Bloque 2: 3 sets x2'
    { id: ex.chin_ups,        sets: 3, reps: 5,  rest: 120 },
    { id: ex.push_banda,      sets: 3, reps: 7,  rest: 120 },
    // Bloque 3: 3 sets x2'
    { id: ex.barbell_press,   sets: 3, reps: 9,  rest: 120 },
    { id: ex.lateral_raises,  sets: 3, reps: 8,  rest: 120 },
    // Metabolico: EMOM 16'
    { id: ex.trot_suave,      sets: 4, reps: null, rest: 0 },
    { id: ex.estocadas_cam,   sets: 4, reps: 20,   rest: 0 },
    { id: ex.trot_suave,      sets: 4, reps: null, rest: 0 },
    { id: ex.walk_out,        sets: 4, reps: 10,   rest: 0 },
  ]);

  // ─── SEMANA 2 / DIA 3 ───────────────────────────────────────────────────────
  const [r_s2d3] = await knex('routines').insert({
    title: 'MES 3 - Semana 2 - DIA 3',
    notes: 'Ciclo B (16.02) — Si no hiciste la semana 1, arranca x ahi',
  });
  await addExercises(r_s2d3, [
    { id: ex.dorsiflexion,    sets: 3, reps: 8,  rest: 0 },
    { id: ex.switch_alt,      sets: 3, reps: 8,  rest: 0 },
    { id: ex.russian_baby,    sets: 3, reps: 8,  rest: 0 },
    // Bloque 1: 3 rondas
    { id: ex.abd_bolita,      sets: 3, reps: 12, rest: 0 },
    { id: ex.twist_ruso,      sets: 3, reps: 20, rest: 0 },
    { id: ex.mountain,        sets: 3, reps: 30, rest: 0 },
    // Bloque 2: 3 sets x90''
    { id: ex.sentadillas,     sets: 3, reps: 13, rest: 90 },
    { id: ex.estocadas,       sets: 3, reps: 16, rest: 90 },
    { id: ex.puente_gluteo,   sets: 3, reps: 20, rest: 90 },
    // Bloque 3: 3 sets x90''
    { id: ex.flexiones,       sets: 3, reps: 10, rest: 90 },
    { id: ex.fondos_tricep,   sets: 3, reps: 13, rest: 90 },
    { id: ex.pike_push,       sets: 3, reps: 10, rest: 90 },
  ]);
};
