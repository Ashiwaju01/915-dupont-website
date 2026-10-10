/* Rooms admin: requires admin/config.js with a Rooms-owned Supabase URL and publishable/anon key. */
(() => {
  const config = window.ROOMS_SUPABASE_CONFIG || {};
  const configured = Boolean(config.url && config.anonKey && window.supabase);
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const moduleConfig = {
    reservations:{title:'Reservations',desc:'Review bookings and update their status.',table:'reservations',fields:[['guest_name','Guest name','text',true],['guest_email','Email','email',true],['guest_phone','Phone','text'],['location_id','Location ID','text',true],['party_size','Party size','number',true],['starts_at','Start date and time','datetime-local',true],['ends_at','End date and time','datetime-local'],['status','Status','select',true,['pending','confirmed','cancelled','completed','no_show']],['customer_notes','Guest notes','textarea'],['internal_notes','Internal notes','textarea']],columns:['confirmation_code','guest_name','guest_email','party_size','starts_at','status','id']},
    locations:{title:'Locations',desc:'Manage locations, addresses and opening hours.',table:'locations',fields:[['name','Name','text',true],['slug','URL slug','text',true],['address','Address','text',true],['description','Description','textarea'],['phone','Phone','text'],['email','Email','email'],['opening_hours','Opening hours (JSON)','textarea'],['is_active','Active','checkbox'],['sort_order','Sort order','number']],columns:['name','slug','address','is_active','sort_order','id']},
    menu_categories:{title:'Menu categories',desc:'Organize menus by category and location.',table:'menu_categories',fields:[['name','Name','text',true],['slug','Slug','text',true],['location_id','Location ID (optional)','text'],['description','Description','textarea'],['sort_order','Sort order','number'],['is_active','Active','checkbox']],columns:['name','slug','location_id','is_active','sort_order','id']},
    menu_items:{title:'Menu items',desc:'Manage menu copy, prices and availability. Prices are stored in cents.',table:'menu_items',fields:[['category_id','Category ID','text',true],['name','Name','text',true],['description','Description','textarea'],['price_cents','Price in cents (e.g. 650 = $6.50)','number',true],['currency','Currency (ISO code)','text',true],['image_url','Image URL','url'],['dietary_tags','Dietary tags (comma-separated)','text'],['is_available','Available','checkbox'],['sort_order','Sort order','number']],columns:['name','price_cents','currency','is_available','category_id','id']},
    products:{title:'Shop products',desc:'Manage product listings and inventory. Prices are stored in cents.',table:'products',fields:[['name','Product name','text',true],['slug','URL slug','text',true],['description','Description','textarea'],['price_cents','Price in cents','number',true],['currency','Currency (ISO code)','text',true],['image_url','Image URL','url'],['sku','SKU','text'],['inventory_quantity','Inventory quantity (blank = not tracked)','number'],['is_active','Active','checkbox']],columns:['name','sku','price_cents','inventory_quantity','is_active','id']},
    orders:{title:'Orders',desc:'Read-only order review. Payment state and totals stay locked until verified server-side payment webhooks and order controls are implemented.',table:'orders',readonly:true,fields:[],columns:['order_number','customer_name','customer_email','status','total_cents','payment_status','id']},
    catering_enquiries:{title:'Catering enquiries',desc:'Follow up on catering and event enquiries.',table:'catering_enquiries',fields:[['name','Name','text',true],['email','Email','email',true],['phone','Phone','text'],['event_date','Event date','date'],['guest_count','Guest count','number'],['event_type','Event type','text'],['message','Message','textarea',true],['status','Status','select',true,['new','in_review','responded','closed']],['internal_notes','Internal notes','textarea']],columns:['name','email','event_date','guest_count','status','id']},
    site_content:{title:'Website content',desc:'Edit published page content and metadata.',table:'site_content',fields:[['content_key','Content key','text',true],['title','Title','text'],['body','Body copy','textarea'],['image_url','Image URL','url'],['metadata','Metadata (JSON)','textarea'],['is_published','Published','checkbox']],columns:['content_key','title','is_published','updated_at','id']},
    profiles:{title:'Staff & access',desc:'Owner-only view of profiles. Role changes should be performed by an authorized owner after identity verification.',table:'profiles',readonly:true,fields:[],columns:['full_name','phone','role','active','created_at','id']},
    audit_logs:{title:'Audit log',desc:'Review recorded staff actions.',table:'audit_logs',readonly:true,fields:[],columns:['created_at','actor_id','action','entity_type','entity_id','id']}
  };
  let client=null, currentUser=null, currentRole=null, activeModule='overview', records=[], editingId=null;
  const escapeHtml=(v)=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const notice=(msg,error=false)=>{const el=$('#notice');el.textContent=msg;el.classList.remove('hidden');el.style.background=error?'#f9e9e5':'#e8f2eb';el.style.color=error?'#853426':'#245d42';};
  const clearNotice=()=>$('#notice').classList.add('hidden');
  const fmt=(v)=>{if(v===null||v===undefined||v==='')return '—';if(typeof v==='boolean')return v?'Yes':'No';if(Array.isArray(v))return v.join(', ');if(typeof v==='object')return JSON.stringify(v);return String(v)};
  function setSignedIn(on){$('#loginPanel').classList.toggle('hidden',on);$('#appPanel').classList.toggle('hidden',!on);$('#signOut').classList.toggle('hidden',!on);$('#userEmail').textContent=on?(currentUser?.email||'Signed in'):'Not signed in';}
  function roleAllowed(){return ['owner','manager','staff'].includes(currentRole);}
  async function start(){
    if(!configured){$('#loginMessage').textContent='Backend not connected yet. Rooms must create its Supabase project, then add admin/config.js from config.example.js. No credentials are embedded in this repository.';$('#loginForm button').disabled=true;return;}
    client=window.supabase.createClient(config.url,config.anonKey);
    client.auth.onAuthStateChange((_event,session)=>{if(session?.user){currentUser=session.user;setTimeout(checkProfile,0)}else{currentUser=null;currentRole=null;setSignedIn(false)}});
    const {data:{session}}=await client.auth.getSession();if(session?.user){currentUser=session.user;await checkProfile();}
  }
  async function checkProfile(){
    if(!currentUser)return;
    const {data,error}=await client.from('profiles').select('role,active,full_name').eq('id',currentUser.id).maybeSingle();
    if(error||!data||!data.active||!['owner','manager','staff'].includes(data.role)){await client.auth.signOut();$('#loginMessage').textContent='This account does not have active Rooms staff access. Ask the Rooms owner to provision access.';return;}
    currentRole=data.role;setSignedIn(true);
    $$('.owner-only').forEach(el=>el.classList.toggle('hidden',currentRole!=='owner'));
    $$('.manager-only').forEach(el=>el.classList.toggle('hidden',!['owner','manager'].includes(currentRole)));
    if(currentRole==='staff'){$$('.nav-item[data-module="locations"],.nav-item[data-module="menu_categories"],.nav-item[data-module="products"],.nav-item[data-module="site_content"]').forEach(el=>el.classList.add('hidden'));}
    await showModule('overview');
  }
  $('#loginForm').addEventListener('submit',async e=>{e.preventDefault();if(!configured)return;$('#loginMessage').textContent='Signing in…';const {error}=await client.auth.signInWithPassword({email:$('#email').value.trim(),password:$('#password').value});$('#loginMessage').textContent=error?error.message:'Signed in. Loading workspace…';});
  $('#signOut').addEventListener('click',async()=>{if(client)await client.auth.signOut();});
  $('#menuToggle').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));
  $('#navigation').addEventListener('click',e=>{const b=e.target.closest('[data-module]');if(b&&!b.classList.contains('hidden'))showModule(b.dataset.module)});
  $$('[data-goto]').forEach(b=>b.addEventListener('click',()=>showModule(b.dataset.goto)));
  $('#refreshRecords').addEventListener('click',loadRecords);
  $('#searchRecords').addEventListener('input',renderRecords);
  $('#addRecord').addEventListener('click',()=>openForm());
  $('#closeModal').addEventListener('click',closeForm);$('#cancelModal').addEventListener('click',closeForm);
  $('#recordModal').addEventListener('click',e=>{if(e.target.id==='recordModal')closeForm()});
  $('#recordForm').addEventListener('submit',saveRecord);
  async function showModule(name){
    activeModule=name;$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.module===name));$('#sidebar').classList.remove('open');clearNotice();
    const overview=name==='overview';$('#overviewPanel').classList.toggle('hidden',!overview);$('#modulePanel').classList.toggle('hidden',overview);
    $('#pageTitle').textContent=overview?'Overview':(moduleConfig[name]?.title||name);
    if(overview){await loadOverview();return;}
    const cfg=moduleConfig[name];if(!cfg)return;
    if(name==='profiles'&&currentRole!=='owner'||name==='audit_logs'&&!['owner','manager'].includes(currentRole)){notice('Your role does not have access to this module.',true);return;}
    $('#moduleHeading').textContent=cfg.title;$('#moduleDescription').textContent=cfg.desc;$('#addRecord').classList.toggle('hidden',Boolean(cfg.readonly));$('#searchRecords').value='';await loadRecords();
  }
  async function loadOverview(){
    const counts=[['Reservations','reservations'],['Shop products','products'],['Orders','orders'],['Open enquiries','catering_enquiries']];
    const result=await Promise.all(counts.map(async([label,table])=>{let q=client.from(table).select('id',{count:'exact',head:true});if(table==='catering_enquiries')q=q.in('status',['new','in_review']);const {count,error}=await q;return {label,count,error};}));
    $('#stats').innerHTML=result.map(r=>'<div class="stat-card"><span>'+escapeHtml(r.label)+'</span><strong>'+(r.error?'—':r.count??0)+'</strong></div>').join('');
    const {data,error}=await client.from('reservations').select('id,confirmation_code,guest_name,party_size,starts_at,status').order('created_at',{ascending:false}).limit(6);
    $('#recentReservations').innerHTML=error?'<div class="empty">Could not load reservations. Check database permissions.</div>':tableHtml(data||[],['confirmation_code','guest_name','party_size','starts_at','status'],false);
  }
  async function loadRecords(){
    const cfg=moduleConfig[activeModule];if(!cfg||!client)return;
    $('#recordsTable').innerHTML='<div class="empty">Loading records…</div>';$('#moduleMessage').textContent='';
    const {data,error}=await client.from(cfg.table).select('*').order('created_at',{ascending:false}).limit(250);
    if(error){records=[];$('#recordsTable').innerHTML='<div class="empty">Could not load records: '+escapeHtml(error.message)+'</div>';return;}
    records=data||[];renderRecords();
  }
  function tableHtml(rows,cols,actions){
    if(!rows.length)return '<div class="empty">No records yet.</div>';
    return '<table><thead><tr>'+cols.map(c=>'<th>'+escapeHtml(c.replaceAll('_',' '))+'</th>').join('')+(actions?'<th>Actions</th>':'')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+cols.map(c=>'<td>'+(c==='status'||c==='role'||c==='payment_status'?'<span class="pill">'+escapeHtml(fmt(row[c]))+'</span>':escapeHtml(fmt(row[c])))+'</td>').join('')+(actions?'<td><button class="table-action" data-edit="'+escapeHtml(row.id)+'">Edit</button><button class="table-action delete" data-delete="'+escapeHtml(row.id)+'">Delete</button></td>':'')+'</tr>').join('')+'</tbody></table>';
  }
  function renderRecords(){
    const cfg=moduleConfig[activeModule];if(!cfg)return;
    const needle=$('#searchRecords').value.trim().toLowerCase();
    const filtered=records.filter(r=>!needle||Object.values(r).some(v=>String(v??'').toLowerCase().includes(needle)));
    $('#recordsTable').innerHTML=tableHtml(filtered,cfg.columns,!cfg.readonly);
    $('#recordsTable').querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openForm(records.find(r=>r.id===b.dataset.edit))));
    $('#recordsTable').querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteRecord(b.dataset.delete)));
  }
  function openForm(record=null){
    const cfg=moduleConfig[activeModule];if(!cfg||cfg.readonly)return;editingId=record?.id||null;$('#modalTitle').textContent=editingId?'Edit '+cfg.title.toLowerCase():'Add '+cfg.title.toLowerCase();$('#formMessage').textContent='';
    $('#recordFields').innerHTML=cfg.fields.map(([key,label,type,required,options])=>{
      let val=record?.[key];if(type==='datetime-local'&&val)val=new Date(val).toISOString().slice(0,16);if(type==='checkbox')return '<div class="field"><label><input style="width:auto" type="checkbox" name="'+key+'" '+(val?'checked':'')+'> '+escapeHtml(label)+'</label></div>';
      let input;if(type==='textarea')input='<textarea name="'+key+'" '+(required?'required':'')+'>'+escapeHtml(typeof val==='object'&&val!==null?JSON.stringify(val):val??'')+'</textarea>';
      else if(type==='select')input='<select name="'+key+'" '+(required?'required':'')+'>'+options.map(o=>'<option value="'+o+'" '+(val===o?'selected':'')+'>'+o.replaceAll('_',' ')+'</option>').join('')+'</select>';
      else input='<input name="'+key+'" type="'+(type==='number'?'number':type==='datetime-local'?'datetime-local':type)+'" value="'+escapeHtml(val??'')+'" '+(required?'required':'')+(type==='number'?' step="1"':'')+'>';
      return '<div class="field '+(type==='textarea'?'full':'')+'"><label>'+escapeHtml(label)+'</label>'+input+'</div>';
    }).join('');
    $('#recordModal').classList.remove('hidden');
  }
  function closeForm(){$('#recordModal').classList.add('hidden');editingId=null;}
  async function saveRecord(e){
    e.preventDefault();const cfg=moduleConfig[activeModule];if(!cfg||cfg.readonly)return;const form=new FormData(e.currentTarget),payload={};
    for(const [key,label,type] of cfg.fields.map(f=>[f[0],f[1],f[2]])){
      const field=e.currentTarget.elements.namedItem(key);if(!field)continue;
      if(type==='checkbox'){payload[key]=field.checked;continue;}
      let value=String(form.get(key)??'').trim();if(!value){if(key==='opening_hours'||key==='metadata')payload[key]={};else if(key==='dietary_tags')payload[key]=[];else if(['sort_order','tax_cents','shipping_cents'].includes(key))payload[key]=0;else if(key==='currency')payload[key]='CAD';else payload[key]=null;continue;}
      if(type==='number'){payload[key]=Number(value);if(!Number.isFinite(payload[key])){ $('#formMessage').textContent=label+' must be a valid number.';return;}}
      else if(key==='opening_hours'||key==='metadata'){try{payload[key]=JSON.parse(value);}catch{ $('#formMessage').textContent=label+' must be valid JSON.';return;}}
      else if(key==='dietary_tags')payload[key]=value.split(',').map(s=>s.trim()).filter(Boolean);
      else if(type==='datetime-local')payload[key]=new Date(value).toISOString();
      else payload[key]=value;
    }
    if(activeModule==='reservations'&&!editingId)payload.status='pending';
    $('#saveRecord').disabled=true;$('#formMessage').textContent='Saving…';
    let query;
    if(editingId)query=client.from(cfg.table).update(payload).eq('id',editingId);
    else query=client.from(cfg.table).insert(payload);
    const {error}=await query;
    $('#saveRecord').disabled=false;
    if(error){$('#formMessage').textContent='Not saved: '+error.message;return;}
    await writeAudit(editingId?'update':'create',cfg.table,editingId||null);
    closeForm();notice('Record saved.');await loadRecords();
  }
  async function deleteRecord(id){
    const cfg=moduleConfig[activeModule];if(!cfg||cfg.readonly||!confirm('Delete this record? This may be blocked if other records depend on it.'))return;
    const {error}=await client.from(cfg.table).delete().eq('id',id);
    if(error){notice('Delete failed: '+error.message,true);return;}
    await writeAudit('delete',cfg.table,id);notice('Record deleted.');await loadRecords();
  }
  async function writeAudit(action,entity,id){try{await client.from('audit_logs').insert({actor_id:currentUser.id,action,entity_type:entity,entity_id:id?String(id):null,details:{source:'rooms-admin'}})}catch(_e){}}
  start().catch(e=>{$('#loginMessage').textContent='Could not initialize admin: '+e.message;});
})();
