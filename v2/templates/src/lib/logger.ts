type Fields = Record<string, unknown>;

function emit(level: string, fields: Fields | string, msg?: string) {
  const ts = new Date().toISOString();
  if (typeof fields === 'string') {
    console.log(JSON.stringify({ ts, level, msg: fields }));
  } else {
    console.log(JSON.stringify({ ts, level, msg, ...fields }));
  }
}

export const logger = {
  debug: (a: Fields | string, b?: string) => emit('debug', a, b),
  info: (a: Fields | string, b?: string) => emit('info', a, b),
  warn: (a: Fields | string, b?: string) => emit('warn', a, b),
  error: (a: Fields | string, b?: string) => emit('error', a, b),
};

export type Logger = typeof logger;
