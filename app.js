// app.js - Vanilla JS port approximating features from your TSX
(() => {
  // --- Mock data generator (like original) ---
  function generateMockComics() {
    const genres = ['Action','Romance','Fantasy','Slice of Life','Horror','Comedy','Drama','Sci-Fi'];
    const comics = [];
    for(let i=1;i<=20;i++){
      const numG = Math.floor(Math.random()*3)+1;
      const gs = [];
      for(let j=0;j<numG;j++){
        const g = genres[Math.floor(Math.random()*genres.length)];
        if(!gs.includes(g)) gs.push(g);
      }
      const chaptersCount = Math.floor(Math.random()*30)+8;
      const chapters = Array.from({length:chaptersCount},(_,k)=>({
        id:k+1,
        title:`Chapter ${k+1}`,
        pages: Math.floor(Math.random()*30)+8,
        uploadDate: new Date(Date.now() - Math.random()*90*24*60*60*1000).toISOString()
      }));
      comics.push({
        id:i,
        title:`Komik Seru ${i}`,
        author:`Author ${i}`,
        cover:`https://picsum.photos/seed/comic${i}/600/900`,
        description:`Deskripsi menarik untuk komik ${i}. Petualangan epik yang penuh aksi dan emosi.`,
        rating:(Math.random()*2+3).toFixed(1),
        views: Math.floor(Math.random()*100000)+1000,
        likes: Math.floor(Math.random()*10000)+100,
        genres: gs,
        chapters,
        lastUpdate: new Date(Date.now() - Math.random()*30*24*60*60*1000).toISOString(),
        status: Math.random()>0.3 ? 'Ongoing' : 'Completed'
      });
    }
    return comics;
  }

  // --- State ---
  const state = {
    comics: generateMockComics(),
    currentPage: 'home',
    selectedComic: null,
    readingChapter: null,
    navigationCount: 0,
    bookmarks: JSON.parse(localStorage.getItem('hz_bookmarks')||'[]'),
    dark: localStorage.getItem('hz_dark')==='1',
    users: JSON.parse(localStorage.getItem('hz_users')||'[]'),
    loggedInUser: JSON.parse(localStorage.getItem('hz_user')||'null'),
    ads: [
      {id:1,name:'Top Banner',position:'top',code:'<div style="padding:16px;background:#eef2ff;border-radius:6px">Top Banner Demo</div>',active:true},
      {id:2,name:'Sidebar',position:'sidebar',code:'<div style="padding:12px;background:#f8fafc;border-radius:6px">Sidebar Ad</div>',active:true},
      {id:3,name:'Interstitial',position:'interstitial',code:'<div style="padding:40px;text-align:center;color:white;background:linear-gradient(135deg,#667eea,#764ba2);border-radius:10px"><h2>Sponsored</h2><p>Demo ad</p></div>',active:true}
    ]
  };

  // --- DOM refs ---
  const app = document.getElementById('app');
  const btnHome = document.getElementById('btn-home');
  const btnExplore = document.getElementById('btn-explore');
  const btnBookmark = document.getElementById('btn-bookmark');
  const btnProfile = document.getElementById('btn-profile');
  const btnAdmin = document.getElementById('btn-admin');
  const toggleDark = document.getElementById('toggle-dark');
  const interstitial = document.getElementById('interstitial');
  const closeAdBtn = document.getElementById('close-ad');
  const authModal = document.getElementById('auth-modal');
  const authInner = document.getElementById('auth-inner');

  // --- Helpers ---
  function setTheme(dark){
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('hz_dark', dark ? '1':'0');
    toggleDark.textContent = dark ? '☀️' : '🌙';
  }
  setTheme(state.dark);

  function saveBookmarks(){ localStorage.setItem('hz_bookmarks', JSON.stringify(state.bookmarks)); }
  function saveUsers(){ localStorage.setItem('hz_users', JSON.stringify(state.users)); }
  function saveLogin(){ localStorage.setItem('hz_user', JSON.stringify(state.loggedInUser)); }

  function renderNavActive(){
    [btnHome,btnExplore,btnBookmark,btnProfile,btnAdmin].forEach(b=>b.classList.remove('active'));
    if(state.currentPage==='home') btnHome.classList.add('active');
    if(state.currentPage==='explore') btnExplore.classList.add('active');
    if(state.currentPage==='bookmark') btnBookmark.classList.add('active');
    if(state.currentPage==='profile') btnProfile.classList.add('active');
    if(state.currentPage==='admin') btnAdmin.classList.add('active');
  }

  // --- Render pages ---
  function render(){ renderNavActive(); if(state.currentPage==='home') return renderHome(); if(state.currentPage==='explore') return renderExplore(); if(state.currentPage==='bookmark') return renderBookmark(); if(state.currentPage==='profile') return renderProfile(); if(state.currentPage==='admin') return renderAdmin(); }

  // Small utility to create elements
  function el(tag, attrs={}, children=[]){ const e=document.createElement(tag); for(const k in attrs){ if(k==='class') e.className=attrs[k]; else if(k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); } (Array.isArray(children)?children:[children]).flat().forEach(c=>{ if(typeof c==='string') e.appendChild(document.createTextNode(c)); else if(c) e.appendChild(c); }); return e; }

  function createCard(comic){
    const card = el('div',{class:'card'});
    const img = el('img',{src:comic.cover,loading:'lazy',alt:comic.title});
    const body = el('div',{class:'body'},[
      el('h4',{},comic.title),
      el('div',{class:'meta'},[ el('span',{},comic.author), el('span',{},`${(comic.views/1000).toFixed(1)}K`) ])
    ]);
    card.appendChild(img);
    card.appendChild(body);
    card.addEventListener('click', ()=>openDetail(comic));
    return card;
  }

  function renderHome(){
    app.innerHTML='';
    const container = document.createElement('div');
    const topAd = state.ads.find(a=>a.position==='top' && a.active);
    if(topAd){
      const addiv = el('div',{},[]); addiv.innerHTML = topAd.code; container.appendChild(addiv);
    }

    const featured = el('div',{class:'section-title'},[ el('h2',{},'Featured') ]);
    container.appendChild(featured);
    container.appendChild(createCard(state.comics[0]));

    const tTitle = el('div',{class:'section-title'}, el('h3',{},'Trending Sekarang'));
    container.appendChild(tTitle);

    const grid = el('div',{class:'grid'});
    state.comics.slice().sort((a,b)=>b.views-a.views).slice(0,12).forEach(c=>grid.appendChild(createCard(c)));
    container.appendChild(grid);

    app.appendChild(container);
  }

  function renderExplore(){
    app.innerHTML='';
    const top = el('div',{class:'controls'});
    const search = el('input',{class:'search',placeholder:'Cari judul, author, genre...'});
    const filterBtn = el('button',{class:'filter-btn'},'Filter Genre');
    top.appendChild(search); top.appendChild(filterBtn);
    app.appendChild(top);

    const grid = el('div',{class:'grid'});
    state.comics.forEach(c=>grid.appendChild(createCard(c)));
    app.appendChild(grid);

    search.addEventListener('input',(e)=>{ const q=e.target.value.toLowerCase(); grid.innerHTML=''; state.comics.filter(c=>c.title.toLowerCase().includes(q)||c.author.toLowerCase().includes(q)||c.genres.join(' ').toLowerCase().includes(q)).forEach(c=>grid.appendChild(createCard(c))); });
  }

  function renderBookmark(){
    app.innerHTML='';
    const title = el('h2',{class:'section-title'},'Komik Favorit Saya');
    app.appendChild(title);
    const grid = el('div',{class:'grid'});
    const bookmarked = state.comics.filter(c=>state.bookmarks.includes(c.id));
    if(bookmarked.length===0){ app.appendChild(el('div',{},'Belum ada bookmark')); return; }
    bookmarked.forEach(c=>grid.appendChild(createCard(c)));
    app.appendChild(grid);
  }

  function renderProfile(){
    app.innerHTML='';
    const box = el('div',{style:'padding:20px;background:var(--card);border-radius:10px'},[
      el('h3',{},'Profile (Demo)'),
      el('p',{}, `Bookmarks: ${state.bookmarks.length}`),
      el('p',{}, `Logged in: ${state.loggedInUser?state.loggedInUser.username:'Not logged'}`)
    ]);
    if(!state.loggedInUser){
      const loginBtn = el('button',{class:'btn small', onclick:()=>showAuth('login')},'Login / Register');
      box.appendChild(loginBtn);
    } else {
      const logout = el('button',{class:'btn small', onclick:()=>{ state.loggedInUser=null; saveLogin(); render(); }},'Logout');
      box.appendChild(logout);
    }
    app.appendChild(box);
  }

  function renderAdmin(){
    app.innerHTML='';
    // protect admin - simple demo: must be logged in and role admin
    if(!state.loggedInUser || state.loggedInUser.role !== 'admin'){
      const msg = el('div',{style:'padding:40px;text-align:center'},[
        el('h3',{},'🚫 Akses Ditolak'),
        el('p',{}, 'Hanya admin yang bisa akses halaman ini.'),
        el('button',{class:'btn', onclick:()=>showAuth('login')},'Login sebagai Admin')
      ]);
      app.appendChild(msg);
      return;
    }

    const header = el('div',{class:'section-title'}, el('h2',{},'Admin Dashboard - Upload Komik'));
    app.appendChild(header);

    // upload form (simple)
    const form = el('div',{class:'p-4',style:'background:var(--card);border-radius:8px'},[
      el('div',{},[
        el('label',{},'Judul Komik'),
        el('input',{class:'input',id:'upload-title',placeholder:'Judul'})
      ]),
      el('div',{},[
        el('label',{},'Author'),
        el('input',{class:'input',id:'upload-author',placeholder:'Author'})
      ]),
      el('div',{},[
        el('label',{},'Deskripsi'),
        el('textarea',{class:'input',id:'upload-desc',rows:4,placeholder:'Deskripsi'})
      ]),
      el('div',{style:'margin-top:8px'}, el('button',{class:'btn',onclick:handleUpload},'Publish Komik'))
    ]);
    app.appendChild(form);

    // Ads manager
    const adsSection = el('div',{class:'p-4',style:'margin-top:12px;background:var(--card);border-radius:8px'},[
      el('h3',{},'Kelola Iklan (Demo)'),
      ...state.ads.map(ad=>{
        const adRow = el('div',{style:'display:flex;justify-content:space-between;align-items:center;padding:8px;border-radius:6px;background:rgba(0,0,0,0.03);margin-bottom:8px'},[
          el('div',{},[el('strong',{},ad.name), el('div',{},`Posisi: ${ad.position}`)]),
          el('div',{},[
            el('button',{class:'small btn', onclick:()=>{ ad.active = !ad.active; render(); }}, ad.active ? 'Aktif':'Nonaktif'),
            el('button',{class:'small', onclick:()=>{ if(confirm('Hapus iklan?')){ state.ads = state.ads.filter(a=>a.id!==ad.id); render(); } }}, 'Hapus')
          ])
        ]);
        return adRow;
      })
    ]);
    app.appendChild(adsSection);
  }

  function handleUpload(){
    const title = document.getElementById('upload-title').value.trim();
    const author = document.getElementById('upload-author').value.trim();
    const desc = document.getElementById('upload-desc').value.trim();
    if(!title||!author||!desc){ alert('Isi semua field'); return; }
    const newComic = {
      id: state.comics.length+1,
      title, author, description:desc, cover:`https://picsum.photos/seed/comic${state.comics.length+1}/600/900`,
      rating:'0.0',views:0,likes:0,genres:[],chapters:[],lastUpdate:new Date().toISOString(),status:'Ongoing'
    };
    state.comics.unshift(newComic);
    alert('Upload berhasil (demo)');
    render();
  }

  function openDetail(comic){
    state.selectedComic = comic;
    app.innerHTML='';
    const backBtn = el('button',{class:'nav-btn', onclick:()=>{ state.currentPage='home'; render(); }},'← Kembali');
    app.appendChild(backBtn);

    const detail = el('div',{class:'detail'});
    const left = el('div',{class:'left'},[
      el('img',{src:comic.cover,alt:comic.title}),
      el('div',{}, el('button',{id:'bookmark-toggle',class:'btn small'}, state.bookmarks.includes(comic.id)?'Hapus Bookmark':'Bookmark'))
    ]);
    const right = el('div',{class:'right'},[
      el('h1',{},comic.title),
      el('p',{},`${comic.author} • ${comic.genres.join(', ')}`),
      el('p',{},comic.description),
      el('div',{class:'chapters'})
    ]);
    detail.appendChild(left); detail.appendChild(right);
    app.appendChild(detail);

    const chList = right.querySelector('.chapters');
    comic.chapters.slice().reverse().forEach(ch=>{
      const chEl = el('div',{class:'chapter-item'},[
        el('div',{},[ el('strong',{},ch.title), el('div',{},`${ch.pages} halaman`) ]),
        el('div',{}, el('button',{class:'btn small', onclick:()=>openReader(comic,ch)}, 'Baca') )
      ]);
      chList.appendChild(chEl);
    });

    // bookmark toggle
    document.getElementById('bookmark-toggle').addEventListener('click', ()=>{
      toggleBookmark(comic.id);
      document.getElementById('bookmark-toggle').textContent = state.bookmarks.includes(comic.id)?'Hapus Bookmark':'Bookmark';
    });
  }

  function toggleBookmark(id){
    if(state.bookmarks.includes(id)) state.bookmarks = state.bookmarks.filter(x=>x!==id);
    else state.bookmarks.push(id);
    saveBookmarks();
  }

  function openReader(comic, chapter){
    state.readingChapter = chapter;
    state.navigationCount++;
    if(state.navigationCount % 4 === 0){
      showInterstitial(()=>renderReader(comic,chapter));
    } else {
      renderReader(comic,chapter);
    }
  }

  function renderReader(comic, chapter){
    const reader = el('div',{class:'reader'});
    reader.innerHTML = `
      <div class="reader-head">
        <div><button id="reader-close" class="btn small">Kembali</button></div>
        <div><strong>${comic.title}</strong><div style="font-size:12px;color:var(--muted)">${chapter.title}</div></div>
        <div>Ch ${chapter.id}/${comic.chapters.length}</div>
      </div>
      <div class="content" id="reader-content"></div>
      <div class="bottom-nav">
        <button id="prev-ch" class="btn small">Prev Chapter</button>
        <button id="next-ch" class="btn small">Next Chapter</button>
      </div>
    `;
    document.body.appendChild(reader);
    const content = reader.querySelector('#reader-content');
    content.innerHTML='';
    for(let p=1;p<=chapter.pages;p++){
      const img = el('img',{class:'page-img',src:`https://picsum.photos/seed/comic${comic.id}ch${chapter.id}p${p}/1000/1400`,loading:'lazy'});
      content.appendChild(img);
    }
    reader.querySelector('#reader-close').addEventListener('click', ()=>reader.remove());
    reader.querySelector('#prev-ch').addEventListener('click', ()=>{
      if(chapter.id>1){
        const prev = comic.chapters.find(c=>c.id===chapter.id-1);
        reader.remove(); openReader(comic,prev);
      } else alert('Ini chapter pertama.');
    });
    reader.querySelector('#next-ch').addEventListener('click', ()=>{
      if(chapter.id < comic.chapters.length){
        const next = comic.chapters.find(c=>c.id===chapter.id+1);
        reader.remove(); openReader(comic,next);
      } else { alert('Ini chapter terakhir.'); reader.remove(); }
    });
  }

  // Interstitial ad simulation
  let adTimer = null;
  function showInterstitial(cb){
    interstitial.classList.remove('hidden');
    let countdown = 5;
    closeAdBtn.textContent = `Tutup (${countdown})`;
    closeAdBtn.disabled = true;
    adTimer = setInterval(()=>{
      countdown--;
      closeAdBtn.textContent = `Tutup (${countdown})`;
      if(countdown<=0){
        clearInterval(adTimer);
        closeAdBtn.textContent = 'Tutup';
        closeAdBtn.disabled = false;
      }
    },1000);
    closeAdBtn.onclick = ()=>{ interstitial.classList.add('hidden'); cb(); };
  }

  // Auth modal
  function showAuth(mode='login'){
    authModal.classList.remove('hidden');
    authInner.innerHTML = '';
    if(mode==='login'){
      authInner.appendChild(el('h3',{},'Login'));
      authInner.appendChild(el('div',{},el('input',{class:'input',id:'auth-username',placeholder:'Username'})));
      authInner.appendChild(el('div',{},el('input',{class:'input',id:'auth-password',placeholder:'Password',type:'password'})));
      authInner.appendChild(el('div',{},el('button',{class:'btn',onclick':()=>{ /* placeholder */ }},'Login')));
      // simpler handlers below
      const loginBtn = el('button',{class:'btn',onclick:()=>{ const u=document.getElementById('auth-username').value.trim(); const p=document.getElementById('auth-password').value.trim(); if(!u||!p){ alert('Isi username & password'); return; } const found = state.users.find(x=>x.username===u && x.password===p); if(found){ state.loggedInUser = found; saveLogin(); authModal.classList.add('hidden'); render(); } else { alert('User tidak ditemukan. Coba register.'); } }},'Login');
      authInner.appendChild(loginBtn);
      const regSwitch = el('button',{class:'small',onclick:()=>showRegister()},'Register');
      authInner.appendChild(regSwitch);
    } else {
      showRegister();
    }
  }

  function showRegister(){
    authInner.innerHTML='';
    authInner.appendChild(el('h3',{},'Register'));
    authInner.appendChild(el('input',{class:'input',id:'reg-username',placeholder:'Username'}));
    authInner.appendChild(el('input',{class:'input',id:'reg-name',placeholder:'Nama'}));
    authInner.appendChild(el('input',{class:'input',id:'reg-email',placeholder:'Email'}));
    authInner.appendChild(el('input',{class:'input',id:'reg-password',placeholder:'Password',type:'password'}));
    const regBtn = el('button',{class:'btn',onclick:()=>{ const u=document.getElementById('reg-username').value.trim(); const pw=document.getElementById('reg-password').value.trim(); const name=document.getElementById('reg-name').value.trim(); const email=document.getElementById('reg-email').value.trim(); if(!u||!pw||!name||!email){ alert('Semua field harus diisi'); return; } if(state.users.some(x=>x.username===u)){ alert('Username sudah ada'); return; } const newUser={id:state.users.length+1,username:u,password:pw,name,email,role:'user',avatar:'',joinDate:new Date().toISOString()}; state.users.push(newUser); saveUsers(); state.loggedInUser=newUser; saveLogin(); authModal.classList.add('hidden'); render(); }}, 'Register');
    authInner.appendChild(regBtn);
  }

  // Basic event wiring
  btnHome.addEventListener('click', ()=>{ state.currentPage='home'; render(); });
  btnExplore.addEventListener('click', ()=>{ state.currentPage='explore'; render(); });
  btnBookmark.addEventListener('click', ()=>{ state.currentPage='bookmark'; render(); });
  btnProfile.addEventListener('click', ()=>{ state.currentPage='profile'; render(); });
  btnAdmin.addEventListener('click', ()=>{ state.currentPage='admin'; render(); });

  toggleDark.addEventListener('click', ()=>{ state.dark = !state.dark; setTheme(state.dark); });

  // interstitial close fallback
  closeAdBtn.addEventListener('click', ()=>{ interstitial.classList.add('hidden'); });

  // init admin user if none
  if(!state.users.some(u=>u.username==='admin')){ state.users.push({id:1,username:'admin',password:'admin123',name:'Super Admin',email:'admin@hz.com',role:'admin',joinDate:new Date().toISOString()}); saveUsers(); }

  render();
})();
