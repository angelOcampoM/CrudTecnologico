(() => {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let w = 0, h = 0, dpr = 1;
  function resize(){
    dpr = window.devicePixelRatio || 1;
    w = window.innerWidth; h = window.innerHeight;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
  }
  window.addEventListener('resize', resize);
  resize();

  // Pellets grid
  const pellets = [];
  function buildPellets(){
    pellets.length = 0;
    const gap = 36;
    const margin = 24;
    for(let y = margin; y < h - margin; y += gap){
      for(let x = margin; x < w - margin; x += gap){
        pellets.push({x, y, r: 3, eaten: false});
      }
    }
  }
  buildPellets();

  // Pac‑Man
  const pac = {x: w*0.2, y: h*0.5, speed: 3.2, angle:0, mouth:0, mouthDir:1};
  const target = {x: pac.x, y: pac.y};

  // Ghosts
  const ghostColors = ['#ff6b6b','#6be3ff','#ffd86b'];
  const ghosts = [];
  for(let i=0;i<3;i++){
    ghosts.push({x: w*(0.6 + i*0.08), y: h*(0.4 + (i-1)*0.08), vx: (Math.random()*2-1)*1.2, vy:(Math.random()*2-1)*1.2, color: ghostColors[i]});
  }

  // Mouse interaction (canvas is pointer-events:none, so listen on window)
  window.addEventListener('mousemove', (e)=>{ target.x = e.clientX; target.y = e.clientY; });
  window.addEventListener('touchmove', (e)=>{ if(e.touches && e.touches[0]){ target.x = e.touches[0].clientX; target.y = e.touches[0].clientY; } }, {passive:true});

  function drawPellets(){
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    for(const p of pellets){
      if (p.eaten) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fill();
    }
  }

  function drawPac(){
    const dx = target.x - pac.x;
    const dy = target.y - pac.y;
    pac.angle = Math.atan2(dy, dx);
    // mouth animation
    pac.mouth += 0.18 * pac.mouthDir;
    if(pac.mouth > 0.9 || pac.mouth < 0.05) pac.mouthDir *= -1;

    const r = 20;
    ctx.fillStyle = '#ffd400';
    ctx.beginPath();
    const mouthAngle = 0.25 * pac.mouth;
    ctx.moveTo(pac.x, pac.y);
    ctx.arc(pac.x, pac.y, r, pac.angle + mouthAngle, pac.angle + Math.PI*2 - mouthAngle);
    ctx.closePath();
    ctx.fill();
  }

  function update(delta){
    // move pac toward target
    const dx = target.x - pac.x;
    const dy = target.y - pac.y;
    const dist = Math.hypot(dx,dy) || 1;
    const move = Math.min(pac.speed, dist);
    pac.x += (dx/dist) * move * 0.9;
    pac.y += (dy/dist) * move * 0.9;

    // eat pellets
    for(const p of pellets){
      if(p.eaten) continue;
      const d = Math.hypot(p.x - pac.x, p.y - pac.y);
      if(d < 22){ p.eaten = true; }
    }

    // update ghosts
    for(const g of ghosts){
      g.x += g.vx;
      g.y += g.vy;
      if(g.x < 18 || g.x > w-18) g.vx *= -1;
      if(g.y < 18 || g.y > h-18) g.vy *= -1;
      // slight random steering
      if(Math.random() < 0.01){ g.vx += (Math.random()-0.5)*0.8; g.vy += (Math.random()-0.5)*0.8; }
      g.vx = Math.max(Math.min(g.vx,2.2),-2.2);
      g.vy = Math.max(Math.min(g.vy,2.2),-2.2);
    }
  }

  function drawGhost(g){
    const gw = 28, gh = 24;
    ctx.save();
    ctx.translate(g.x, g.y);
    // body
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.arc(0, -2, gw/2, Math.PI, 0, false);
    ctx.lineTo(gw/2, gh/2);
    // scallops
    const scallop = 4;
    for(let i=0;i<3;i++){
      const cx = gw/2 - (i+1)* (gw/4);
      ctx.quadraticCurveTo(cx, gh/2 - scallop -2, cx - gw/6, gh/2);
    }
    ctx.lineTo(-gw/2, gh/2);
    ctx.closePath();
    ctx.fill();
    // eyes
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-6, -2, 4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -2, 4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-5, -1, 1.8,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, -1, 1.8,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  let last = performance.now();
  function loop(t){
    const dt = t - last; last = t;
    update(dt);

    ctx.clearRect(0,0,w,h);
    // subtle background glow
    const grd = ctx.createLinearGradient(0,0,w,h);
    grd.addColorStop(0,'rgba(0,0,0,0.75)');
    grd.addColorStop(1,'rgba(10,10,30,0.75)');
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,w,h);

    drawPellets();
    drawPac();
    for(const g of ghosts) drawGhost(g);

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // Rebuild pellets when viewport changes size substantially
  let rebuildTimeout = null;
  window.addEventListener('resize', ()=>{
    clearTimeout(rebuildTimeout);
    rebuildTimeout = setTimeout(()=>{ buildPellets(); }, 200);
  });

})();

// --- CRUD UI (LocalStorage) ---
document.addEventListener('DOMContentLoaded', ()=>{
  const STORAGE_KEY = 'productos_v1';

  const form = document.getElementById('product-form');
  const tbody = document.querySelector('#products-table tbody');
  const idInput = document.getElementById('product-id');
  const nameInput = document.getElementById('product-name');
  const descInput = document.getElementById('product-desc');
  const priceInput = document.getElementById('product-price');
  const catInput = document.getElementById('product-cat');
  const saveBtn = document.getElementById('save-btn');
  const cancelBtn = document.getElementById('cancel-btn');

  function getProducts(){
    try{ return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }catch(e){ return []; }
  }
  function saveProducts(list){ localStorage.setItem(STORAGE_KEY, JSON.stringify(list)); }

  function render(){
    const list = getProducts();
    tbody.innerHTML = '';
    if(list.length === 0){
      const tr = document.createElement('tr');
      tr.innerHTML = '<td colspan="5" style="opacity:.7">No hay productos registrados.</td>';
      tbody.appendChild(tr);
      return;
    }
    for(const p of list){
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${escapeHtml(p.name)}</td>
        <td>${escapeHtml(p.desc)}</td>
        <td>$${Number(p.price).toFixed(2)}</td>
        <td>${escapeHtml(p.cat)}</td>
        <td>
          <button class="btn-small" data-action="edit" data-id="${p.id}">Editar</button>
          <button class="btn-small btn-danger" data-action="delete" data-id="${p.id}">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);
    }
  }

  function resetForm(){
    idInput.value = '';
    form.reset();
    saveBtn.textContent = 'Guardar';
  }

  function escapeHtml(str){ return String(str).replace(/[&<>"]/g, s=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;"}[s])); }

  form.addEventListener('submit', (e)=>{
    e.preventDefault();
    const id = idInput.value.trim();
    const name = nameInput.value.trim();
    const desc = descInput.value.trim();
    const price = parseFloat(priceInput.value) || 0;
    const cat = catInput.value.trim();
    if(!name || !desc || !cat){ 
      Swal.fire({
        icon: 'warning',
        title: 'Campo incompleto',
        text: 'Completa todos los campos.',
        confirmButtonText: 'Ok'
      });
      return; 
    }

    const list = getProducts();
    if(id){
      // update
      const idx = list.findIndex(x=>String(x.id) === String(id));
      if(idx !== -1){ list[idx] = { ...list[idx], name, desc, price, cat }; }
      saveProducts(list);
      render();
      resetForm();
      Swal.fire({
        icon: 'success',
        title: 'Éxito',
        text: 'Producto actualizado correctamente.',
        timer: 1500,
        showConfirmButton: false
      });
    } else {
      // create
      const newItem = { id: Date.now().toString(36), name, desc, price, cat };
      list.push(newItem);
      saveProducts(list);
      render();
      resetForm();
      Swal.fire({
        icon: 'success',
        title: '¡Producto agregado!',
        text: 'El producto se ha agregado correctamente.',
        timer: 1500,
        showConfirmButton: false
      });
    }
  });

  cancelBtn.addEventListener('click', (e)=>{ e.preventDefault(); resetForm(); });

  tbody.addEventListener('click', (e)=>{
    const btn = e.target.closest('button');
    if(!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if(action === 'edit'){
      const list = getProducts();
      const item = list.find(x=>String(x.id) === String(id));
      if(!item) return; idInput.value = item.id; nameInput.value = item.name; descInput.value = item.desc; priceInput.value = item.price; catInput.value = item.cat; saveBtn.textContent = 'Actualizar';
      window.scrollTo({top:0,behavior:'smooth'});
    } else if(action === 'delete'){
      Swal.fire({
        icon: 'warning',
        title: '¿Eliminar producto?',
        text: 'Esta acción no se puede deshacer.',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result)=>{
        if(result.isConfirmed){
          let list = getProducts();
          list = list.filter(x=>String(x.id) !== String(id));
          saveProducts(list);
          render();
          Swal.fire({
            icon: 'success',
            title: 'Eliminado',
            text: 'El producto ha sido eliminado.',
            timer: 1500,
            showConfirmButton: false
          });
        }
      });
    }
  });

  // initial render
  render();
});

