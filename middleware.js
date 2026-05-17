export function middleware(request) {
  const { pathname } = new URL(request.url);

  // Solo proteger Procesador.html
  if (pathname !== '/Procesador.html') return;

  const auth = request.headers.get('authorization');

  if (auth && auth.startsWith('Basic ')) {
    const credentials = atob(auth.slice(6));
    const colonPos = credentials.indexOf(':');
    const password = credentials.slice(colonPos + 1);
    if (password === process.env.PROCESADOR_PASSWORD) return; // acceso concedido
  }

  // Acceso denegado → el navegador muestra el diálogo de contraseña
  return new Response('🔒 Área restringida — Nutricionista', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Nutricionista"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export const config = {
  matcher: '/Procesador.html',
};
