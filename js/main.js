/* ================================================
   BRUMA ESTUDIO — main.js
   Lee productos.json y renderiza el catálogo
   ================================================ */

/* ---- CARGAR DATOS ----------------------------- */
async function cargarProductos() {
  try {
    const res = await fetch('datos/productos.json');
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error cargando productos.json:', err);
    return null;
  }
}

/* ---- FORMATEAR PRECIO ------------------------- */
function formatPrecio(num) {
  return '$' + num.toLocaleString('es-CL');
}

/* ---- SVG PLACEHOLDER (mientras no hay archivo svg real) */
function svgPlaceholder(producto) {
  const colores = {
    sagrada:      { bg: '#F5EDE0', c1: '#A8C2D8', c2: '#D8EEF8', skin: '#F2DCC8' },
    botanica:     { bg: '#EDF5E5', c1: '#72A860', c2: '#82B870', skin: '#D0A878' },
    infantil:     { bg: '#EAE5F5', c1: '#FFF5D8', c2: '#EEDCB8', skin: '#F8E860' },
    personalizado:{ bg: '#F5EEE8', c1: '#E8B8A8', c2: '#B8C8D8', skin: '#C8D8B8' }
  };
  const c = colores[producto.coleccion] || colores.botanica;
  return `
    <svg viewBox="0 0 300 375" xmlns="http://www.w3.org/2000/svg">
      <rect width="300" height="375" fill="${c.bg}"/>
      <ellipse cx="150" cy="180" rx="130" ry="150" fill="${c.c1}" fill-opacity=".3"/>
      <ellipse cx="100" cy="120" rx="80" ry="90" fill="${c.c2}" fill-opacity=".4"/>
      <ellipse cx="200" cy="260" rx="70" ry="80" fill="${c.skin}" fill-opacity=".35"/>
      <text x="150" y="195" text-anchor="middle"
        font-family="Georgia,serif" font-size="13"
        fill="${c.c1}" fill-opacity=".6" font-style="italic">${producto.nombre}</text>
    </svg>`;
}

/* ---- RENDERIZAR GRILLA DE PRODUCTOS ----------- */
function renderProductos(productos) {
  const contenedor = document.getElementById('grilla-productos');
  if (!contenedor) return;

  // Filtra solo los destacados para el home, o todos si hay un flag
  const mostrar = productos.filter(p => p.disponible);

  contenedor.innerHTML = mostrar.map(p => `
    <div class="pc" data-id="${p.id}">
      <div class="part" style="aspect-ratio:4/5;">
        ${p.ilustracion_svg
          ? `<img src="${p.ilustracion_svg}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover;display:block;"
               onerror="this.outerHTML='${svgPlaceholder(p).replace(/'/g, "&#39;")}'"/>`
          : svgPlaceholder(p)
        }
        <div class="pframe"></div>
        <div class="pov">
          <a href="#cfg" class="povb" onclick="seleccionarProducto('${p.id}')">Ver opciones</a>
        </div>
      </div>
      <p class="pn">${p.nombre}</p>
      <div class="pm">
        <span class="pp">${formatPrecio(p.precio)}</span>
        <span class="pct">${p.etiquetas[0]}${p.personalizable ? ' · Personalizado' : ''}</span>
      </div>
    </div>
  `).join('');
}

/* ---- CONFIGURADOR ----------------------------- */
let estadoConfig = {
  precioBase: 28000,
  tamanio: 0,
  formato: 0,
  papel: 0,
  personalizacion: 0
};

function initConfigurador(config) {
  estadoConfig.precioBase = config.precio_base;

  renderChips('chips-tamanio',  config.tamanios,       'tamanio');
  renderChips('chips-formato',  config.formatos,        'formato');
  renderChips('chips-papel',    config.papeles,         'papel');
  renderChips('chips-pers',     config.personalizacion, 'personalizacion');

  actualizarTotal();
}

function renderChips(contenedorId, items, campo) {
  const el = document.getElementById(contenedorId);
  if (!el) return;

  el.innerHTML = items.map((item, i) => `
    <button
      class="chip ${i === 0 ? 'active' : ''}"
      data-extra="${item.extra}"
      data-campo="${campo}"
      ${item.border_color ? `data-bc="${item.border_color}" data-bw="${item.border_width}"` : ''}
      onclick="seleccionarChip(this, '${campo}')">
      ${item.label}
    </button>
  `).join('');
}

function seleccionarChip(el, campo) {
  // Desactivar hermanos
  el.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');

  estadoConfig[campo] = parseInt(el.dataset.extra) || 0;
  actualizarTotal();

  // Si es formato, actualizar marco visual
  if (campo === 'formato' && el.dataset.bc) {
    const marco = document.getElementById('marco-preview');
    if (marco) {
      marco.style.borderColor = el.dataset.bc;
      marco.style.borderWidth = el.dataset.bw + 'px';
    }
  }
}

function actualizarTotal() {
  const total = estadoConfig.precioBase
    + estadoConfig.tamanio
    + estadoConfig.formato
    + estadoConfig.papel
    + estadoConfig.personalizacion;

  const el = document.getElementById('total-precio');
  if (el) el.textContent = formatPrecio(total);
}

function seleccionarProducto(id) {
  // Cuando tengamos múltiples productos, esto pre-seleccionará el correcto
  console.log('Producto seleccionado:', id);
}

/* ---- NEWSLETTER ------------------------------- */
function suscribir(e) {
  if (e) e.preventDefault();
  const input = document.getElementById('nl-email');
  if (!input || !input.value) return;
  // Aquí conectarás Mailchimp, Klaviyo, etc.
  alert('¡Gracias! Te avisaremos con cada novedad.');
  input.value = '';
}

/* ---- CARRITO (base para el futuro) ------------ */
let carrito = JSON.parse(localStorage.getItem('bruma_carrito') || '[]');

function agregarAlCarrito() {
  const activos = document.querySelectorAll('.chip.active');
  const item = { timestamp: Date.now() };
  activos.forEach(chip => {
    item[chip.dataset.campo] = chip.textContent.trim();
  });
  item.precio = parseInt(document.getElementById('total-precio').textContent.replace(/\D/g,''));
  carrito.push(item);
  localStorage.setItem('bruma_carrito', JSON.stringify(carrito));
  alert('¡Perfecto! Escríbenos por WhatsApp para confirmar tu pedido 🌿\nhttps://wa.me/56912345678');
}

/* ---- INIT GENERAL ----------------------------- */
document.addEventListener('DOMContentLoaded', async () => {
  const data = await cargarProductos();
  if (!data) return;

  renderProductos(data.productos);
  initConfigurador(data.configurador);
});
