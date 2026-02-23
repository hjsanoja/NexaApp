// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Camera, Search, Plus, Trash2, Download, LogOut, Users, Store, Package, LayoutDashboard, FileUp, X, Check, AlertCircle, ScanLine, Boxes, Lock, ChevronLeft, Eye, EyeOff } from 'lucide-react';

// --- VERSIÓN DE LA APP ---
const APP_VERSION = "v1.2.0";

// --- INICIALIZACIÓN DE FIREBASE ---
const myFirebaseConfig = {
  apiKey: "AIzaSyAHJuYAOVPAghEOQjlqO-ZdnGMi_sk9hmg",
  authDomain: "nexaapp-4f2f4.firebaseapp.com",
  projectId: "nexaapp-4f2f4",
  storageBucket: "nexaapp-4f2f4.firebasestorage.app",
  messagingSenderId: "780963789506",
  appId: "1:780963789506:web:54ea3e67921872470e995b",
  measurementId: "G-7J51XR0NDD"
};

const isConfigMissing = myFirebaseConfig.apiKey === "TU_API_KEY" && typeof __firebase_config === 'undefined';

let app, auth, db;
if (!isConfigMissing) {
  const firebaseConfig = myFirebaseConfig.apiKey !== "TU_API_KEY" 
    ? myFirebaseConfig 
    : JSON.parse(__firebase_config);

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

const appId = typeof __app_id !== 'undefined' && __app_id ? __app_id : 'default-app-id';

// --- COMPONENTE ENVOLTORIO ---
export default function App() {
  if (isConfigMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans text-slate-100">
        <div className="bg-slate-800 p-8 rounded-3xl shadow-2xl border border-slate-700 max-w-md text-center">
          <AlertCircle size={56} className="text-rose-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Conexión Requerida</h2>
          <p className="text-slate-400 mb-6 text-sm">
            La aplicación necesita tus credenciales de Firebase para funcionar correctamente y cargar la nueva interfaz.
          </p>
          <div className="text-sm text-slate-300 bg-slate-900/50 p-4 rounded-xl text-left border border-slate-700">
            Reemplaza <code>"TU_API_KEY"</code> y los demás valores en la línea 12 de tu código.
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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [systemError, setSystemError] = useState(''); 

  const [usersList, setUsersList] = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  const getCollectionRef = (colName) => collection(db, 'artifacts', appId, 'public', 'data', colName);
  const getDocRef = (colName, docId) => doc(db, 'artifacts', appId, 'public', 'data', colName, docId);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Error auth:", err);
        setSystemError(`Error de conexión: ${err.message}`);
        setLoading(false);
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setSystemError('');
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubs = [];
    
    // Usuarios
    unsubs.push(onSnapshot(getCollectionRef('inv_users'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length === 0) {
        setDoc(getDocRef('inv_users', 'admin_1'), { name: 'Admin Principal', role: 'admin', password: 'admin' });
        setDoc(getDocRef('inv_users', 'rep_1'), { name: 'Juan Perez', role: 'rep', password: '1234' });
        setDoc(getDocRef('inv_users', 'rep_2'), { name: 'Maria Lopez', role: 'rep', password: '1234' });
      }
      setUsersList(data);
    }, (err) => setSystemError(`Error BD: ${err.message}`)));

    // Tiendas
    unsubs.push(onSnapshot(getCollectionRef('inv_stores'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length === 0) {
        setDoc(getDocRef('inv_stores', 'store_1'), { name: 'Farmacia San Juan', address: 'Centro', assignedTo: 'Juan Perez' });
        setDoc(getDocRef('inv_stores', 'store_2'), { name: 'Farmacia Central', address: 'Av. Bolívar', assignedTo: 'Juan Perez' });
      }
      setStoresList(data);
    }));

    // Productos
    unsubs.push(onSnapshot(getCollectionRef('inv_products'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (data.length === 0) {
        setDoc(getDocRef('inv_products', 'prod_1'), { name: 'Aspirina 500mg', barcode: '111222' });
        setDoc(getDocRef('inv_products', 'prod_2'), { name: 'Paracetamol 1g', barcode: '333444' });
      }
      setProductsList(data);
    }));

    // Entregas
    unsubs.push(onSnapshot(getCollectionRef('inv_submissions'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp);
      setSubmissions(data);
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
    <div className="flex h-screen items-center justify-center bg-slate-900">
      <div className="animate-spin rounded-full h-14 w-14 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
  );

  if (!profile) {
    return <LoginScreen usersList={usersList} onSelectProfile={setProfile} systemError={systemError} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-indigo-500 selection:text-white">
      {/* Header Estilizado */}
      <header className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-4 shadow-lg sticky top-0 z-10 border-b border-indigo-500/30">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/20 p-2 rounded-xl backdrop-blur-sm border border-indigo-500/30">
              {profile.role === 'admin' ? <LayoutDashboard size={22} className="text-indigo-300" /> : <Store size={22} className="text-indigo-300" />}
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                {profile.role === 'admin' ? 'Panel de Control' : 'NexaStock'}
                <span className="bg-indigo-500/30 text-indigo-200 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wider border border-indigo-500/20">{APP_VERSION}</span>
              </h1>
              <p className="text-xs text-indigo-200/70 font-medium">{profile.role === 'admin' ? 'Modo Administrador' : 'Modo Vendedor'}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-2">
              <span className="text-sm font-semibold">{profile.name}</span>
              <span className="text-xs text-indigo-300">Conectado</span>
            </div>
            <button 
              onClick={() => setProfile(null)} 
              className="bg-white/10 p-2.5 rounded-xl hover:bg-rose-500 hover:text-white transition-all duration-300 border border-white/5 shadow-sm"
              title="Cerrar Sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* Área Principal */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-3 sm:p-6">
        {systemError && (
          <div className="mb-6 bg-rose-50 text-rose-800 p-4 rounded-2xl shadow-sm flex items-start gap-3 border border-rose-200">
            <AlertCircle className="shrink-0 mt-0.5 text-rose-500" />
            <p className="text-sm font-medium">{systemError}</p>
          </div>
        )}

        {profile.role === 'admin' ? (
          <AdminDashboard 
            submissions={submissions} 
            stores={storesList} 
            products={productsList} 
            users={usersList} 
            getCollectionRef={getCollectionRef}
            getDocRef={getDocRef}
          />
        ) : (
          <RepApp 
            profile={profile} 
            stores={storesList} 
            products={productsList} 
            getCollectionRef={getCollectionRef}
          />
        )}
      </main>
    </div>
  );
}

// --- PANTALLA DE INICIO DE SESIÓN (REDISEÑADA CON CLAVE) ---
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
    // Validar clave (Si no tiene clave en BD, permite '1234' por defecto temporalmente)
    const validPassword = selectedUser.password || '1234';
    
    if (password === validPassword) {
      onSelectProfile(selectedUser);
    } else {
      setPassError('Contraseña incorrecta. Intente de nuevo.');
    }
  };

  const resetSelection = () => {
    setSelectedUser(null);
    setPassword('');
    setPassError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 relative overflow-hidden">
      {/* Fondo decorativo moderno */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-md z-10">
        {systemError && (
          <div className="mb-6 bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl text-rose-200 text-sm flex items-start gap-3 backdrop-blur-sm">
             <AlertCircle size={20} className="shrink-0 text-rose-400" />
             <p><b>Aviso del Sistema:</b> <br/>{systemError}</p>
          </div>
        )}

        <div className="bg-slate-800/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-slate-700/50">
          
          {/* Cabecera / Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4 group">
              <div className="absolute inset-0 bg-indigo-500 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-500"></div>
              <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-2xl border border-slate-700">
                <Boxes size={48} className="text-indigo-400" />
                <ScanLine size={24} className="absolute -bottom-2 -right-2 text-emerald-400 bg-slate-800 rounded-lg p-0.5 border border-slate-700" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight">NexaStock</h2>
            <p className="text-slate-400 text-sm font-medium mt-1 tracking-wide uppercase">Sistema de Control</p>
          </div>

          {/* PASO 1: SELECCIONAR USUARIO */}
          {!selectedUser ? (
            <div className="animate-fade-in">
              <div className="relative mb-6">
                <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar mi usuario..." 
                  className="w-full pl-11 pr-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-white placeholder-slate-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {filteredUsers.length === 0 ? (
                  <div className="text-center text-slate-500 py-6 text-sm">
                    {systemError ? 'Esperando conexión...' : 'No se encontraron usuarios.'}
                  </div>
                ) : (
                  filteredUsers.map(u => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className="w-full text-left p-4 rounded-2xl border border-slate-700/50 bg-slate-800/50 hover:border-indigo-500/50 hover:bg-indigo-500/10 transition-all duration-300 flex items-center gap-4 group"
                    >
                      <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors shadow-inner border border-slate-600 group-hover:border-indigo-400">
                        {u.role === 'admin' ? <Users size={20} /> : <Store size={20} />}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-200 group-hover:text-white transition-colors text-lg">{u.name}</p>
                        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{u.role === 'admin' ? 'Administrador' : 'Vendedor'}</p>
                      </div>
                      <div className="text-slate-600 group-hover:text-indigo-400">
                        <Lock size={18} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* PASO 2: INGRESAR CONTRASEÑA */
            <div className="animate-fade-in-up">
              <button 
                onClick={resetSelection}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors"
              >
                <ChevronLeft size={16} /> Volver a la lista
              </button>
              
              <div className="flex items-center gap-4 p-4 bg-slate-900/50 rounded-2xl border border-slate-700 mb-6">
                <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                  {selectedUser.role === 'admin' ? <Users size={20} /> : <Store size={20} />}
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Ingresando como</p>
                  <p className="font-bold text-white text-lg">{selectedUser.name}</p>
                </div>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 text-slate-500" size={18} />
                    <input 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      className={`w-full pl-11 pr-12 py-3 bg-slate-900/80 border ${passError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-700 focus:ring-indigo-500 focus:border-indigo-500'} rounded-xl outline-none text-white placeholder-slate-600 transition-all font-medium tracking-widest`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoFocus
                    />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {passError && <p className="text-rose-400 text-sm mt-2 font-medium flex items-center gap-1"><AlertCircle size={14}/> {passError}</p>}
                </div>

                <button 
                  type="submit"
                  disabled={!password}
                  className="w-full py-3.5 mt-2 rounded-xl font-bold text-md flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(79,70,229,0.5)]"
                >
                  Iniciar Sesión
                </button>
              </form>
            </div>
          )}

        </div>
        <p className="text-center text-slate-600 mt-6 text-xs font-medium tracking-widest">VERSIÓN {APP_VERSION}</p>
      </div>
    </div>
  );
}

// --- VISTA DEL VENDEDOR (REDISEÑADA) ---
function RepApp({ profile, stores, products, getCollectionRef }) {
  const [selectedStore, setSelectedStore] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const myStores = stores.filter(s => s.assignedTo === profile.id || s.assignedTo === profile.name);
  const filteredStores = myStores.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (selectedStore) {
    return <InventoryForm store={selectedStore} products={products} profile={profile} getCollectionRef={getCollectionRef} onBack={() => setSelectedStore(null)} />;
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto pb-20">
      {/* Saludo y Buscador */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-slate-800 mb-1">Tus Farmacias</h2>
        <p className="text-slate-500 mb-6 text-sm">Selecciona una tienda para comenzar el inventario.</p>
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nombre..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Lista de Farmacias (Estilo Tarjetas Modernas) */}
      <div className="grid grid-cols-1 gap-4">
        {myStores.length === 0 ? (
          <div className="bg-amber-50 text-amber-800 p-6 rounded-3xl border border-amber-200 flex flex-col items-center text-center">
            <div className="bg-amber-100 p-3 rounded-full mb-3 text-amber-600"><AlertCircle size={28} /></div>
            <h3 className="font-bold text-lg mb-1">Sin farmacias asignadas</h3>
            <p className="text-sm">Comunícate con el administrador para que asigne rutas a tu perfil.</p>
          </div>
        ) : filteredStores.length === 0 ? (
          <p className="text-center text-slate-400 py-10 font-medium">No se encontraron resultados.</p>
        ) : (
          filteredStores.map(store => (
            <div key={store.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 hover:shadow-md hover:border-indigo-300 transition-all group flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Store size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{store.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    {store.address || 'Sin dirección registrada'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedStore(store)}
                className="w-full sm:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-indigo-600 transition-colors shadow-sm whitespace-nowrap"
              >
                Inventariar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// --- FORMULARIO DE INVENTARIO (REDISEÑADO) ---
function InventoryForm({ store, products, profile, getCollectionRef, onBack }) {
  const [items, setItems] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.barcode && p.barcode.includes(searchTerm))
  );

  const handleAddProduct = (product, qtyStr) => {
    setErrorMsg('');
    const qty = parseInt(qtyStr, 10);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg(`La cantidad debe ser mayor a 0.`);
      return;
    }
    if (items.some(i => i.product.id === product.id)) {
      setErrorMsg(`${product.name} ya está en la lista.`);
      return;
    }
    setItems([{ product, qty }, ...items]);
    setSearchTerm(''); 
  };

  const handleRemoveItem = (productId) => {
    setItems(items.filter(i => i.product.id !== productId));
  };

  const handleSubmit = async () => {
    if (items.length === 0) return setErrorMsg("Agregue al menos un producto.");
    setIsSubmitting(true);
    try {
      const payload = {
        repId: profile.id, repName: profile.name,
        storeId: store.id, storeName: store.name,
        timestamp: Date.now(),
        dateString: new Date().toLocaleDateString(),
        items: items.map(i => ({ productId: i.product.id, productName: i.product.name, quantity: i.qty }))
      };
      await addDoc(getCollectionRef('inv_submissions'), payload);
      alert("¡Inventario guardado con éxito!"); 
      onBack();
    } catch (err) {
      setErrorMsg("Error al guardar en la nube.");
      setIsSubmitting(false);
    }
  };

  const onScanSuccess = (decodedText) => {
    setShowScanner(false);
    setSearchTerm(decodedText);
    const found = products.find(p => p.barcode === decodedText);
    if (found) setSearchTerm(found.name); 
    else setErrorMsg(`Código ${decodedText} no encontrado.`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-lg mx-auto bg-slate-50 relative">
      {/* Cabecera Flotante */}
      <div className="bg-white p-5 rounded-b-3xl shadow-sm border-b border-slate-200 shrink-0 z-10 sticky top-0">
        <div className="flex justify-between items-start mb-5">
          <div className="pr-4">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md mb-2 inline-block">Farmacia Actual</span>
            <h2 className="text-2xl font-black text-slate-800 leading-none">{store.name}</h2>
          </div>
          <button onClick={onBack} className="text-slate-400 hover:bg-slate-100 hover:text-slate-700 p-2.5 rounded-full bg-slate-50 border border-slate-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-rose-50 text-rose-700 p-3.5 rounded-2xl text-sm font-medium flex items-center gap-2 border border-rose-200 animate-fade-in">
            <AlertCircle size={18} className="shrink-0 text-rose-500" /> <p>{errorMsg}</p>
          </div>
        )}

        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar producto o código..." 
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none font-medium text-slate-700 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowScanner(true)}
            className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-indigo-500 transition-colors shadow-md shadow-indigo-200 shrink-0"
          >
            <Camera size={22} />
          </button>
        </div>
      </div>

      {/* Área de Listas */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {searchTerm ? (
          // Resultados Búsqueda
          <div className="space-y-3 pb-20">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider ml-2">Resultados ({filteredProducts.length})</p>
            {filteredProducts.slice(0, 10).map(p => (
              <div key={p.id} className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-3 animate-fade-in-up">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 shrink-0 border border-slate-100">
                  <Package size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-700 text-sm truncate">{p.name}</p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">{p.barcode || 'S/N'}</p>
                </div>
                <input 
                  type="number" id={`qty-${p.id}`} placeholder="0" min="1"
                  className="w-16 h-10 border border-slate-200 bg-slate-50 rounded-xl text-center font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button 
                  onClick={() => handleAddProduct(p, document.getElementById(`qty-${p.id}`).value)}
                  className="bg-slate-900 text-white w-10 h-10 rounded-xl hover:bg-indigo-600 flex items-center justify-center transition-colors shrink-0"
                >
                  <Plus size={20} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          // Items Agregados
          <div className="space-y-3 pb-24">
            <div className="flex justify-between items-center ml-2 mr-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cargados en repisa</p>
              <span className="bg-indigo-100 text-indigo-700 font-bold text-xs px-2 py-1 rounded-lg">{items.length} items</span>
            </div>
            
            {items.length === 0 ? (
              <div className="text-center py-16 opacity-60">
                <Boxes size={64} className="mx-auto mb-4 text-slate-300" />
                <p className="font-medium text-slate-500">Aún no hay productos.</p>
                <p className="text-sm text-slate-400 mt-1">Busca o escanea para agregarlos.</p>
              </div>
            ) : (
              items.map((item, idx) => (
                <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-indigo-50 text-indigo-600 font-black text-lg w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100">
                      {item.qty}
                    </div>
                    <div className="truncate pr-2">
                      <p className="font-bold text-slate-700 text-sm truncate">{item.product.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Cant. registrada</p>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveItem(item.product.id)} className="text-rose-400 p-2 hover:bg-rose-50 rounded-xl transition-colors shrink-0">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Botón Flotante Inferior */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent pt-10">
        <button 
          onClick={handleSubmit}
          disabled={items.length === 0 || isSubmitting}
          className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-xl
            ${items.length === 0 || isSubmitting ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-slate-900 text-white hover:bg-indigo-600 hover:scale-[1.02] hover:shadow-indigo-200'}`}
        >
          {isSubmitting ? 'Procesando...' : <><Check size={22} strokeWidth={3} /> Finalizar Inventario</>}
        </button>
      </div>

      {showScanner && <BarcodeScannerModal onClose={() => setShowScanner(false)} onScan={onScanSuccess} />}
    </div>
  );
}

// --- MODAL DE ESCÁNER ---
function BarcodeScannerModal({ onClose, onScan }) {
  const [error, setError] = useState('');

  useEffect(() => {
    let html5QrCode;
    const initScanner = async () => {
      const qrReaderEl = document.getElementById('qr-reader');
      if (!qrReaderEl) return; 

      if (window.Html5Qrcode) {
        html5QrCode = new window.Html5Qrcode("qr-reader");
        try {
          await html5QrCode.start(
            { facingMode: "environment" }, 
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              html5QrCode.stop().then(() => onScan(decodedText)).catch(err => console.error(err));
            },
            () => {}
          );
        } catch (err) {
          setError("No se pudo acceder a la cámara. Verifique los permisos.");
        }
      } else {
        setTimeout(initScanner, 500);
      }
    };
    const timer = setTimeout(initScanner, 100);
    return () => {
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex flex-col animate-fade-in">
      <div className="p-4 flex justify-between items-center bg-transparent text-white">
        <h3 className="font-bold tracking-wide">Escanear Código</h3>
        <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={20} /></button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        {error ? (
          <div className="text-rose-400 bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl text-center font-medium max-w-xs">
            <AlertCircle className="mx-auto mb-3" size={40} />
            {error}
          </div>
        ) : (
          <div className="relative">
            {/* Esquinas del escáner (Visuales) */}
            <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl z-10"></div>
            <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl z-10"></div>
            <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl z-10"></div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-emerald-400 rounded-br-xl z-10"></div>
            
            <div id="qr-reader" className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-black aspect-square border-2 border-slate-700/50"></div>
          </div>
        )}
      </div>
      <div className="p-8 text-center text-slate-400 text-sm font-medium">
        Apunte la cámara trasera al código del producto.<br/>
        <span className="text-xs text-slate-500 mt-2 block">La lectura es automática.</span>
      </div>
    </div>
  );
}

// --- PANEL DE CONTROL ADMINISTRADOR (REDISEÑADO) ---
function AdminDashboard({ submissions, stores, products, users, getCollectionRef, getDocRef }) {
  const [activeTab, setActiveTab] = useState('live'); 

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[85vh]">
      {/* Barra Lateral Admin */}
      <div className="w-full md:w-64 bg-slate-50 border-r border-slate-200 p-5 flex flex-row md:flex-col gap-2 overflow-x-auto shrink-0">
        <TabButton icon={<LayoutDashboard size={20}/>} label="Panel en Vivo" active={activeTab === 'live'} onClick={() => setActiveTab('live')} />
        <div className="hidden md:block my-4 border-t border-slate-200"></div>
        <p className="hidden md:block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-3">Base de Datos</p>
        <TabButton icon={<Store size={20}/>} label="Farmacias" active={activeTab === 'stores'} onClick={() => setActiveTab('stores')} />
        <TabButton icon={<Package size={20}/>} label="Productos" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
        <TabButton icon={<Users size={20}/>} label="Personal" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
      </div>

      {/* Área de Contenido */}
      <div className="flex-1 p-5 md:p-8 overflow-y-auto bg-white custom-scrollbar">
        {activeTab === 'live' && <AdminLiveView submissions={submissions} />}
        {activeTab === 'stores' && <CatalogManager title="Farmacias" collectionName="inv_stores" data={stores} fields={[{key: 'name', label: 'Nombre Local'}, {key: 'address', label: 'Dirección'}, {key: 'assignedTo', label: 'Vendedor Asignado'}]} getCollectionRef={getCollectionRef} getDocRef={getDocRef} />}
        {activeTab === 'products' && <CatalogManager title="Catálogo de Productos" collectionName="inv_products" data={products} fields={[{key: 'name', label: 'Nombre Producto'}, {key: 'barcode', label: 'Cód. Barras'}]} getCollectionRef={getCollectionRef} getDocRef={getDocRef} />}
        {/* TABLA DE USUARIOS ACTUALIZADA CON CAMPO DE CLAVE */}
        {activeTab === 'users' && <CatalogManager title="Gestión de Personal" collectionName="inv_users" data={users} fields={[{key: 'name', label: 'Nombre Completo'}, {key: 'role', label: 'Rol (admin/rep)'}, {key: 'password', label: 'Clave de Acceso'}]} getCollectionRef={getCollectionRef} getDocRef={getDocRef} />}
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all whitespace-nowrap
        ${active ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'text-slate-500 hover:bg-slate-200/50 hover:text-slate-800'}`}
    >
      {icon} <span>{label}</span>
    </button>
  );
}

// --- VISTA EN VIVO ---
function AdminLiveView({ submissions }) {
  const [filterStore, setFilterStore] = useState('');
  const [filterRep, setFilterRep] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const filteredData = submissions.filter(sub => {
    const matchStore = filterStore ? sub.storeName.toLowerCase().includes(filterStore.toLowerCase()) : true;
    const matchRep = filterRep ? sub.repName.toLowerCase().includes(filterRep.toLowerCase()) : true;
    const matchDate = filterDate ? new Date(sub.timestamp).toISOString().split('T')[0] === filterDate : true;
    return matchStore && matchRep && matchDate;
  });

  const downloadCSV = () => {
    let csv = "Fecha,Hora,Vendedor,Farmacia,Producto,Cantidad\n";
    filteredData.forEach(sub => {
      const date = new Date(sub.timestamp);
      const dateStr = date.toLocaleDateString();
      const timeStr = date.toLocaleTimeString();
      sub.items.forEach(item => {
        const cleanStore = `"${sub.storeName.replace(/"/g, '""')}"`;
        const cleanProduct = `"${item.productName.replace(/"/g, '""')}"`;
        csv += `${dateStr},${timeStr},"${sub.repName}",${cleanStore},${cleanProduct},${item.quantity}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_NexaStock_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">Actividad Reciente</h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">Monitorea los inventarios enviados desde la calle.</p>
        </div>
        <button onClick={downloadCSV} className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-emerald-200 transition-all">
          <Download size={18} /> Exportar CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-200">
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filtrar Farmacia</label>
          <input type="text" value={filterStore} onChange={e => setFilterStore(e.target.value)} className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Ej. San Juan..." />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filtrar Vendedor</label>
          <input type="text" value={filterRep} onChange={e => setFilterRep(e.target.value)} className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Nombre..." />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fecha Específica</label>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-600" />
        </div>
      </div>

      <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Fecha / Hora</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Personal</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Ubicación</th>
                <th className="p-4 font-bold uppercase tracking-wider text-xs">Productos Registrados</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan="4" className="p-10 text-center text-slate-400 font-medium">No hay registros bajo estos filtros.</td></tr>
              ) : (
                filteredData.map(sub => (
                  <tr key={sub.id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition-colors">
                    <td className="p-4 whitespace-nowrap">
                      <div className="font-bold text-slate-700">{new Date(sub.timestamp).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">{new Date(sub.timestamp).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-4">
                      <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-xs font-bold">{sub.repName}</span>
                    </td>
                    <td className="p-4 font-bold text-slate-700">{sub.storeName}</td>
                    <td className="p-4">
                      <div className="space-y-1.5 max-h-24 overflow-y-auto custom-scrollbar pr-2">
                        {sub.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs bg-slate-50 border border-slate-100 p-2 rounded-lg">
                            <span className="truncate w-32 md:w-48 font-medium text-slate-600">{item.productName}</span>
                            <span className="font-black text-indigo-600 bg-indigo-100 px-1.5 rounded">x{item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- GESTOR DE CATÁLOGOS ---
function CatalogManager({ title, collectionName, data, fields, getCollectionRef, getDocRef }) {
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item => 
    Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await updateDoc(getDocRef(collectionName, editingId), formData);
      else await addDoc(getCollectionRef(collectionName), formData);
      setFormData({}); setEditingId(null);
    } catch (err) { alert("Error al guardar."); }
  };

  const handleDelete = async (id) => {
    if(confirm('¿Eliminar registro permanentemente?')) await deleteDoc(getDocRef(collectionName, id));
  };

  const handleEdit = (item) => { setFormData(item); setEditingId(item.id); };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const lines = evt.target.result.split('\n');
      if(lines.length < 2) return alert("CSV vacío");
      let count = 0;
      for(let i = 1; i < lines.length; i++) {
        if(!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        fields.forEach((f, index) => { if(values[index]) obj[f.key] = values[index]; });
        if(Object.keys(obj).length > 0) { await addDoc(getCollectionRef(collectionName), obj); count++; }
      }
      alert(`${count} registros importados.`);
      e.target.value = null; 
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">{title}</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Administra los registros o carga una lista masiva.</p>
        </div>
        <div className="relative overflow-hidden inline-block">
          <button className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 px-5 py-2.5 rounded-xl font-bold transition-all shadow-md">
            <FileUp size={18} /> Importar CSV
          </button>
          <input type="file" accept=".csv" onChange={handleCSVUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-slate-50 p-6 rounded-3xl border border-slate-200 h-fit">
          <h3 className="font-black text-slate-800 mb-5 flex items-center gap-2">
            {editingId ? <><span className="w-2 h-2 rounded-full bg-amber-500"></span> Editando Registro</> : <><span className="w-2 h-2 rounded-full bg-indigo-500"></span> Nuevo Registro</>}
          </h3>
          <form onSubmit={handleSave} className="space-y-4">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{f.label}</label>
                <input 
                  type="text" required value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                  className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-700 bg-white shadow-sm"
                />
              </div>
            ))}
            <div className="flex gap-3 pt-4">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all">
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
              {editingId && (
                <button type="button" onClick={() => {setEditingId(null); setFormData({});}} className="px-5 bg-white border border-slate-200 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-100 transition-all">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 border border-slate-200 rounded-3xl overflow-hidden flex flex-col h-[500px] shadow-sm bg-white">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <div className="relative">
              <Search className="absolute left-4 top-3 text-slate-400" size={18} />
              <input 
                type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-white text-slate-400 border-b border-slate-100 sticky top-0 z-10">
                  {fields.map(f => <th key={f.key} className="p-4 font-bold uppercase tracking-wider text-xs">{f.label}</th>)}
                  <th className="p-4 font-bold uppercase tracking-wider text-xs text-right">Opciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan={fields.length + 1} className="p-10 text-center text-slate-400 font-medium">No se encontraron datos.</td></tr>
                ) : (
                  filteredData.map(item => (
                    <tr key={item.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      {fields.map(f => (
                        <td key={f.key} className="p-4 font-medium text-slate-700">
                          {f.key === 'password' ? '••••••••' : item[f.key]}
                        </td>
                      ))}
                      <td className="p-4 flex justify-end gap-2">
                        <button onClick={() => handleEdit(item)} className="text-indigo-600 font-bold bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors">Editar</button>
                        <button onClick={() => handleDelete(item.id)} className="text-rose-500 font-bold bg-rose-50 hover:bg-rose-100 p-1.5 rounded-lg transition-colors"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}