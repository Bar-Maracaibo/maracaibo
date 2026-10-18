/* Fuente única de la carta de Bar Maracaibo (index.html, menu.html, herramientas/generar-menu.py y generar-seo.py).
   Transcrita de la carta física del bar (fotos del 18-10-2026) + cambios indicados por la dueña.
   Formato: JSON dentro de window.MENU; las líneas que empiezan con // son comentarios (los generadores las ignoran).
   Cada apartado: id, label (pestaña), title, img (foto; sin img = sin foto), note (opcional), items.
     El apartado "adicionales" no es un apartado con foto: se muestra como una nota al final de la carta (web y PDF).
   Formato por plato:
     n  nombre · p  precio en colones (si hay tamaños, p = el menor) · d  descripción opcional
     sizes  [{l: etiqueta, p: precio}] cuando el plato tiene tamaños o cantidades (se muestran en una sola línea)
     verificar: true  → precio poco legible o dudoso en la foto; confirmar con la dueña (TODO-DUEÑO). No se muestra en la página.
     p: null → precio pendiente; mostrar «Consultar» (no cuenta para «desde ₡X»)
     promo  {"n": 2, "p": 1500} = 2 por ₡1.500 (la ronda y Mi pedido la aplican solos)
     tags   ["popular"] (Lo más pedido) y/o ["compartir"]: TODO-DUEÑO, ninguno marcado hasta que la dueña diga cuáles. */
window.MENU = [
 {
  "id": "boquitas",
  "label": "Boquitas",
  "title": "Boquitas",
  "img": "patacones_frijol.jpg",
  "note": "Todas a ₡1.500 cada una.",
  "items": [
   { "n": "Cazuela de frijol", "p": 1500 },
   { "n": "Chorizo colombiano con arepa", "p": 1500 },
   { "n": "Mini nuggets", "d": "De pescado o de pollo", "p": 1500 },
   { "n": "Mini nachos", "d": "De carne o de pollo", "p": 1500 },
   { "n": "Palitos de queso", "d": "3 unidades", "p": 1500 },
   { "n": "Patacones con frijoles molidos", "p": 1500 },
   { "n": "Puntas de lomo", "p": 1500 }
  ]
 },
 {
  "id": "gusticos",
  "label": "Super gusticos",
  "title": "Super gusticos",
  "img": "surtida_real.jpg",
  "note": "Para picar entre amigos.",
  "items": [
   { "n": "Nachos de carne o pollo", "p": 3500 },
   { "n": "Nachos mixtos", "p": 4000 },
   { "n": "Papa nacho de carne o pollo", "p": 4000 },
   { "n": "Papa nacho mixto", "p": 4500 },
   { "n": "Papas a la francesa", "p": 2500 },
   { "n": "Quesadilla de carne o pollo", "p": 3500 },
   { "n": "Quesadilla mixta", "p": 4000 },
   { "n": "Gallo de chorizo", "p": 2000 },
   { "n": "Dados de queso", "d": "6 unidades", "p": 2500 },
   { "n": "Palitos de queso", "p": 3000 },
   { "n": "Ensalada", "p": 2000 },
   { "n": "Taquitos mexicanos", "p": 2000 },
// TODO-DUEÑO: confirmar el precio de la torta de huevo (₡1.000 se lee mal en la foto).
   { "n": "Torta de huevo", "p": 1000, "verificar": true }
  ]
 },
 {
  "id": "fuertes",
  "label": "Platos fuertes",
  "title": "Platos fuertes",
  "img": "chifrijo.jpg",
  "items": [
   { "n": "Empanadas colombianas", "p": 5000, "sizes": [ { "l": "5 unid.", "p": 5000 }, { "l": "10 unid.", "p": 10000 } ] },
   { "n": "Chifrijo", "p": 4000 },
// TODO-DUEÑO: confirmar los precios del chifrijolito (₡2.000) y de las fajitas de carne o pollo (₡3.500).
   { "n": "Chifrijolito", "p": 2000, "verificar": true },
   { "n": "Fajitas de carne o pollo", "p": 3500, "verificar": true },
   { "n": "Fajitas mixtas", "p": 4000 },
   { "n": "Frijoles tiernos", "p": 3000 },
   { "n": "Hamburguesa de carne o pollo", "p": 3500 },
   { "n": "Patacones", "p": 3000 },
   { "n": "Patacones con camarones y guacamole", "p": 5000 },
   { "n": "Canasta de patacones pequeña", "d": "3 unidades", "p": 2000 },
   { "n": "Ravioles", "p": 3000 },
   { "n": "Tacos", "p": 3500 },
   { "n": "Yuca frita", "p": 2500 }
  ]
 },
 {
  "id": "casados",
  "label": "Casados",
  "title": "Casados",
  "img": "bistec_encebollado.jpg",
  "note": "Los sabores de siempre.",
  "items": [
   { "n": "Casado", "p": 2500, "sizes": [ { "l": "Pequeño", "p": 2500 }, { "l": "Grande", "p": 3500 } ] },
// TODO-DUEÑO: precio de la bandeja paisa.
   { "n": "Bandeja paisa", "p": null }
  ]
 },
 {
  "id": "arroces",
  "label": "Arroces",
  "title": "Arroces",
  "img": "arroz_camarones.jpg",
  "items": [
   { "n": "Arroz Maracaibo", "p": 4500 },
   { "n": "Arroz con pollo", "p": 4000 },
   { "n": "Arroz con cerdo", "p": 4000 },
   { "n": "Arroz con carne de res", "p": 4000 },
   { "n": "Arroz a la marinera", "p": 4500 },
   { "n": "Arroz con camarones", "p": 4500 }
  ]
 },
 {
  "id": "sopas",
  "label": "Sopas",
  "title": "Sopas",
  "img": "sopa_pollo.jpg",
  "items": [
   { "n": "Sopa negra", "p": 3000 },
   { "n": "Sopa de pollo", "p": 3000 },
   { "n": "Sopa de carne", "p": 3000 },
   { "n": "Sopa azteca", "p": 3500 },
   { "n": "Sopa de mariscos en agua", "p": 4000 },
   { "n": "Sopa de mariscos en leche", "p": 4500 }
  ]
 },
 {
  "id": "pollo",
  "label": "Pollo",
  "title": "Pollo",
  "img": "fb_alitas.jpg",
  "items": [
   { "n": "Alitas", "p": 4000, "sizes": [ { "l": "6 unid.", "p": 4000 }, { "l": "12 unid.", "p": 8000 } ] },
   { "n": "Pechuga", "p": 3500 },
   { "n": "Nuggets", "p": 3500 }
  ]
 },
 {
  "id": "carne",
  "label": "Carne",
  "title": "Carne",
  "img": "impreso_fajitas.jpg",
  "items": [
   { "n": "Carne mexicana", "p": 2000, "sizes": [ { "l": "Pequeña", "p": 2000 }, { "l": "Grande", "p": 3500 } ] },
   { "n": "Bistec encebollado", "p": 3500 },
   { "n": "Hígado encebollado", "p": 3500 },
   { "n": "Chalupa de carne o pollo", "p": 3500 },
   { "n": "Chalupa mixta", "p": 4000 },
   { "n": "Burrito de carne o pollo", "p": 3500 },
   { "n": "Burrito mixto", "p": 4000 },
   { "n": "Surtido", "d": "Para compartir", "p": 8000, "sizes": [ { "l": "2 personas", "p": 8000 }, { "l": "4 personas", "p": 16000 } ] }
  ]
 },
 {
  "id": "cortes",
  "label": "Cortes de carne",
  "title": "Cortes de carne",
  "img": "chicharrones_reales.jpg",
  "items": [
   { "n": "Churrasco", "p": 8000 },
   { "n": "Lomito", "p": 8000 },
   { "n": "Cordon bleu", "d": "De carne o de pollo", "p": 7000 },
   { "n": "Chicharrones", "p": 4000 },
   { "n": "Mini boca de chicharrón", "p": 2000 },
   { "n": "Costilla de cerdo", "p": 4000 }
  ]
 },
 {
  "id": "mariscos",
  "label": "Mariscos",
  "title": "Mariscos",
  "img": "ceviche.jpg",
  "items": [
   { "n": "Mariscada", "p": 4500 },
   { "n": "Ceviche", "p": 2000, "sizes": [ { "l": "Pequeño", "p": 2000 }, { "l": "Grande", "p": 3500 } ] },
   { "n": "Ceviche mixto", "p": 3000, "sizes": [ { "l": "Pequeño", "p": 3000 }, { "l": "Grande", "p": 5000 } ] },
   { "n": "Ceviche salpicón", "p": 3500, "sizes": [ { "l": "Pequeño", "p": 3500 }, { "l": "Grande", "p": 5000 } ] },
   { "n": "Camarones", "p": 5000 },
   { "n": "Filete de pescado", "p": 4000 },
   { "n": "Nuggets de pescado", "p": 3500 },
   { "n": "Torta de huevo con camarones", "p": 5000 },
   { "n": "Espagueti en salsa blanca con camarones", "p": 6000 }
  ]
 },
 {
  "id": "adicionales",
  "label": "Adicionales",
  "title": "Adicionales",
  "items": [
   { "n": "Adicional", "d": "Para cualquier plato", "p": 500 },
   { "n": "Adicional de guacamole", "p": 1000 }
  ]
 },
// TODO-DUEÑO: confirmar las bebidas y sus precios (la carta física no las trae: cerveza nacional ₡1.300 y chiliguaro ₡800, 2 por ₡1.500).
 {
  "id": "bebidas",
  "label": "Bebidas",
  "title": "Bebidas",
  "img": "imperial_real.jpg",
  "verificar": true,
  "items": [
   { "n": "Cerveza nacional", "d": "Consultar variedades disponibles", "p": 1300 },
   { "n": "Chiliguaro", "d": "Promoción: 2 por ₡1.500", "p": 800, "promo": { "n": 2, "p": 1500 } }
  ]
 }
];
