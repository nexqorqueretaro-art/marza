const API = window.APP_CONFIG?.API_URL || '';
let properties = [], adminProperties = [], sessionToken = sessionStorage.getItem('adminToken') || '';
let photoItems = []; // {kind:'existing'|'new', url?, file?, preview, key}
const $ = s => document.querySelector(s);
const esc = (v='') => String(v).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const money = (n,c='MXN') => new Intl.NumberFormat('es-MX',{style:'currency',currency:c,maximumFractionDigits:0}).format(Number(n)||0);
const cleanPhone = v => String(v||'').replace(/\D/g,'');

if(window.APP_CONFIG?.BRAND_NAME){ document.title=`${window.APP_CONFIG.BRAND_NAME} | Propiedades`; }
async function api(action,payload={}){if(!API||API.includes('PEGA_AQUI'))throw new Error('Configura API_URL en config.js');const r=await fetch(API,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,...payload})});const d=await r.json();if(!d.ok)throw new Error(d.error||'Error en el servidor');return d;}

async function loadProperties(){try{const d=await api('listPublic');properties=d.properties||[];renderProperties()}catch(e){$('#propertyGrid').innerHTML=`<p>${esc(e.message)}</p>`}}
function renderProperties(){
  const q=$('#search').value.toLowerCase(),type=$('#typeFilter').value,op=$('#operationFilter').value;
  const f=properties.filter(p=>(!type||p.type===type)&&(!op||p.operation===op)&&`${p.title} ${p.location} ${p.type} ${p.features?.join(' ')}`.toLowerCase().includes(q));
  $('#propertyGrid').innerHTML=f.map(p=>`<article class="property-card" data-id="${esc(p.id)}"><div class="card-image"><img loading="lazy" src="${esc((p.photos||[])[0]||'https://placehold.co/1200x800?text=Propiedad')}" alt="${esc(p.title)}"><span class="badge">${esc(p.operation==='renta'?'Renta':'Venta')}</span></div><div class="card-body"><p class="eyebrow">${esc(p.type||'Propiedad')}</p><h3>${esc(p.title)}</h3><p class="meta">${esc(p.location||'Ubicación por confirmar')}</p><div class="card-stats"><span>${Number(p.bedrooms)||0} rec.</span><span>${Number(p.bathrooms)||0} baños</span><span>${Number(p.construction)||0} m²</span></div><p class="price">${money(p.price,p.currency)}${p.operation==='renta'?'<small>/mes</small>':''}</p></div></article>`).join('');
  $('#emptyState').hidden=f.length>0;
  [...new Set(properties.map(p=>p.type).filter(Boolean))].sort().forEach(t=>{if(![...$('#typeFilter').options].some(o=>o.value===t))$('#typeFilter').add(new Option(t,t))});
}

function setDetailMainImage(container,src){
  const img=container.querySelector('[data-detail-main-image]');
  if(img) img.src=src;
  container.querySelectorAll('[data-detail-thumb]').forEach(btn=>btn.classList.toggle('active',btn.dataset.url===src));
}

function openProperty(id){
  const p=properties.find(x=>String(x.id)===String(id));
  if(!p)return;
  const photos=(p.photos||[]).filter(Boolean),phone=cleanPhone(p.sellerPhone),mainImage=photos[0]||'https://placehold.co/1400x900?text=Propiedad';
  const collage=photos.slice(1,5),thumbs=photos.length?photos:[mainImage];
  const detail=$('#propertyDetail');
  detail.innerHTML=`<div class="detail-shell"><div class="detail-media-card"><div class="detail-hero-grid"><div class="detail-main-stage"><img data-detail-main-image src="${esc(mainImage)}" alt="${esc(p.title)}"></div><div class="detail-collage">${collage.length?collage.map((u,i)=>`<button type="button" class="detail-thumb ${i===0?'active':''}" data-detail-thumb data-url="${esc(u)}"><img loading="lazy" src="${esc(u)}" alt="Vista ${i+2} de ${esc(p.title)}"></button>`).join(''):'<div class="detail-collage-placeholder">Galería profesional<br>de la propiedad</div>'}</div></div><div class="detail-thumbnail-rail">${thumbs.map((u,i)=>`<button type="button" class="detail-thumb ${u===mainImage?'active':''}" data-detail-thumb data-url="${esc(u)}"><img loading="lazy" src="${esc(u)}" alt="Miniatura ${i+1} de ${esc(p.title)}"></button>`).join('')}</div></div><aside class="detail-side-card"><p class="eyebrow">${esc(p.type||'Propiedad')} · ${esc(p.operation==='renta'?'Renta':'Venta')}</p><h2>${esc(p.title)}</h2><p class="detail-location">${esc(p.location||'Ubicación por confirmar')}</p><p class="price">${money(p.price,p.currency)}${p.operation==='renta'?'<small>/mes</small>':''}</p><div class="detail-stats-grid"><div class="detail-stat"><strong>${Number(p.bedrooms)||0}</strong><span>Recámaras</span></div><div class="detail-stat"><strong>${Number(p.bathrooms)||0}</strong><span>Baños</span></div><div class="detail-stat"><strong>${Number(p.construction)||0}</strong><span>m² constr.</span></div><div class="detail-stat"><strong>${Number(p.land)||0}</strong><span>m² terreno</span></div></div><div class="detail-contact-box"><h3>Contacto</h3><p>${esc(p.sellerName||'Asesora MARZA')}</p>${p.sellerPhone?`<p>${esc(p.sellerPhone)}</p>`:''}${p.sellerEmail?`<p>${esc(p.sellerEmail)}</p>`:''}</div><div class="detail-actions"><button class="primary" onclick="downloadPdf('${esc(p.id)}')">Descargar PDF</button>${phone?`<a class="secondary" target="_blank" rel="noopener" href="https://wa.me/${phone}?text=${encodeURIComponent('Hola, me interesa la propiedad: '+p.title)}">Hablar por WhatsApp</a>`:''}<button class="secondary" onclick="startAppointment('${esc(p.id)}')">Agendar visita</button></div></aside><section class="detail-info-card"><div class="detail-info-grid"><div><h3>Descripción</h3><p class="description">${esc(p.description||'Próximamente agregaremos la descripción completa de esta propiedad.')}</p></div><div><h3>Características destacadas</h3>${p.features?.length?`<ul class="features modern">${p.features.map(f=>`<li>${esc(f)}</li>`).join('')}</ul>`:'<p class="description">La asesora podrá agregar amenidades, ventajas y detalles diferenciales de esta propiedad.</p>'}</div></div></section></div>`;
  detail.querySelectorAll('[data-detail-thumb]').forEach(btn=>btn.addEventListener('click',()=>setDetailMainImage(detail,btn.dataset.url)));
  $('#propertyDialog').showModal();
}

function openExternal(url){
  const a=document.createElement('a');
  a.href=url;
  a.target='_blank';
  a.rel='noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function downloadPdf(id){
  try{
    const prop=properties.find(x=>String(x.id)===String(id));
    if(prop?.pdfUrl){ openExternal(prop.pdfUrl); return; }
    const d=await api('getPdf',{id});
    const url=d.downloadUrl||d.viewUrl||d.url;
    if(!url) throw new Error('No fue posible obtener el PDF.');
    if(prop) prop.pdfUrl=d.viewUrl||d.url||url;
    openExternal(url);
  }catch(e){alert(e.message)}
}
function startAppointment(id){const p=properties.find(x=>String(x.id)===String(id));$('#propertyDialog').close();chatState.favoritePropertyId=id;chatState.recommended=[id];openChat();bot(`Perfecto. Registraré tu interés en “${p?.title||'esta propiedad'}”. ¿A nombre de quién hago la solicitud?`);chatState.step='name'}

$('#search').addEventListener('input',renderProperties);$('#typeFilter').addEventListener('change',renderProperties);$('#operationFilter').addEventListener('change',renderProperties);$('#propertyGrid').addEventListener('click',e=>{const c=e.target.closest('.property-card');if(c)openProperty(c.dataset.id)});document.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());
$('#adminOpen').onclick=async()=>{sessionToken?await showAdmin():showLogin();$('#adminDialog').showModal()};function showLogin(){$('#loginPanel').hidden=false;$('#adminPanel').hidden=true}async function showAdmin(){$('#loginPanel').hidden=true;$('#adminPanel').hidden=false;await loadAdminProperties()}
$('#loginForm').onsubmit=async e=>{e.preventDefault();try{const d=await api('login',{password:$('#adminPassword').value});sessionToken=d.token;sessionStorage.setItem('adminToken',sessionToken);$('#loginMessage').textContent='';await showAdmin()}catch(err){$('#loginMessage').textContent=err.message}};$('#logout').onclick=()=>{sessionToken='';sessionStorage.removeItem('adminToken');showLogin()};

async function loadAdminProperties(){try{const d=await api('listAdmin',{token:sessionToken});adminProperties=d.properties||[];renderAdminList()}catch(e){if(/Sesión/.test(e.message)){sessionToken='';sessionStorage.removeItem('adminToken');showLogin()}else $('#saveMessage').textContent=e.message}}
function renderAdminList(){const q=$('#adminSearch').value.toLowerCase();const list=adminProperties.filter(p=>`${p.title} ${p.location} ${p.status}`.toLowerCase().includes(q));$('#adminPropertyList').innerHTML=list.map(p=>`<button type="button" class="inventory-item ${String(p.id)===String($('#propertyId').value)?'active':''}" data-id="${esc(p.id)}"><img src="${esc((p.photos||[])[0]||'https://placehold.co/120?text=Sin+foto')}" alt=""><span><strong>${esc(p.title)}</strong><small>${esc(p.location)}</small><em class="status-${esc(p.status)}">${esc(p.status)}</em></span></button>`).join('')||'<p class="empty-small">Sin propiedades.</p>'}
$('#adminSearch').oninput=renderAdminList;$('#adminPropertyList').onclick=e=>{const b=e.target.closest('[data-id]');if(b)editProperty(b.dataset.id)};$('#newProperty').onclick=resetForm;
function editProperty(id){const p=adminProperties.find(x=>String(x.id)===String(id));if(!p)return;resetForm();$('#formHeading').textContent='Editar propiedad';$('#propertyId').value=p.id;['title','type','operation','price','currency','location','bedrooms','bathrooms','construction','land','description','sellerName','sellerPhone','sellerEmail','status'].forEach(k=>{const el=$('#'+k);if(el)el.value=p[k]??''});$('#features').value=(p.features||[]).join('\n');photoItems=(p.photos||[]).map((url,i)=>({kind:'existing',url,preview:url,key:`existing-${i}-${url}`}));renderPhotoPreview();$('#deleteProperty').hidden=false;$('#marketplaceButton').hidden=false;renderAdminList()}
function resetForm(){$('#propertyForm').reset();$('#propertyId').value='';$('#operation').value='venta';$('#currency').value='MXN';$('#status').value='publicada';$('#formHeading').textContent='Nueva propiedad';$('#deleteProperty').hidden=true;$('#marketplaceButton').hidden=true;$('#saveMessage').textContent='';photoItems=[];renderPhotoPreview();renderAdminList()}

async function compressImage(file,maxWidth=1800,quality=.82){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{const scale=Math.min(1,maxWidth/img.width),canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);canvas.toBlob(blob=>{URL.revokeObjectURL(url);if(!blob)return reject(new Error('No se pudo procesar una imagen.'));resolve(new File([blob],file.name.replace(/\.[^.]+$/,'.jpg'),{type:'image/jpeg'}))},'image/jpeg',quality)};img.onerror=()=>reject(new Error(`No se pudo leer ${file.name}`));img.src=url})}
$('#photos').onchange=async e=>{const files=[...e.target.files];$('#saveMessage').textContent='Optimizando fotografías…';try{for(const original of files){const file=await compressImage(original);photoItems.push({kind:'new',file,preview:URL.createObjectURL(file),key:`new-${crypto.randomUUID()}`})}renderPhotoPreview();$('#saveMessage').textContent=`${files.length} fotografía(s) agregada(s).`}catch(err){$('#saveMessage').textContent=err.message}e.target.value=''};
function renderPhotoPreview(){$('#photoPreview').innerHTML=photoItems.map((x,i)=>`<figure draggable="true" data-key="${esc(x.key)}"><img src="${esc(x.preview)}" alt="Foto ${i+1}"><figcaption>${i===0?'★ Portada':`Foto ${i+1}`}</figcaption><button type="button" class="remove-photo" data-remove="${esc(x.key)}" aria-label="Eliminar fotografía">×</button><span class="drag-handle">⠿</span></figure>`).join('')}
let draggedKey='';$('#photoPreview').addEventListener('dragstart',e=>{const f=e.target.closest('figure');if(f){draggedKey=f.dataset.key;e.dataTransfer.effectAllowed='move'}});$('#photoPreview').addEventListener('dragover',e=>e.preventDefault());$('#photoPreview').addEventListener('drop',e=>{e.preventDefault();const target=e.target.closest('figure');if(!target||target.dataset.key===draggedKey)return;const from=photoItems.findIndex(x=>x.key===draggedKey),to=photoItems.findIndex(x=>x.key===target.dataset.key);const [item]=photoItems.splice(from,1);photoItems.splice(to,0,item);renderPhotoPreview()});$('#photoPreview').addEventListener('click',e=>{const key=e.target.dataset.remove;if(!key)return;const item=photoItems.find(x=>x.key===key);if(item?.kind==='new')URL.revokeObjectURL(item.preview);photoItems=photoItems.filter(x=>x.key!==key);renderPhotoPreview()});
const toBase64=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve({clientKey:file.__clientKey,name:file.name,type:file.type,data:String(r.result).split(',')[1]});r.onerror=reject;r.readAsDataURL(file)});
$('#propertyForm').onsubmit=async e=>{e.preventDefault();$('#saveMessage').textContent='Guardando…';try{const newItems=photoItems.filter(x=>x.kind==='new');const files=[];for(const item of newItems){item.file.__clientKey=item.key;files.push(await toBase64(item.file))}const photoOrder=photoItems.map(x=>x.kind==='existing'?{kind:'existing',url:x.url}:{kind:'new',clientKey:x.key});const property={id:$('#propertyId').value,title:$('#title').value,type:$('#type').value,operation:$('#operation').value,price:$('#price').value,currency:$('#currency').value,location:$('#location').value,bedrooms:$('#bedrooms').value,bathrooms:$('#bathrooms').value,construction:$('#construction').value,land:$('#land').value,description:$('#description').value,features:$('#features').value.split('\n').map(x=>x.trim()).filter(Boolean),sellerName:$('#sellerName').value,sellerPhone:$('#sellerPhone').value,sellerEmail:$('#sellerEmail').value,status:$('#status').value};const d=await api('saveProperty',{token:sessionToken,property,files,photoOrder});$('#saveMessage').textContent='Propiedad guardada correctamente.';await Promise.all([loadProperties(),loadAdminProperties()]);editProperty(d.id)}catch(err){$('#saveMessage').textContent=err.message}};
$('#deleteProperty').onclick=async()=>{const id=$('#propertyId').value;if(!id||!confirm('¿Eliminar esta propiedad y sus fotografías? Esta acción no se puede deshacer.'))return;try{await api('deleteProperty',{token:sessionToken,id});resetForm();await Promise.all([loadProperties(),loadAdminProperties()])}catch(e){$('#saveMessage').textContent=e.message}};

const chatState={
  criteria:{operation:'',type:'',zone:'',minPrice:null,maxPrice:null,bedrooms:null,features:[]},
  recommended:[],favoritePropertyId:'',name:'',contact:'',email:'',step:'',history:[]
};

function normalizeText(value=''){
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
}
function formatCriteria(){
  const c=chatState.criteria,parts=[];
  if(c.operation)parts.push(c.operation);
  if(c.type)parts.push(c.type);
  if(c.zone)parts.push(c.zone);
  if(c.maxPrice)parts.push(`hasta ${money(c.maxPrice,'MXN')}`);
  if(c.bedrooms)parts.push(`${c.bedrooms}+ recámaras`);
  if(c.features.length)parts.push(c.features.join(', '));
  return parts.join(' · ');
}
function parseMoney(text){
  const t=normalizeText(text).replace(/,/g,'');
  let m=t.match(/(?:\$|mxn|pesos?)?\s*(\d+(?:\.\d+)?)\s*(millones?|millon|mdp)\b/);
  if(m)return Math.round(Number(m[1])*1000000);
  m=t.match(/(?:\$|mxn|pesos?)?\s*(\d+(?:\.\d+)?)\s*(mil)\b/);
  if(m)return Math.round(Number(m[1])*1000);
  m=t.match(/(?:hasta|maximo|max|presupuesto|menos de|no mas de|entre)?\s*\$?\s*(\d{5,})/);
  return m?Number(m[1]):null;
}
function extractCriteria(text){
  const t=normalizeText(text),c=chatState.criteria;
  if(/\b(rentar|renta|alquilar|alquiler)\b/.test(t))c.operation='renta';
  if(/\b(comprar|compra|venta|adquirir)\b/.test(t))c.operation='venta';
  const knownTypes=['casa','departamento','terreno','local','oficina','bodega','rancho'];
  for(const type of knownTypes)if(new RegExp(`\\b${type}s?\\b`).test(t)){c.type=type;break;}
  const b=t.match(/(\d+)\s*(?:recamaras?|habitaciones?|cuartos?)/);
  if(b)c.bedrooms=Number(b[1]);
  const amount=parseMoney(t);
  if(amount){
    if(/(?:desde|minimo|arriba de|mas de)/.test(t))c.minPrice=amount;
    else c.maxPrice=amount;
  }
  const featureMap={
    'jardín':['jardin','area verde'], 'alberca':['alberca','piscina'], 'estacionamiento':['estacionamiento','cochera','autos'],
    'mascotas':['mascotas','pet friendly'], 'seguridad':['seguridad','vigilancia','privada'], 'terraza':['terraza'],
    'amueblado':['amueblado','muebles'], 'una planta':['una planta','planta baja']
  };
  Object.entries(featureMap).forEach(([label,words])=>{if(words.some(w=>t.includes(w))&&!c.features.includes(label))c.features.push(label)});
  const zones=[...new Set(properties.flatMap(p=>[p.location,p.zone,p.city,p.region]).filter(Boolean))];
  const match=zones.find(z=>t.includes(normalizeText(z)));
  if(match)c.zone=match;
  return c;
}
function propertyText(p){return normalizeText(`${p.title} ${p.location} ${p.zone||''} ${p.city||''} ${p.type} ${(p.features||[]).join(' ')}`)}
function scoreProperty(p){
  const c=chatState.criteria;let score=0,max=0,reasons=[];
  if(c.operation){max+=20;if(normalizeText(p.operation)===normalizeText(c.operation)){score+=20;reasons.push('operación')}}
  if(c.type){max+=18;if(propertyText(p).includes(normalizeText(c.type))){score+=18;reasons.push('tipo')}}
  if(c.zone){max+=22;if(propertyText(p).includes(normalizeText(c.zone))){score+=22;reasons.push('zona')}}
  if(c.maxPrice){max+=22;const price=Number(p.price)||0;if(price<=c.maxPrice){score+=22;reasons.push('presupuesto')}else if(price<=c.maxPrice*1.12){score+=10;reasons.push('cercano al presupuesto')}}
  if(c.minPrice){max+=8;if(Number(p.price)>=c.minPrice)score+=8}
  if(c.bedrooms){max+=10;if(Number(p.bedrooms)>=c.bedrooms){score+=10;reasons.push('recámaras')}}
  if(c.features.length){max+=Math.min(16,c.features.length*4);const txt=propertyText(p);const hits=c.features.filter(f=>txt.includes(normalizeText(f)));score+=hits.length*4;if(hits.length)reasons.push(...hits)}
  if(!max)return{score:50,reasons:['disponible']};
  return{score:Math.max(0,Math.min(100,Math.round(score/max*100))),reasons:[...new Set(reasons)]};
}
function recommendProperties(){
  return properties.map(p=>({p,...scoreProperty(p)})).filter(x=>x.score>=18).sort((a,b)=>b.score-a.score||Number(a.p.price)-Number(b.p.price)).slice(0,3);
}
function bot(t){
  chatState.history.push({role:'assistant',text:t});
  $('#chatMessages').insertAdjacentHTML('beforeend',`<div class="bubble">${esc(t)}</div>`);$('#chatMessages').scrollTop=99999;
}
function user(t){chatState.history.push({role:'user',text:t});$('#chatMessages').insertAdjacentHTML('beforeend',`<div class="bubble user">${esc(t)}</div>`)}
function quickReplies(items){
  const wrap=document.createElement('div');wrap.className='chat-quick-replies';
  items.forEach(item=>{const b=document.createElement('button');b.type='button';b.textContent=item.label;b.onclick=()=>{wrap.remove();handleChatInput(item.value||item.label)};wrap.appendChild(b)});
  $('#chatMessages').appendChild(wrap);$('#chatMessages').scrollTop=99999;
}
function showRecommendations(){
  const results=recommendProperties();chatState.recommended=results.map(x=>x.p.id);
  if(!results.length){bot('No encontré una coincidencia suficiente. Puedo ampliar la zona o el presupuesto.');quickReplies([{label:'Ampliar presupuesto 10%',value:'aumenta mi presupuesto 10%'},{label:'Buscar en todas las zonas',value:'cualquier zona'}]);return;}
  bot(`Encontré ${results.length} opción${results.length>1?'es':''}. ${formatCriteria()?`Criterios: ${formatCriteria()}.`:''}`);
  const html=results.map(({p,score,reasons})=>`<button type="button" class="chat-property-result" data-chat-property="${esc(p.id)}"><img src="${esc((p.photos||[])[0]||'https://placehold.co/180x120?text=Propiedad')}" alt=""><span><strong>${esc(p.title)}</strong><small>${money(p.price,p.currency)} · ${score}% coincidencia</small><em>${esc(reasons.slice(0,3).join(' · '))}</em></span></button>`).join('');
  $('#chatMessages').insertAdjacentHTML('beforeend',`<div class="chat-results">${html}</div>`);$('#chatMessages').scrollTop=99999;
  quickReplies([{label:'Comparar opciones',value:'compara las opciones'},{label:'Agendar visita',value:'quiero agendar una visita'}]);
}
function nextQualificationQuestion(){
  const c=chatState.criteria;
  if(!c.operation){bot('¿Buscas comprar o rentar?');quickReplies([{label:'Comprar'},{label:'Rentar'}]);return true;}
  if(!c.type){bot('¿Qué tipo de inmueble buscas?');quickReplies([{label:'Casa'},{label:'Departamento'},{label:'Terreno'}]);return true;}
  if(!c.zone){bot('¿En qué zona o municipio prefieres buscar?');return true;}
  if(!c.maxPrice){bot('¿Cuál es tu presupuesto máximo aproximado?');return true;}
  return false;
}
function leadScore(){
  const c=chatState.criteria;let s=0;if(c.operation)s+=12;if(c.type)s+=12;if(c.zone)s+=14;if(c.maxPrice)s+=18;if(c.bedrooms)s+=8;if(c.features.length)s+=6;if(chatState.favoritePropertyId)s+=12;if(chatState.name)s+=8;if(chatState.contact)s+=10;return Math.min(100,s);
}
async function persistProspect(){
  if(!chatState.contact)return;
  const score=leadScore();
  await api('saveProspect',{prospect:{name:chatState.name,contact:chatState.contact,email:chatState.email,...chatState.criteria,recommendedPropertyIds:chatState.recommended,favoritePropertyId:chatState.favoritePropertyId,score,level:score>=75?'Caliente':score>=45?'Medio':'Inicial',source:'Chat web',summary:chatState.history.slice(-12).map(x=>`${x.role}: ${x.text}`).join(' | ')}});
}
function compareRecommendations(){
  const selected=chatState.recommended.map(id=>properties.find(p=>String(p.id)===String(id))).filter(Boolean).slice(0,3);
  if(selected.length<2){bot('Necesito al menos dos propiedades recomendadas para compararlas.');return;}
  const lines=selected.map(p=>`${p.title}: ${money(p.price,p.currency)}, ${Number(p.land)||0} m² de terreno, ${Number(p.construction)||0} m² de construcción`).join(' | ');
  bot(`Comparación rápida: ${lines}. La mejor relación precio/terreno es ${selected.slice().sort((a,b)=>(Number(a.price)/(Number(a.land)||1))-(Number(b.price)/(Number(b.land)||1)))[0].title}.`);
}
async function handleChatInput(raw){
  const text=String(raw||'').trim();if(!text)return;user(text);const t=normalizeText(text);
  if(/cualquier zona/.test(t))chatState.criteria.zone='';
  if(/aumenta.*10/.test(t)&&chatState.criteria.maxPrice)chatState.criteria.maxPrice=Math.round(chatState.criteria.maxPrice*1.1);
  extractCriteria(text);
  if(chatState.step==='name'){chatState.name=text;chatState.step='contact';bot('¿Cuál es tu WhatsApp o correo para que la asesora te contacte?');return;}
  if(chatState.step==='contact'){chatState.contact=text;chatState.step='';try{await persistProspect();bot('Listo. Guardé tus preferencias y datos. La asesora podrá dar seguimiento a tu solicitud.');}catch(e){bot('Guardé la conversación, pero no pude registrar el prospecto: '+e.message)}return;}
  if(/compar/.test(t)){compareRecommendations();return;}
  if(/agendar|cita|visita/.test(t)){
    if(!chatState.favoritePropertyId&&chatState.recommended[0])chatState.favoritePropertyId=chatState.recommended[0];
    chatState.step='name';bot('Perfecto. ¿A nombre de quién registro la solicitud?');return;
  }
  if(/contactar|whatsapp|asesora/.test(t)){chatState.step='name';bot('Claro. ¿Cuál es tu nombre?');return;}
  if(/buscar|busco|quiero|necesito|casa|departamento|terreno|renta|comprar|millones|recamaras|jardin|alberca/.test(t)){
    if(!nextQualificationQuestion())showRecommendations();return;
  }
  if(chatState.favoritePropertyId){
    const p=properties.find(x=>String(x.id)===String(chatState.favoritePropertyId));
    if(p&&/precio|cuanto/.test(t)){bot(`${p.title} tiene un precio de ${money(p.price,p.currency)}${p.operation==='renta'?' mensuales':''}.`);return;}
    if(p&&/medidas|terreno|construccion/.test(t)){bot(`${p.title}: ${Number(p.land)||0} m² de terreno y ${Number(p.construction)||0} m² de construcción.`);return;}
  }
  bot('Puedo buscar por compra o renta, zona, presupuesto, tipo de inmueble, recámaras y características; también puedo comparar opciones o registrar una visita.');
  quickReplies([{label:'Buscar propiedad'},{label:'Ver opciones disponibles',value:'busco una propiedad'},{label:'Hablar con asesora'}]);
}
function openChat(){
  $('#chatPanel').hidden=false;
  if(!$('#chatMessages').children.length){bot('Hola. Soy el asistente de MARZA. Te ayudaré a encontrar propiedades reales del inventario y a registrar una visita.');quickReplies([{label:'Comprar'},{label:'Rentar'},{label:'Ver propiedades',value:'busco una propiedad'}]);}
}
$('#chatButton').onclick=openChat;document.querySelectorAll('[data-open-chat]').forEach(button=>button.addEventListener('click',openChat));$('#chatClose').onclick=()=>$('#chatPanel').hidden=true;
$('#chatForm').onsubmit=e=>{e.preventDefault();const text=$('#chatInput').value.trim();$('#chatInput').value='';handleChatInput(text)};
$('#chatMessages').addEventListener('click',e=>{const b=e.target.closest('[data-chat-property]');if(!b)return;const id=b.dataset.chatProperty;chatState.favoritePropertyId=id;const p=properties.find(x=>String(x.id)===String(id));if(p){openProperty(id);bot(`Seleccionaste “${p.title}”. Puedo explicarte sus datos, compararla o registrar una visita.`)}});



function propertyPublicUrl(id){
  const url=new URL(window.location.href);
  url.search='';
  url.hash='';
  url.searchParams.set('propiedad',id);
  return url.toString();
}
function marketplaceTitleFor(p){
  const area=Number(p.land)||Number(p.construction)||0;
  return `${p.type||'Propiedad'} en ${p.operation==='renta'?'renta':'venta'} en ${p.location||'Querétaro'}${area?` – ${area} m²`:''}`.slice(0,100);
}
function marketplaceDescriptionFor(p){
  const lines=[
    `${String(p.type||'PROPIEDAD').toUpperCase()} EN ${p.operation==='renta'?'RENTA':'VENTA'}`,
    '',
    p.location||'',
    '',
    `Precio: ${money(p.price,p.currency)}${p.operation==='renta'?' mensuales':''}`,
    Number(p.land)?`Terreno: ${p.land} m²`:'',
    Number(p.construction)?`Construcción: ${p.construction} m²`:'',
    Number(p.bedrooms)?`Recámaras: ${p.bedrooms}`:'',
    Number(p.bathrooms)?`Baños: ${p.bathrooms}`:'',
    '',
    p.description||'',
    '',
    ...(p.features||[]).map(x=>`• ${x}`),
    '',
    'Consulta fotografías, ficha técnica y solicita una visita:',
    propertyPublicUrl(p.id),
    '',
    `Contacto: ${p.sellerName||'MARZA Bienes Raíces'}`,
    p.sellerPhone?`WhatsApp: ${p.sellerPhone}`:'',
    '',
    'La disponibilidad y el precio pueden cambiar sin previo aviso.'
  ];
  return lines.filter((x,i,a)=>x!==''||a[i-1]!=='').join('\n').trim();
}
function copyText(value,label){
  navigator.clipboard.writeText(value).then(()=>{$('#marketplaceStatus').textContent=`${label} copiado.`}).catch(()=>{prompt('Copia este contenido:',value)});
}
function loadImageCORS(src){return new Promise((resolve,reject)=>{const img=new Image();img.crossOrigin='anonymous';img.onload=()=>resolve(img);img.onerror=reject;img.src=src+(src.includes('?')?'&':'?')+'cache='+Date.now()})}
function drawCoverImage(ctx,img,x,y,w,h){
  const r=Math.max(w/img.width,h/img.height),sw=w/r,sh=h/r,sx=(img.width-sw)/2,sy=(img.height-sh)/2;
  ctx.drawImage(img,sx,sy,sw,sh,x,y,w,h);
}
async function renderMarketplaceCanvas(p){
  const canvas=$('#marketplaceCanvas'),ctx=canvas.getContext('2d');
  ctx.clearRect(0,0,1080,1080);ctx.fillStyle='#f7f1e8';ctx.fillRect(0,0,1080,1080);
  const cover=(p.photos||[])[0];
  if(cover){try{const img=await loadImageCORS(cover);drawCoverImage(ctx,img,0,0,1080,720)}catch(e){ctx.fillStyle='#ded1c2';ctx.fillRect(0,0,1080,720)}}
  const grad=ctx.createLinearGradient(0,480,0,720);grad.addColorStop(0,'rgba(45,27,18,0)');grad.addColorStop(1,'rgba(45,27,18,.82)');ctx.fillStyle=grad;ctx.fillRect(0,480,1080,240);
  ctx.fillStyle='#fff';ctx.font='700 34px Arial';ctx.fillText('MARZA BIENES RAÍCES',58,74);
  ctx.font='700 44px Georgia';wrapCanvasText(ctx,marketplaceTitleFor(p),58,780,720,54,3);
  ctx.fillStyle='#8b582f';ctx.font='800 50px Arial';ctx.fillText(money(p.price,p.currency)+(p.operation==='renta'?' / mes':''),58,970);
  ctx.fillStyle='#5e4a3f';ctx.font='600 28px Arial';ctx.fillText(p.location||'',58,1020);
  const qrBox=document.createElement('div');qrBox.style.position='fixed';qrBox.style.left='-9999px';document.body.appendChild(qrBox);
  try{
    new QRCode(qrBox,{text:propertyPublicUrl(p.id),width:220,height:220,correctLevel:QRCode.CorrectLevel.M});
    await new Promise(r=>setTimeout(r,100));const q=qrBox.querySelector('canvas, img');if(q)ctx.drawImage(q,820,820,210,210);
  }finally{qrBox.remove()}
}
function wrapCanvasText(ctx,text,x,y,maxWidth,lineHeight,maxLines){
  const words=String(text).split(/\s+/);let line='',lines=[];
  for(const word of words){const test=line?line+' '+word:word;if(ctx.measureText(test).width>maxWidth&&line){lines.push(line);line=word}else line=test}
  if(line)lines.push(line);lines.slice(0,maxLines).forEach((l,i)=>ctx.fillText(l,x,y+i*lineHeight));
}
let marketplaceProperty=null;
let reopenAdminAfterMarketplace=false;
async function openMarketplaceTools(){
  try{
    const id=$('#propertyId').value;
    const p=adminProperties.find(x=>String(x.id)===String(id));
    if(!p){ alert('Selecciona y guarda primero una propiedad.'); return; }

    marketplaceProperty=p;
    $('#marketplaceTitle').value=marketplaceTitleFor(p);
    $('#marketplacePrice').value=money(p.price,p.currency);
    $('#marketplaceLink').value=propertyPublicUrl(p.id);
    $('#marketplaceDescription').value=marketplaceDescriptionFor(p);
    $('#marketplaceStatus').textContent='Preparando vista previa…';

    const adminDialog=$('#adminDialog');
    const marketplaceDialog=$('#marketplaceDialog');
    reopenAdminAfterMarketplace=Boolean(adminDialog?.open);

    // Evita intentar abrir dos diálogos modales al mismo tiempo.
    if(adminDialog?.open) adminDialog.close();
    if(!marketplaceDialog.open) marketplaceDialog.showModal();

    try{
      await renderMarketplaceCanvas(p);
      $('#marketplaceStatus').textContent='Material listo para publicar.';
    }catch(canvasError){
      console.error('No se pudo generar la portada:',canvasError);
      $('#marketplaceStatus').textContent='Los textos están listos. No se pudo generar la portada automáticamente; revisa la conexión o el bloqueador del navegador.';
    }
  }catch(error){
    console.error('Error al abrir Marketplace:',error);
    alert('No se pudo abrir Publicidad Marketplace: '+(error?.message||error));
  }
}
$('#marketplaceButton').addEventListener('click',openMarketplaceTools);

const marketplaceCloseButton=document.querySelector('[data-close="marketplaceDialog"]');
if(marketplaceCloseButton){
  marketplaceCloseButton.addEventListener('click',()=>{
    setTimeout(()=>{
      if(reopenAdminAfterMarketplace && !$('#adminDialog').open) $('#adminDialog').showModal();
      reopenAdminAfterMarketplace=false;
    },0);
  });
}
$('#copyMarketplaceTitle').onclick=()=>copyText($('#marketplaceTitle').value,'Título');
$('#copyMarketplaceDescription').onclick=()=>copyText($('#marketplaceDescription').value,'Descripción');
$('#copyMarketplaceLink').onclick=()=>copyText($('#marketplaceLink').value,'Enlace');
$('#downloadMarketplaceCover').onclick=()=>{if(!marketplaceProperty)return;const a=document.createElement('a');a.download=`${marketplaceProperty.id}-portada-marketplace.png`;a.href=$('#marketplaceCanvas').toDataURL('image/png');a.click()};
$('#downloadMarketplacePackage').onclick=async()=>{if(!marketplaceProperty)return;$('#marketplaceStatus').textContent='Preparando paquete ZIP…';try{const d=await api('getMarketplacePackage',{token:sessionToken,id:marketplaceProperty.id,title:$('#marketplaceTitle').value,description:$('#marketplaceDescription').value,link:$('#marketplaceLink').value});openExternal(d.downloadUrl||d.url);$('#marketplaceStatus').textContent='Paquete listo.'}catch(e){$('#marketplaceStatus').textContent=e.message}};

function openDeepLinkedProperty(){
  const id=new URLSearchParams(location.search).get('propiedad');
  if(!id)return;
  const tries=()=>{const found=properties.find(x=>String(x.id)===String(id));if(found){openProperty(id);window.chatContext={propertyId:id,propertyTitle:found.title};}else setTimeout(tries,350)};tries();
}

resetForm();loadProperties().then?.(openDeepLinkedProperty);setTimeout(openDeepLinkedProperty,700);
