# Dashboard de perfiles deportivos

Carpeta lista para publicar en GitHub Pages.

## Archivos que tenes que subir

- `index.html`
- `styles.css`
- `app.js`
- `assets/paolo-dorini.jpeg`
- `.nojekyll`

## Publicar en GitHub Pages

1. Crear un repositorio en GitHub.
2. Subir todos los archivos de esta carpeta a la raiz del repositorio.
3. Ir a `Settings > Pages`.
4. En `Build and deployment`, elegir:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/root`
5. Guardar.

GitHub te va a dar un link parecido a:

```text
https://tu-usuario.github.io/nombre-del-repositorio/
```

## Importante

GitHub Pages no tiene servidor ni base de datos. Esta version guarda datos en el navegador de cada persona. Sirve como demo o uso simple, pero no como sistema seguro con datos compartidos entre admin y alumnos.

Para datos reales compartidos, usa la version con `serve_dashboard.mjs` en Render u otro hosting Node.
