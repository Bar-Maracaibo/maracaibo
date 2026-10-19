/* Datos del negocio que usan index.html, menu.html y el PDF (herramientas/generar-impreso.py).
   Formato: JSON dentro de window.CONFIG; las líneas que empiezan con // son comentarios.
   Lo que quede vacío ("" , null o []) no se muestra en la página. */
window.CONFIG = {
 "nombre": "Bar Maracaibo",
 "sitio": "https://bar-maracaibo.github.io/maracaibo/",
 "whatsapp": "50660821465",
 "telefono": "6082-1465",
 "direccion": "San Lorenzo, San José, Costa Rica",
 "codigoUbicacion": "2V53+FCP",
 "geo": {"lat": 10.0087064, "lng": -84.1464181},
 "mapa": "https://maps.app.goo.gl/iqMi91LyRhNMNFzu8",
 // Horas de 0 a 24, en hora de Costa Rica. 11 y 24 = de 11 a.m. a medianoche.
 "horario": {"abre": 11, "cierra": 24},
 // TODO-DUEÑO: confirmar si los precios incluyen IVA y si se cobra el 10 % de servicio; entonces agregarlo aquí
 // (por ejemplo "Precios en colones · incluyen IVA").
 "notaPrecios": "Precios en colones",
 // TODO-DUEÑO: no tienen Instagram por ahora; al abrirlo, poner el enlace aquí y aparece solo.
 "instagram": "",
 "facebook": "https://www.facebook.com/barmaracaibocr",
 // Nombre de la página tal como aparece en redes (se muestra en el pie junto al enlace).
 "facebookNombre": "Maracaibo's Bar",
 // TODO-DUEÑO: calificación de Google, por ejemplo {"valor": 4.6, "resenas": 120, "url": "https://..."}.
 "googleRating": null,
 // TODO-DUEÑO: enlace de la hoja de Google con las pestañas "carta" y "partidos" (ver LEEME.txt).
 "sheetUrl": "",
 // Carrusel «Nuestras cervezas» (portada y carta): logos de img/marcas/, en este orden. [] = no aparece.
 // Confirmado 2026-10-18: las mismas que La Gallera.
 "cervezas": ["imperial","pilsen","bavaria","heineken","corona","sol","coors"],
 // TODO-DUEÑO: partidos que se van a pasar, por ejemplo
 // {"fecha": "2026-10-25", "hora": "19:00", "equipos": "Saprissa vs. Alajuelense", "torneo": "Primera División"}
 "partidos": []
};
