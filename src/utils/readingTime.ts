/**
 * Calcula el tiempo estimado de lectura basado en el contenido
 * @param content - Contenido HTML o texto plano
 * @param wordsPerMinute - Palabras por minuto (promedio: 200-250)
 * @returns Objeto con tiempo estimado y estadísticas
 */
export interface ReadingTimeResult {
  minutes: number;
  words: number;
  text: string;
  time: number; // en milisegundos
}

export function calculateReadingTime(
  content: string, 
  wordsPerMinute: number = 225
): ReadingTimeResult {
  // Remover HTML tags y entidades
  const cleanText = content
    .replace(/<[^>]*>/g, '') // Remover HTML
    .replace(/&[^;]+;/g, ' ') // Remover entidades HTML
    .replace(/\s+/g, ' ') // Normalizar espacios
    .trim();

  // Contar palabras (considerando idioma español)
  const words = cleanText
    .split(/\s+/)
    .filter(word => word.length > 0).length;

  // Calcular tiempo en minutos
  const minutes = Math.ceil(words / wordsPerMinute);
  
  // Tiempo en milisegundos para Schema.org
  const timeInMs = (words / wordsPerMinute) * 60 * 1000;

  // Generar texto legible
  let text: string;
  if (minutes === 1) {
    text = '1 min de lectura';
  } else if (minutes < 60) {
    text = `${minutes} min de lectura`;
  } else {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      text = `${hours}h de lectura`;
    } else {
      text = `${hours}h ${remainingMinutes}min de lectura`;
    }
  }

  return {
    minutes,
    words,
    text,
    time: Math.round(timeInMs)
  };
}

/**
 * Formatea el número de palabras de manera legible
 */
export function formatWordCount(words: number): string {
  if (words < 1000) {
    return `${words} palabras`;
  } else if (words < 1000000) {
    const k = Math.round(words / 100) / 10;
    return `${k}k palabras`;
  } else {
    const m = Math.round(words / 100000) / 10;
    return `${m}M palabras`;
  }
}

/**
 * Calcula el tiempo de lectura para múltiples contenidos
 */
export function calculateTotalReadingTime(
  contents: string[], 
  wordsPerMinute: number = 225
): ReadingTimeResult {
  const totalWords = contents.reduce((total, content) => {
    const result = calculateReadingTime(content, wordsPerMinute);
    return total + result.words;
  }, 0);

  return calculateReadingTime(contents.join(' '), wordsPerMinute);
}
