#!/bin/bash
# Lo ejecuta Cloudflare cada vez que hay un cambio en GitHub (rama main o uat).
# Copia SOLO los archivos del sitio a la carpeta "publicado"; deja fuera pruebas y archivos internos.
set -e
rm -rf publicado
mkdir publicado
for f in *; do
  case "$f" in
    publicado|pruebas|README.md|cloudflare-publicar.sh|wrangler.jsonc|node_modules) ;;
    *) cp -r "$f" publicado/ ;;
  esac
done
echo "Archivos publicados:"; ls -R publicado
