// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Camera, Search, Plus, Trash2, Download, LogOut, Users, Store, Package, LayoutDashboard, FileUp, X, Check, AlertCircle, ScanLine, Boxes, Lock, ChevronLeft, Eye, EyeOff, Filter, ChevronRight, ClipboardList, ListPlus } from 'lucide-react';

// --- VERSIÓN DE LA APP ---
const APP_VERSION = "v1.4.0";

// --- INICIALIZACIÓN DE FIREBASE ---
const myFirebaseConfig = {
  apiKey: "AIzaSyAHJuYAOVPAghEOQjlqO-ZdnGMi_sk9hmg",
  authDomain: "[nexaapp-4f2f4.firebaseapp.com](http://nexaapp-4f2f4.firebaseapp.com/)",
  projectId: "nexaapp-4f2f4",
  storageBucket: "nexaapp-4f2f4.firebasestorage.app",
  messagingSenderId: "780963789506",
  appId: "1:780963789506:web:54ea3e67921872470e995b",
  measurementId: "G-7J51XR0NDD"
};

const isConfigMissing = myFirebaseConfig.apiKey === "TU_API_KEY" && typeof __firebase_config === 'undefined';

let app, auth, db;
if (!isConfigMissing) {
  const firebaseConfig = myFirebaseConfig.apiKey !== "TU_API_KEY" ? myFirebaseConfig : JSON.parse(__firebase_config);
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

const appId = typeof __app_id !== 'undefined' && __app_id ? __app_id : 'default-app-id';

// --- COMPONENTE ENVOLTORIO ---
export default function App() {
  // Ajuste de Título e Icono del navegador
  useEffect(() => {
    document.title = "NexaStock | Inventarios";
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/svg+xml';
    link.rel = 'icon';
    link.href = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%234f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>';
    document.getElementsByTagName('head')[0].appendChild(link);
  }, []);

  if (isConfigMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-800">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-200 max-w-md text-center">
          <AlertCircle size={56} className="text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Conexión Requerida</h2>
          <p className="text-slate-600 mb-6 text-sm">La aplicación necesita tus credenciales de Firebase.</p>
          <div className="text-sm text-slate-700 bg-slate-100 p-4 rounded-xl text-left border border-slate-200">
            Reemplaza <code>"TU_API_KEY"</code> en la línea 15.
          </div>
        </div>
      </div>
    );
  }
  return <MainApp />;
}

// --- COMPONENTE PRINCIPAL ---
function MainApp() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(() => {
    try { const saved = localStorage.getItem('nexastock_profile'); return saved ? JSON.parse(saved) : null; } 
    catch (e) { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [systemError, setSystemError] = useState(''); 

  const [usersList, setUsersList] = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const getCollectionRef = (colName) => collection(db, 'artifacts', appId, 'public', 'data', colName);
  const getDocRef = (colName, docId) => doc(db, 'artifacts', appId, 'public', 'data', colName, docId);

  const handleSetProfile = (p) => {
    setProfile(p);
    if (p) localStorage.setItem('nexastock_profile', JSON.stringify(p));
    else localStorage.removeItem('nexastock_profile');
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (err) { setSystemError(`Error de conexión: ${err.message}`); setLoading(false); }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) { setUser(u); setSystemError(''); }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubs = [];
    unsubs.push(onSnapshot(getCollectionRef('inv_users'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length === 0) {
        setDoc(getDocRef('inv_users', 'admin_1'), { name: 'Admin Principal', role: 'admin', password: 'admin' });
        setDoc(getDocRef('inv_users', 'rep_1'), { name: 'Juan Perez', role: 'rep', password: '1234' });
      }
      setUsersList(data);
    }, (err) => setSystemError(`Error BD: ${err.message}`)));

    unsubs.push(onSnapshot(getCollectionRef('inv_stores'), (snap) => {
      setStoresList(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }));

    unsubs.push(onSnapshot(getCollectionRef('inv_products'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length === 0) {
        setDoc(getDocRef('inv_products', 'prod_1'), { name: 'Aspirina 500mg', barcode: '111222' });
        setDoc(getDocRef('inv_products', 'prod_2'), { name: 'Paracetamol 1g', barcode: '333444' });
      }
      setProductsList(data);
    }));

    unsubs.push(onSnapshot(getCollectionRef('inv_submissions'), (snap) => {
      setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp));
    }));

    if (!document.getElementById('html5-qrcode-script')) {
      const script = document.createElement('script');
      script.id = 'html5-qrcode-script';
      script.src = 'https://unpkg.com/html5-qrcode';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => unsubs.forEach(unsub => unsub());
  }, [user]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!profile) return <LoginScreen usersList={usersList} onSelectProfile={handleSetProfile} systemError={systemError} />;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Header Alto Contraste */}
      <header className="bg-indigo-700 text-white p-4 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
              {profile.role === 'admin' ? <LayoutDashboard size={22} className="text-white" /> : <Store size={22} className="text-white" />}
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                {profile.role === 'admin' ? 'Panel Control' : 'NexaStock'}
                <span className="bg-indigo-900/50 text-indigo-100 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider">{APP_VERSION}</span>
              </h1>
              <p className="text-xs text-indigo-200 font-medium truncate max-w-[150px] sm:max-w-none">Sesión: {profile.name}</p>
            </div>
          </div>
          <button onClick={() => handleSetProfile(null)} className="bg-indigo-800 p-2.5 rounded-xl hover:bg-rose-500 hover:text-white transition-colors shadow-sm" title="Cerrar Sesión">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Área Principal */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-0 md:p-4 pb-24 md:pb-6 relative">
        {systemError && (
          <div className="m-4 mb-2 md:m-0 md:mb-6 bg-rose-50 text-rose-800 p-4 rounded-2xl shadow-sm flex items-start gap-3 border border-rose-200">
            <AlertCircle className="shrink-0 mt-0.5 text-rose-500" />
            <p className="text-sm font-bold">{systemError}</p>
          </div>
        )}

        {profile.role === 'admin' ? (
          <AdminDashboard submissions={submissions} stores={storesList} products={productsList} users={usersList} getCollectionRef={getCollectionRef} getDocRef={getDocRef} />
        ) : (
          <RepApp profile={profile} stores={storesList} products={productsList} getCollectionRef={getCollectionRef} />
        )}
      </main>
    </div>
  );
}

// --- PANTALLA DE INICIO DE SESIÓN ---
function LoginScreen({ usersList, onSelectProfile, systemError }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const filteredUsers = usersList.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleLogin = (e) => {
    e.preventDefault();
    setPassError('');
    const validPassword = selectedUser.password || '1234';
    if (password === validPassword) onSelectProfile(selectedUser);
    else setPassError('Contraseña incorrecta.');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md z-10">
        {systemError && (
          <div className="mb-6 bg-rose-100 border border-rose-300 p-4 rounded-2xl text-rose-800 text-sm flex items-start gap-3 shadow-sm">
             <AlertCircle size={20} className="shrink-0 text-rose-600" />
             <p className="font-medium"><b>Aviso:</b> <br/>{systemError}</p>
          </div>
        )}

        <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-200">
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="bg-indigo-100 p-4 rounded-2xl border border-indigo-200">
                <Boxes size={48} className="text-indigo-600" />
                <ScanLine size={24} className="absolute -bottom-2 -right-2 text-emerald-600 bg-white rounded-lg p-0.5 border border-slate-200 shadow-sm" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">NexaStock</h2>
            <p className="text-slate-500 text-sm font-bold mt-1 tracking-wide uppercase">Ingreso al Sistema</p>
          </div>

          {!selectedUser ? (
            <div className="animate-fade-in">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input 
                  type="text" placeholder="Buscar mi usuario..." 
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-900 font-medium transition-all shadow-inner"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {filteredUsers.length === 0 ? (
                  <div className="text-center text-slate-500 font-medium py-6 text-sm">{systemError ? 'Esperando conexión...' : 'No se encontraron usuarios.'}</div>
                ) : (
                  filteredUsers.map(u => (
                    <button key={u.id} onClick={() => setSelectedUser(u)} className="w-full text-left p-4 rounded-2xl border border-slate-200 bg-white hover:border-indigo-600 hover:bg-indigo-50 transition-all flex items-center gap-4 group shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        {u.role === 'admin' ? <Users size={20} /> : <Store size={20} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-slate-800 text-lg leading-tight">{u.name}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{u.role === 'admin' ? 'Administrador' : 'Vendedor'}</p>
                      </div>
                      <ChevronRight size={20} className="text-slate-400 group-hover:text-indigo-600" />
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="animate-fade-in-up">
              <button onClick={() => {setSelectedUser(null); setPassword(''); setPassError('');}} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 font-bold text-sm mb-6 transition-colors">
                <ChevronLeft size={18} /> Cambiar usuario
              </button>
              
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6 shadow-inner">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  {selectedUser.role === 'admin' ? <Users size={20} /> : <Store size={20} />}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Hola,</p>
                  <p className="font-black text-slate-900 text-xl">{selectedUser.name}</p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Clave de Acceso</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input 
                      type={showPassword ? "text" : "password"} placeholder="••••••••" 
                      className={`w-full pl-11 pr-12 py-3.5 bg-white border ${passError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 focus:ring-indigo-600'} rounded-xl outline-none text-slate-900 font-bold tracking-widest shadow-sm`}
                      value={password} onChange={(e) => setPassword(e.target.value)} autoFocus
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {passError && <p className="text-rose-600 text-sm mt-2 font-bold flex items-center gap-1"><AlertCircle size={16}/> {passError}</p>}
                </div>
                <button type="submit" disabled={!password} className="w-full py-4 rounded-xl font-black text-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200">
                  Ingresar
                </button>
              </form>
            </div>
          )}
        </div>
        <p className="text-center text-slate-400 mt-6 text-xs font-bold tracking-widest">VERSIÓN {APP_VERSION}</p>
      </div>
    </div>
  );
}

// --- VISTA DEL VENDEDOR (SELECCIÓN DE RUTA) ---
function RepApp({ profile, stores, products, getCollectionRef }) {
  const [selectedStore, setSelectedStore] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const myStores = stores.filter(s => s.assignedTo === profile.id || s.assignedTo === profile.name);
  const filteredStores = myStores.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (selectedStore) return <InventoryForm store={selectedStore} products={products} profile={profile} getCollectionRef={getCollectionRef} onBack={() => setSelectedStore(null)} />;

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-20 p-4 md:p-0">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-slate-900 mb-2">Tus Farmacias</h2>
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
          <input type="text" placeholder="Buscar por nombre..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-medium text-slate-800" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {myStores.length === 0 ? (
          <div className="bg-amber-50 text-amber-800 p-6 rounded-3xl border border-amber-200 text-center">
            <AlertCircle size={32} className="mx-auto mb-3 text-amber-500" />
            <h3 className="font-bold text-lg mb-1">Sin rutas asignadas</h3>
            <p className="text-sm font-medium">Solicita al administrador que te asigne farmacias.</p>
          </div>
        ) : filteredStores.length === 0 ? (
          <p className="text-center text-slate-500 py-10 font-bold">No se encontraron resultados.</p>
        ) : (
          filteredStores.map(store => (
            <div key={store.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 hover:border-indigo-400 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg leading-tight">{store.name}</h3>
                  <p className="text-sm text-slate-500 font-medium mt-1 truncate max-w-[200px]">{store.address || 'Sin dirección'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedStore(store)} className="w-full sm:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors text-center">
                Inventariar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- FORMULARIO DE INVENTARIO (DOS PESTAÑAS MEJORADAS) ---
function InventoryForm({ store, products, profile, getCollectionRef, onBack }) {
  const [items, setItems] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' o 'cart'

  // Si no hay búsqueda, muestra todos los productos (Catálogo Intuitivo)
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(searchTerm)));

  const handleAddProduct = (product, qtyStr) => {
    setErrorMsg('');
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty <= 0) return setErrorMsg(`Cantidad inválida para ${product.name}`);
    if (items.some(i => i.product.id === product.id)) return setErrorMsg(`${product.name} ya está en la lista.`);
    
    setItems([{ product, qty }, ...items]);
    setSearchTerm(''); 
    setActiveTab('cart'); // Mueve al usuario al carrito para que vea lo que agregó
  };

  const handleSubmit = async () => {
    if (items.length === 0) return setErrorMsg("La lista está vacía.");
    setIsSubmitting(true);
    try {
      await addDoc(getCollectionRef('inv_submissions'), {
        repId: profile.id, repName: profile.name, storeId: store.id, storeName: store.name,
        timestamp: Date.now(), dateString: new Date().toLocaleDateString(),
        items: items.map(i => ({ productId: i.product.id, productName: i.product.name, quantity: i.qty }))
      });
      alert("¡Inventario enviado con éxito!"); 
      onBack();
    } catch (err) { setErrorMsg("Error de red al guardar."); setIsSubmitting(false); }
  };

  const onScanSuccess = (decodedText) => {
    setShowScanner(false);
    setSearchTerm(decodedText);
    const found = products.find(p => p.barcode === decodedText);
    if (found) { setSearchTerm(found.name); setActiveTab('catalog'); }
    else setErrorMsg(`Código ${decodedText} no existe.`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-lg mx-auto bg-slate-100 relative">
      <div className="bg-white pt-4 px-4 pb-0 rounded-b-3xl shadow-sm border-b border-slate-200 shrink-0 z-10 sticky top-0">
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md mb-1 block w-fit">En Tienda</span>
            <h2 className="text-2xl font-black text-slate-900 leading-tight">{store.name}</h2>
          </div>
          <button onClick={onBack} className="text-slate-500 hover:bg-slate-100 p-2 rounded-full border border-slate-200">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-rose-50 text-rose-800 p-3 rounded-xl text-sm font-bold flex items-center gap-2 border border-rose-200">
            <AlertCircle size={18} className="shrink-0 text-rose-500" /> <p>{errorMsg}</p>
          </div>
        )}

        {/* Pestañas (Tabs) */}
        <div className="flex border-b border-slate-200">
          <button onClick={() => setActiveTab('catalog')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'catalog' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <ListPlus size={18}/> Catálogo
          </button>
          <button onClick={() => setActiveTab('cart')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'cart' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <ClipboardList size={18}/> Lista <span className="bg-slate-200 text-slate-700 px-1.5 rounded-md text-xs">{items.length}</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-28">
        {activeTab === 'catalog' ? (
          <div className="space-y-4 animate-fade-in">
            <div className="flex gap-2 sticky top-0 z-10 bg-slate-100 pb-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                <input type="text" placeholder="Buscar producto..." className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none font-bold text-slate-800 shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={() => setShowScanner(true)} className="bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-indigo-600 shadow-md shrink-0">
                <Camera size={22} />
              </button>
            </div>
            
            {filteredProducts.length === 0 ? <p className="text-center font-bold text-slate-400 py-10">Sin resultados.</p> : (
              <div className="space-y-3">
                {filteredProducts.map(p => (
                  <div key={p.id} className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-slate-800 text-sm leading-tight">{p.name}</p>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">Cod: {p.barcode || 'S/N'}</p>
                    </div>
                    <input type="number" id={`qty-${p.id}`} placeholder="0" min="1" className="w-16 h-11 border border-slate-200 bg-slate-50 rounded-xl text-center font-black text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none" />
                    <button onClick={() => handleAddProduct(p, document.getElementById(`qty-${p.id}`).value)} className="bg-indigo-100 text-indigo-700 w-11 h-11 rounded-xl hover:bg-indigo-600 hover:text-white flex items-center justify-center font-bold transition-colors shrink-0">
                      <Plus size={20} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3 animate-fade-in">
            {items.length === 0 ? (
              <div className="text-center py-16 opacity-60">
                <ClipboardList size={64} className="mx-auto mb-4 text-slate-400" />
                <p className="font-bold text-slate-600 text-lg">Tu lista está vacía</p>
                <p className="text-sm font-medium text-slate-500 mt-1">Ve al catálogo para agregar productos.</p>
                <button onClick={() => setActiveTab('catalog')} className="mt-4 bg-white border border-slate-300 text-slate-700 px-6 py-2 rounded-full font-bold shadow-sm">Ir al Catálogo</button>
              </div>
            ) : (
              items.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
                  <div>
                    <p className="font-black text-slate-800 text-sm">{item.product.name}</p>
                    {/* SOLUCIÓN AL PUNTO 8: Columna clara de cantidad */}
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cant:</span>
                      <span className="bg-slate-100 text-slate-800 font-black text-sm px-2 py-0.5 rounded-lg border border-slate-200">{item.qty}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveItem(item.product.id)} className="text-rose-500 bg-rose-50 p-2 hover:bg-rose-100 rounded-xl">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-200 md:max-w-lg md:mx-auto z-20">
        <button 
          onClick={handleSubmit} disabled={items.length === 0 || isSubmitting}
          className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all shadow-lg
            ${items.length === 0 || isSubmitting ? 'bg-slate-200 text-slate-400 shadow-none' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
        >
          {isSubmitting ? 'Enviando...' : <><Check size={24} strokeWidth={3} /> Enviar Reporte</>}
        </button>
      </div>

      {showScanner && <BarcodeScannerModal onClose={() => setShowScanner(false)} onScan={onScanSuccess} />}
    </div>
  );
}

// --- MODAL DE ESCÁNER (MOTOR SEGURO) ---
function BarcodeScannerModal({ onClose, onScan }) {
  const [error, setError] = useState('');

  useEffect(() => {
    let html5QrCode;
    const initScanner = async () => {
      const el = document.getElementById('qr-reader');
      if (!el || !window.Html5Qrcode) return setTimeout(initScanner, 500);

      html5QrCode = new window.Html5Qrcode("qr-reader");
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      const successCb = (text) => { html5QrCode.stop().then(() => onScan(text)).catch(e => console.error(e)); };

      try {
        // Intento 1: Cámara trasera explícita (Mobile)
        await html5QrCode.start({ facingMode: "environment" }, config, successCb, ()=>{});
      } catch (err1) {
        try {
          // Intento 2: Cualquier cámara disponible
          const devices = await window.Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            await html5QrCode.start(devices[0].id, config, successCb, ()=>{});
          } else throw new Error("No cámaras");
        } catch (err2) {
          setError("Acceso a cámara denegado o no disponible.");
        }
      }
    };
    initScanner();
    return () => { if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop().catch(()=>{}); };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex flex-col">
      <div className="p-4 flex justify-between items-center text-white">
        <h3 className="font-bold">Escanear</h3>
        <button onClick={onClose} className="p-2 bg-white/20 rounded-full"><X size={20} /></button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        {error ? (
          <div className="text-rose-400 bg-rose-500/10 p-6 rounded-3xl text-center font-bold max-w-xs border border-rose-500/20"><AlertCircle className="mx-auto mb-2" size={32} />{error}</div>
        ) : (
          <div id="qr-reader" className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-black aspect-square border-2 border-slate-700"></div>
        )}
      </div>
      <div className="p-8 text-center text-slate-300 font-medium text-sm">Ubique el código en el recuadro.</div>
    </div>
  );
}

// --- PANEL DE CONTROL ADMINISTRADOR ---
function AdminDashboard({ submissions, stores, products, users, getCollectionRef, getDocRef }) {
  const [activeTab, setActiveTab] = useState('live'); 

  // SOLUCIÓN PUNTO 11: Scroll al inicio al cambiar pestaña
  useEffect(() => { window.scrollTo(0,0); }, [activeTab]);

  return (
    <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[100vh] md:min-h-[80vh] relative">
      
      {/* Contenido */}
      <div className="flex-1 p-4 md:p-8 bg-slate-50/50 pb-28 md:pb-8">
        {activeTab === 'live' && <AdminLiveView submissions={submissions} />}
        {activeTab === 'stores' && <CatalogManager title="Farmacias" col="inv_stores" data={stores} fields={[{k: 'name', l: 'Nombre'}, {k: 'address', l: 'Dirección'}, {k: 'assignedTo', l: 'Vendedor'}]} getRef={getCollectionRef} getDoc={getDocRef} />}
        {activeTab === 'products' && <CatalogManager title="Productos" col="inv_products" data={products} fields={[{k: 'name', l: 'Producto'}, {k: 'barcode', l: 'Cód. Barras'}]} getRef={getCollectionRef} getDoc={getDocRef} />}
        {activeTab === 'users' && <CatalogManager title="Personal" col="inv_users" data={users} fields={[{k: 'name', l: 'Nombre'}, {k: 'role', l: 'Rol (admin/rep)'}, {k: 'password', l: 'Clave'}]} getRef={getCollectionRef} getDoc={getDocRef} />}
      </div>

      {/* SOLUCIÓN PUNTO 10: Barra inferior verdaderamente fija en móviles */}
      <div className="fixed md:absolute bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 md:p-3 flex justify-around items-center shadow-[0_-10px_30px_rgba(0,0,0,0.05)] z-50">
        <TabButton icon={<LayoutDashboard size={20}/>} label="En Vivo" active={activeTab === 'live'} onClick={() => setActiveTab('live')} />
        <TabButton icon={<Store size={20}/>} label="Rutas" active={activeTab === 'stores'} onClick={() => setActiveTab('stores')} />
        <TabButton icon={<Package size={20}/>} label="Stock" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
        <TabButton icon={<Users size={20}/>} label="Equipo" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 w-16 md:w-24 rounded-2xl transition-all ${active ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}>
      <div className={`${active ? 'bg-indigo-100 p-2 rounded-xl scale-110 shadow-sm' : 'p-2'}`}>{icon}</div>
      <span className="text-[10px] md:text-xs font-bold">{label}</span>
    </button>
  );
}

// --- VISTA EN VIVO CON FILTROS DESPLEGABLES Y DETALLE (Puntos 9 y 12) ---
function AdminLiveView({ submissions }) {
  const [filterStore, setFilterStore] = useState('');
  const [filterRep, setFilterRep] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSub, setSelectedSub] = useState(null); // Para el desglose

  // SOLUCIÓN PUNTO 9: Listas únicas para los Selects
  const uniqueStores = [...new Set(submissions.map(s => s.storeName))].filter(Boolean);
  const uniqueReps = [...new Set(submissions.map(s => s.repName))].filter(Boolean);
  const uniqueDates = [...new Set(submissions.map(s => new Date(s.timestamp).toISOString().split('T')[0]))].filter(Boolean);

  const filteredData = submissions.filter(sub => {
    const matchStore = filterStore ? sub.storeName === filterStore : true;
    const matchRep = filterRep ? sub.repName === filterRep : true;
    const matchDate = filterDate ? new Date(sub.timestamp).toISOString().split('T')[0] === filterDate : true;
    return matchStore && matchRep && matchDate;
  });

  const activeFiltersCount = (filterStore ? 1 : 0) + (filterRep ? 1 : 0) + (filterDate ? 1 : 0);

  // VISTA DE DETALLE (PUNTO 12)
  if (selectedSub) {
    return (
      <div className="space-y-6 animate-fade-in">
        <button onClick={() => setSelectedSub(null)} className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 px-4 py-2 rounded-xl w-fit hover:bg-indigo-100">
          <ChevronLeft size={18} /> Volver al resumen
        </button>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
          <h2 className="text-2xl font-black text-slate-900 mb-4">{selectedSub.storeName}</h2>
          <div className="flex flex-wrap gap-4 mb-6">
            <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2"><Users size={16}/> {selectedSub.repName}</span>
            <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2"><LayoutDashboard size={16}/> {new Date(selectedSub.timestamp).toLocaleString()}</span>
          </div>
          <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-3">Productos Escaneados</h3>
          <div className="space-y-2">
            {selectedSub.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="font-bold text-slate-800">{item.productName}</span>
                <span className="font-black text-indigo-700 bg-indigo-100 px-3 py-1 rounded-lg">Cant: {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // VISTA RESUMEN GENERAL
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Actividad Reciente</h2>
          <p className="text-sm text-slate-500 font-medium">Toca un registro para ver el detalle de productos.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setShowFilters(!showFilters)} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-all border ${showFilters || activeFiltersCount > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600'}`}>
            <Filter size={18} /> Filtros {activeFiltersCount > 0 && <span className="bg-indigo-600 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">{activeFiltersCount}</span>}
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm animate-fade-in-up">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Farmacia</label>
            <select value={filterStore} onChange={e => setFilterStore(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todas las farmacias</option>
              {uniqueStores.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vendedor</label>
            <select value={filterRep} onChange={e => setFilterRep(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todos los vendedores</option>
              {uniqueReps.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha</label>
            <select value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Cualquier fecha</option>
              {uniqueDates.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
        </div>
      )}

      {/* SOLUCIÓN PUNTO 6 y 12: Tarjetas Resumen en Móvil, Tabla en Desktop */}
      <div className="grid grid-cols-1 md:hidden gap-3">
        {filteredData.length === 0 ? <p className="text-center p-10 font-bold text-slate-400">Sin registros.</p> : (
          filteredData.map(sub => (
            <div key={sub.id} onClick={() => setSelectedSub(sub)} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-3 active:scale-95 transition-transform">
              <div className="flex justify-between items-start">
                <h3 className="font-black text-slate-900 leading-tight">{sub.storeName}</h3>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md text-xs font-bold shrink-0">{sub.items.length} items</span>
              </div>
              <div className="flex justify-between items-center mt-2 border-t border-slate-100 pt-3">
                <span className="text-sm font-bold text-slate-600 flex items-center gap-1"><Users size={14}/> {sub.repName}</span>
                <span className="text-xs font-bold text-slate-400">{new Date(sub.timestamp).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block border border-slate-200 rounded-3xl overflow-hidden shadow-sm bg-white">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <th className="p-4 font-bold uppercase text-xs">Fecha / Hora</th>
              <th className="p-4 font-bold uppercase text-xs">Vendedor</th>
              <th className="p-4 font-bold uppercase text-xs">Farmacia</th>
              <th className="p-4 font-bold uppercase text-xs">Acción</th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? <tr><td colSpan="4" className="p-10 text-center font-bold text-slate-400">Sin registros.</td></tr> : (
              filteredData.map(sub => (
                <tr key={sub.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-4"><div className="font-bold text-slate-800">{new Date(sub.timestamp).toLocaleDateString()}</div><div className="text-xs text-slate-400">{new Date(sub.timestamp).toLocaleTimeString()}</div></td>
                  <td className="p-4 font-bold text-slate-700">{sub.repName}</td>
                  <td className="p-4 font-bold text-slate-900">{sub.storeName}</td>
                  <td className="p-4"><button onClick={() => setSelectedSub(sub)} className="bg-indigo-50 text-indigo-600 font-bold px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors">Ver Detalles ({sub.items.length})</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- GESTOR DE CATÁLOGOS (TARJETAS EN MÓVIL) ---
function CatalogManager({ title, col, data, fields, getRef, getDoc }) {
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase())));

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await updateDoc(getDoc(col, editingId), formData);
      else await addDoc(getRef(col), formData);
      setFormData({}); setEditingId(null);
    } catch (err) { alert("Error al guardar."); }
  };
  const handleDelete = async (id) => { if(confirm('¿Eliminar registro?')) await deleteDoc(getDoc(col, id)); };
  const handleEdit = (item) => { setFormData(item); setEditingId(item.id); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
        <div><h2 className="text-2xl font-black text-slate-900">{title}</h2></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm h-fit">
          <h3 className="font-black text-slate-800 mb-5">{editingId ? 'Editando Registro' : 'Nuevo Registro'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            {fields.map(f => (
              <div key={f.k}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{f.l}</label>
                <input type="text" required value={formData[f.k] || ''} onChange={e => setFormData({...formData, [f.k]: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 bg-slate-50" />
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700">{editingId ? 'Actualizar' : 'Guardar'}</button>
              {editingId && <button type="button" onClick={() => {setEditingId(null); setFormData({});}} className="px-5 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold">Cancelar</button>}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold shadow-sm" />
          </div>

          {/* Versión Móvil: Tarjetas (PUNTO 6) */}
          <div className="grid grid-cols-1 md:hidden gap-3">
            {filteredData.length === 0 ? <p className="text-center p-10 font-bold text-slate-400">Sin datos.</p> : (
              filteredData.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                  {fields.map(f => (
                    <div key={f.k} className="mb-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">{f.l}</span>
                      <span className="font-bold text-slate-800">{f.k === 'password' ? '••••••••' : item[f.k]}</span>
                    </div>
                  ))}
                  <div className="flex justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button onClick={() => handleEdit(item)} className="text-indigo-600 font-bold bg-indigo-50 px-4 py-2 rounded-xl">Editar</button>
                    <button onClick={() => handleDelete(item.id)} className="text-rose-500 font-bold bg-rose-50 p-2 rounded-xl"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Versión Desktop: Tabla */}
          <div className="hidden md:block border border-slate-200 rounded-3xl overflow-hidden shadow-sm bg-white">
            <table className="w-full text-left border-collapse text-sm">
              <thead><tr className="bg-slate-50 text-slate-500 border-b border-slate-200">{fields.map(f => <th key={f.k} className="p-4 font-bold uppercase text-xs">{f.l}</th>)}<th className="p-4"></th></tr></thead>
              <tbody>
                {filteredData.map(item => (
                  <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50">
                    {fields.map(f => <td key={f.k} className="p-4 font-bold text-slate-700">{f.k === 'password' ? '••••••••' : item[f.k]}</td>)}
                    <td className="p-4 flex justify-end gap-2">
                      <button onClick={() => handleEdit(item)} className="text-indigo-600 font-bold bg-indigo-50 px-3 py-1.5 rounded-lg">Editar</button>
                      <button onClick={() => handleDelete(item.id)} className="text-rose-500 bg-rose-50 p-1.5 rounded-lg"><Trash2 size={18}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}