// (19/11) onde está o servidor do jogo.
// Em casa (localhost / rede local) o próprio servidor Python entrega a página: tudo no mesmo endereço.
// Publicado (Vercel), a página vem do Vercel e o jogo fala com o servidor no Render.
window.JJ_SERVIDOR=/\.vercel\.app$/.test(location.hostname)?'js-jet.onrender.com':null;
window.JJ_PUBLICO=!/^(localhost|127\.|192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(location.hostname);
