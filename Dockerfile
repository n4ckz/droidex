FROM nginx:alpine

# Le journal persistant (nginx.conf) exige ce dossier même quand le volume
# ./logs n'est pas monté (compose local, auto-hébergement sans volume).
RUN mkdir -p /var/log/droidex

# nginx.conf est un GABARIT : l'entrypoint de l'image y substitue les
# variables d'environnement définies (ici UMAMI_UPSTREAM) et écrit le résultat
# dans conf.d/default.conf au démarrage. Défaut = conteneur « umami » sur le
# réseau Docker partagé ; surcharge via UMAMI_UPSTREAM dans le .env.
ENV UMAMI_UPSTREAM=http://umami:3000
COPY deploy/nginx.conf /etc/nginx/templates/default.conf.template
COPY deploy/security-headers.conf /etc/nginx/security-headers.conf
COPY site/ /usr/share/nginx/html/

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
