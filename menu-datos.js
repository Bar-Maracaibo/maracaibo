/* Fuente única de la carta: la usan index.html, menu.html y herramientas/generar-menu.py (el PDF).
   Datos: la carta de La Gallera (confirmada por la dueña como la misma de Maracaibo) más los taquitos mexicanos.
   Formato: JSON dentro de window.MENU; las líneas que empiezan con // son comentarios (el generador del PDF las ignora).

   Cada apartado: id, label (pestaña), title, img (foto del apartado; "" = sin foto), note (opcional), items.
   Cada plato:
     n      nombre
     d      descripción breve
     p      precio en colones (null = «Consultar»); o bien
     sizes  [{"l": "Pequeño", "p": 2000}, {"l": "Grande", "p": 3500}] cuando hay tamaños o variantes
     g      subgrupo dentro del apartado (en Bebidas: «Cervezas nacionales», etc.)
     tags   "popular" (Lo más pedido) y/o "compartir"
     promo  {"n": 6, "p": 6500} = 6 por ₡6.500 (opcional)
     review true = descripción escrita sin el dueño; quitar cuando la confirme
   Si config.js tiene sheetUrl, los precios pueden venir de la hoja de Google (ver LEEME.txt). */
window.MENU = [
 {
  "id": "gustitos",
  "label": "Gustitos",
  "title": "Gustitos",
  "img": "chifrijo.jpg",
  "note": "Para picar con la primera fría.",
  "items": [
   // TODO-DUEÑO: confirmar todas las descripciones marcadas con "review": true.
   {"n": "Papas a la francesa", "d": "Papas fritas en bastones", "p": 2500, "review": true},
   {"n": "Papa nacho", "d": "Papas con queso al estilo nacho", "sizes": [{"l": "Carne o pollo", "p": 4000}, {"l": "Mixta", "p": 4500}], "tags": ["compartir"], "review": true},
   {"n": "Quesadilla", "d": "Tortilla de harina con queso", "sizes": [{"l": "Carne o pollo", "p": 3500}, {"l": "Mixta", "p": 4000}], "review": true},
   {"n": "Nachos", "d": "Totopos con queso y carne", "sizes": [{"l": "Carne o pollo", "p": 3500}, {"l": "Mixtos", "p": 4000}], "tags": ["compartir"], "review": true},
   {"n": "Puntas de lomo", "d": "Trocitos de lomo para picar", "p": 2000, "review": true},
   {"n": "Dados de queso", "d": "Queso frito en dados", "p": 2500, "review": true},
   {"n": "Palitos de queso", "d": "Palitos de queso fritos", "p": 3000, "review": true},
   {"n": "Torta de huevo", "d": "Torta de huevo de la casa", "p": 3000, "review": true},
   {"n": "Gallo de chorizo", "d": "Tortilla con chorizo", "p": 2000, "review": true},
   {"n": "Chifrijolito", "d": "Chifrijo en porción pequeña", "p": 2000, "review": true},
   {"n": "Ensalada verde", "d": "Ensalada de hojas verdes", "p": 2000, "review": true}
  ]
 },
 {
  "id": "boquitas",
  "label": "Boquitas",
  "title": "Boquitas",
  "img": "patacones_frijol.jpg",
  "note": "Porciones chicas para acompañar la ronda.",
  "items": [
   {"n": "Cazuela de frijol", "d": "Frijoles servidos en cazuela", "p": 1500, "review": true},
   {"n": "Chorizo colombiano con arepa", "d": "Porción de chorizo con arepa", "p": 1500, "review": true},
   {"n": "Mini nuggets", "d": "De pollo o de pescado", "p": 1500},
   {"n": "Mini nachos", "d": "De pollo o de carne", "p": 1500},
   {"n": "Palitos de queso", "d": "3 unidades", "p": 1500},
   {"n": "Patacones con frijol", "d": "Plátano verde frito con frijoles", "p": 1500, "review": true}
  ]
 },
 {
  "id": "almuerzos",
  "label": "Almuerzos",
  "title": "Almuerzos",
  // TODO-DUEÑO: no hay foto propia de un casado. La Gallera tiene una del mismo plato; se puede usar si la dueña lo aprueba.
  "img": "",
  "items": [
   {"n": "Casado", "d": "Arroz, frijoles, ensalada y proteína", "sizes": [{"l": "Pequeño", "p": 2500}, {"l": "Pequeño con refresco", "p": 3500}, {"l": "Grande", "p": 3500}, {"l": "Grande con refresco", "p": 4500}], "review": true},
   {"n": "Bandeja paisa", "d": "Plato colombiano completo", "p": 7000, "review": true}
  ]
 },
 {
  "id": "arroces",
  "label": "Arroces",
  "title": "Arroces",
  "img": "arroz_camarones.jpg",
  "items": [
   // TODO-DUEÑO: ¿en Maracaibo también se llama «Arroz Gallera»?
   {"n": "Arroz Gallera", "d": "La receta de la casa", "p": 4500, "review": true},
   {"n": "Arroz con pollo", "d": "El clásico arroz con pollo", "p": 4000, "review": true},
   {"n": "Arroz a la marinera", "d": "Arroz con mariscos", "p": 4500, "review": true},
   {"n": "Arroz con carne de cerdo", "d": "Arroz salteado con cerdo", "p": 4000, "review": true},
   {"n": "Arroz con carne de res", "d": "Arroz salteado con res", "p": 4000, "review": true},
   {"n": "Arroz con camarones", "d": "Arroz salteado con camarones", "p": 4500, "review": true}
  ]
 },
 {
  "id": "fuertes",
  "label": "Platos fuertes",
  "title": "Platos fuertes",
  "img": "impreso_fajitas.jpg",
  "items": [
   // TODO-DUEÑO: precio y descripción de los taquitos mexicanos. Jenni dijo que van como «gustito»: si es así, moverlos a Gustitos.
   {"n": "Taquitos mexicanos", "p": null},
   {"n": "Empanadas colombianas", "d": "Empanadas de maíz fritas", "sizes": [{"l": "5 unidades", "p": 5000}, {"l": "10 unidades", "p": 10000}], "tags": ["compartir"], "review": true},
   {"n": "Chifrijo", "d": "Arroz, frijoles, chicharrón y pico de gallo", "p": 4000, "review": true},
   {"n": "Fajitas", "d": "Tiras salteadas con chile y cebolla", "sizes": [{"l": "Carne o pollo", "p": 3500}, {"l": "Mixtas", "p": 4000}], "tags": ["popular"], "review": true},
   {"n": "Hamburguesa de carne o pollo", "d": "Con papas a la francesa", "p": 3500, "review": true},
   {"n": "Nachos de carne o pollo", "d": "Totopos con queso y carne", "p": 3500, "review": true},
   {"n": "Patacones", "d": "Plátano verde frito", "p": 3000, "review": true},
   {"n": "Canasta de patacones", "d": "Canastas de plátano verde frito", "p": 2000, "tags": ["compartir"], "review": true},
   {"n": "Ravioles", "d": "Ravioles en salsa", "p": 3000, "review": true},
   {"n": "Tacos", "d": "Tortilla rellena y frita", "p": 3500, "review": true},
   {"n": "Yuca frita", "d": "Yuca frita en bastones", "p": 2500, "review": true}
  ]
 },
 {
  "id": "sopas",
  "label": "Sopas",
  "title": "Sopas",
  "img": "sopa_pollo.jpg",
  "items": [
   {"n": "Sopa de carne", "d": "Caldo de res con verduras", "p": 3000, "review": true},
   {"n": "Sopa de pollo", "d": "Caldo de pollo con verduras", "p": 3000, "review": true},
   {"n": "Sopa azteca", "d": "Caldo de tomate con tortilla", "p": 4500, "review": true},
   {"n": "Sopa de mariscos", "d": "Caldo con mariscos variados", "sizes": [{"l": "En agua", "p": 4000}, {"l": "En leche", "p": 4500}], "review": true},
   {"n": "Sopa negra", "d": "Caldo de frijol negro con huevo", "p": 3000, "review": true},
   {"n": "Sustancia en vaso", "d": "Caldo de res servido en vaso", "p": 2000, "review": true}
  ]
 },
 {
  "id": "pollo",
  "label": "Pollo",
  "title": "Pollo",
  "img": "fb_alitas.jpg",
  "items": [
   {"n": "Alitas", "d": "Con la salsa que elijás", "sizes": [{"l": "6 unidades", "p": 4000}, {"l": "12 unidades", "p": 8000}], "tags": ["popular", "compartir"], "review": true},
   {"n": "Nuggets", "d": "Trocitos de pollo empanizados", "p": 3500, "review": true},
   {"n": "Pechuga", "d": "Pechuga de pollo a la plancha", "p": 3500, "review": true}
  ]
 },
 {
  "id": "mariscos",
  "label": "Mariscos",
  "title": "Mariscos",
  "img": "ceviche.jpg",
  "items": [
   {"n": "Mariscada", "d": "Mariscos variados salteados", "p": 4500, "review": true},
   {"n": "Ceviche", "d": "Pescado curado en limón", "sizes": [{"l": "Pequeño", "p": 2000}, {"l": "Grande", "p": 3500}], "tags": ["popular"], "review": true},
   {"n": "Ceviche mixto", "d": "Pescado y mariscos en limón", "sizes": [{"l": "Pequeño", "p": 3000}, {"l": "Grande", "p": 5000}], "review": true},
   {"n": "Ceviche salpicón", "d": "Ceviche finamente picado", "sizes": [{"l": "Pequeño", "p": 3500}, {"l": "Grande", "p": 5000}], "review": true},
   {"n": "Camarones", "d": "Plato de camarones", "p": 5000, "review": true},
   {"n": "Filete de pescado", "d": "Filete de pescado al gusto", "p": 4000, "review": true},
   {"n": "Torta de huevo con camarón", "d": "Torta de huevo con camarones", "p": 5000, "review": true},
   {"n": "Nuggets de pescado", "d": "Trocitos de pescado empanizados", "p": 3500, "review": true},
   {"n": "Espagueti en salsa blanca con camarón", "d": "Pasta cremosa con camarones", "p": 6000, "review": true}
  ]
 },
 {
  "id": "carnes",
  "label": "Carnes",
  "title": "Carnes",
  "img": "bistec_encebollado.jpg",
  "items": [
   {"n": "Carne mexicana", "d": "Carne de res al estilo mexicano", "sizes": [{"l": "Pequeña", "p": 2000}, {"l": "Regular", "p": 3500}], "review": true},
   {"n": "Bistec encebollado", "d": "Bistec de res con cebolla", "p": 3500, "review": true},
   {"n": "Hígado encebollado", "d": "Hígado de res con cebolla", "p": 3500, "review": true},
   {"n": "Chalupa", "d": "Tortilla tostada con frijoles y carne", "sizes": [{"l": "Carne o pollo", "p": 3500}, {"l": "Mixta", "p": 4000}], "review": true},
   {"n": "Burrito", "d": "Tortilla de harina rellena", "sizes": [{"l": "Carne o pollo", "p": 3500}, {"l": "Mixto", "p": 4000}], "review": true},
   {"n": "Surtido", "d": "Variedad de carnes para la mesa", "sizes": [{"l": "2 personas", "p": 8000}, {"l": "4 personas", "p": 16000}], "tags": ["compartir"], "review": true}
  ]
 },
 {
  "id": "cortes",
  "label": "Cortes",
  "title": "Cortes",
  "img": "chicharrones_reales.jpg",
  "items": [
   {"n": "Churrasco", "d": "Corte de res a la parrilla", "p": 8000, "review": true},
   {"n": "Lomito", "d": "Corte de lomo a la parrilla", "p": 8000, "review": true},
   {"n": "Cordon bleu", "d": "Empanizado, relleno de jamón y queso", "sizes": [{"l": "De carne", "p": 6000}, {"l": "De pollo", "p": 6000}], "review": true},
   {"n": "Chicharrones", "d": "Chicharrón con yuca y limón", "p": 4000, "tags": ["popular", "compartir"], "review": true},
   {"n": "Mini boca de chicharrón", "d": "Porción pequeña de chicharrón", "p": 2000, "review": true},
   {"n": "Costilla de cerdo", "d": "Costilla de cerdo a la parrilla", "p": 4000, "review": true}
  ]
 },
 {
  "id": "bebidas",
  "label": "Bebidas",
  "title": "Bebidas",
  "img": "imperial_real.jpg",
  "items": [
   // TODO-DUEÑO: el chiliguaro (₡800 o 2 por ₡1.500) no está en la carta de La Gallera. Si sigue en Maracaibo, agregarlo aquí:
   // {"n": "Chiliguaro", "g": "Cócteles preparados", "d": "Guaro con tomate y picante", "p": 800, "promo": {"n": 2, "p": 1500}},
   {"n": "Smirnoff", "g": "Cócteles preparados", "d": "Red, Green, Black, Guaraná o Smash Mango · 350 ml", "p": 1800},
   {"n": "Adán y Eva", "g": "Cócteles preparados", "d": "Moscow Mule o Frutos Rojos · 350 ml", "p": 1500},
   {"n": "Bamboo", "g": "Cócteles preparados", "d": "Daiquirí · 350 ml", "p": 1500},
   {"n": "Cuba libre", "g": "Cócteles preparados", "d": "350 ml", "p": 1800},
   {"n": "Imperial", "g": "Cervezas nacionales", "d": "Original, Silver, Light, Ultra o Cero · 350 ml", "p": 1300, "tags": ["popular"]},
   {"n": "Pilsen", "g": "Cervezas nacionales", "d": "Original o 6.0 · 350 ml", "p": 1300},
   {"n": "Bavaria", "g": "Cervezas premium", "d": "Master, Light o Gold · 350 ml", "p": 1500},
   {"n": "Heineken", "g": "Cervezas premium", "d": "Original o 0.0 · 350 ml", "p": 1500},
   {"n": "Coors Light", "g": "Cervezas premium", "d": "350 ml", "p": 1500},
   {"n": "Sol", "g": "Cervezas premium", "d": "Original, Light, Silver, Ultra o Cero · 350 ml", "p": 1500},
   {"n": "Corona", "g": "Cervezas premium", "d": "350 ml", "p": 1500},
   {"n": "Pepsi", "g": "Refrescos", "d": "Original o Zero · 350 ml", "p": 1200},
   {"n": "Coca-Cola", "g": "Refrescos", "d": "Original · 355 ml", "p": 1200},
   {"n": "Fanta", "g": "Refrescos", "d": "Uva, Piña o Naranja · 355 ml", "p": 1200},
   {"n": "Fresca", "g": "Refrescos", "d": "Naranja · 355 ml", "p": 1200},
   {"n": "7UP", "g": "Refrescos", "d": "355 ml", "p": 1200},
   {"n": "Evervess", "g": "Refrescos", "d": "Gin o Soda · 355 ml", "p": 1200},
   {"n": "Tropical", "g": "Refrescos", "d": "Arándanos, Frutas Tropicales o Té Melocotón · 355 ml", "p": 1100},
   {"n": "Maxxx Energy", "g": "Refrescos", "d": "Guaraná · 355 ml", "p": 1900},
   {"n": "Agua Cristal", "g": "Refrescos", "d": "600 ml", "p": 1100},
   {"n": "Maximalta", "g": "Refrescos", "d": "Bebida de malta", "p": 1300, "review": true},
   {"n": "Vitaloe", "g": "Refrescos", "d": "500 ml", "p": 1900},
   {"n": "Jugo de tomate", "g": "Refrescos", "d": "Bien frío", "p": 1100, "review": true}
  ]
 },
 {
  "id": "especiales",
  "label": "Especiales",
  "title": "Especiales de la casa",
  // TODO-DUEÑO: sin foto propia; se puede usar la de La Gallera del baldazo si la dueña lo aprueba.
  "img": "",
  "items": [
   {"n": "Baldazo para compartir", "d": "6 Imperial por el precio de 5", "p": 7000, "tags": ["compartir"]},
   {"n": "Tropical + casado", "d": "El combo que nunca falla", "p": 4500},
   {"n": "Pepsi + hamburguesa de carne o pollo", "d": "Los mejores sabores", "p": 4500},
   {"n": "Copa de vino de la casa", "d": "Vino de la casa por copa", "p": 3500, "review": true},
   {"n": "Copa de sangría de la casa", "d": "Sangría de la casa por copa", "p": 3500, "review": true},
   {"n": "Trago de la casa", "d": "Consultá con el salonero", "p": 1100, "review": true}
  ]
 }
];
