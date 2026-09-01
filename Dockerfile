FROM nginx:alpine

# Le journal persistant (nginx.conf) exige ce dossier même quand le volume
# ./logs n'est pas monté (compose local, auto-hébergement sans volume).
RUN mkdir -p /var/log/droidex

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf
COPY deploy/security-headers.conf /etc/nginx/security-headers.conf
COPY site/ /usr/share/nginx/html/

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1/ || exit 1
