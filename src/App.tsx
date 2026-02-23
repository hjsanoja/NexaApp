
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, updateDoc } from 'firebase/firestore';
import { Camera, Search, Plus, Trash2, Download, LogOut, Users, Store, Package, LayoutDashboard, FileUp, X, Check, AlertCircle, ScanLine, Boxes } from 'lucide-react';

// --- VERSIÓN DE LA APP ---
// Cambia este número cada vez que hagamos una nueva mejora para rastrearla en tu teléfono
const APP_VERSION = "v1.1.1";

// --- INICIALIZACIÓN DE FIREBASE ---
// ↓↓↓ REEMPLAZA ESTO CON LOS DATOS DE TU FIREBASE REAL ↓↓↓
const myFirebaseConfig = {
  apiKey: "AIzaSyAHJuYAOVPAghEOQjlqO-ZdnGMi_sk9hmg",
  authDomain: "nexaapp-4f2f4.firebaseapp.com",
  projectId: "nexaapp-4f2f4",
  storageBucket: "nexaapp-4f2f4.firebasestorage.app",
  messagingSenderId: "780963789506",
  appId: "1:780963789506:web:54ea3e67921872470e995b",
  measurementId: "G-7J51XR0NDD"
};
// ↑↑↑ HASTA AQUÍ ↑↑↑

// Comprobación de seguridad para que la pantalla no se quede en blanco
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

// --- COMPONENTE ENVOLTORIO (Protege contra pantalla blanca) ---
export default function App() {
  if (isConfigMissing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50 p-4 font-sans">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-red-200 max-w-md text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Falta conectar Firebase</h2>
          <p className="text-gray-600 mb-4">
            La pantalla está en blanco porque la aplicación no puede encontrar tus credenciales de base de datos.
          </p>
          <p className="text-sm text-gray-700 bg-red-50 p-4 rounded-lg text-left border border-red-100">
            Ve a la <b>línea 15</b> del código en tu editor y reemplaza los textos como <code>"TU_API_KEY"</code> con los datos de tu proyecto real de Firebase.
          </p>
        </div>
      </div>
    );
  }

  return <MainApp />;
}

// --- COMPONENTE PRINCIPAL REAL ---
function MainApp() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null); // { id, name, role: 'admin' | 'rep' }
  const [loading, setLoading] = useState(true);
  const [systemError, setSystemError] = useState(''); // <--- NUEVO: Capturador de errores visuales

  // Estados de datos
  const [usersList, setUsersList] = useState([]);
  const [storesList, setStoresList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  // Rutas de Base de Datos
  const getCollectionRef = (colName) => collection(db, 'artifacts', appId, 'public', 'data', colName);
  const getDocRef = (colName, docId) => doc(db, 'artifacts', appId, 'public', 'data', colName, docId);

  // Configuración de Autenticación y Listeners en Tiempo Real
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
        // Mostrar el error en pantalla si Firebase bloquea el inicio de sesión
        setSystemError(`Error de Autenticación: ${err.message}. Verifica que hayas habilitado el inicio de sesión "Anónimo" en Firebase y que el dominio actual esté en "Dominios Autorizados".`);
        setLoading(false);
      }
    };
    initAuth();

    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        setSystemError(''); // Limpiar errores si se loguea exitosamente
      }
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, []);

  // Cargar datos una vez autenticado
  useEffect(() => {
    if (!user) return;

    const unsubs = [];
    
    // Usuarios (Vendedores y Admins)
    unsubs.push(onSnapshot(getCollectionRef('inv_users'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Crear admin y vendedores de prueba si está vacío
      if (data.length === 0) {
        setDoc(getDocRef('inv_users', 'admin_1'), { name: 'Admin Principal', role: 'admin' }).catch(e => setSystemError(`Error Guardando Admin: ${e.message}`));
        setDoc(getDocRef('inv_users', 'rep_1'), { name: 'Juan Perez', role: 'rep' });
        setDoc(getDocRef('inv_users', 'rep_2'), { name: 'Maria Lopez', role: 'rep' });
      }
      setUsersList(data);
    }, (err) => {
      console.error(err);
      setSystemError(`Error Base de Datos: ${err.message}. Revisa las reglas de Firestore.`);
    }));

    // Tiendas/Farmacias
    unsubs.push(onSnapshot(getCollectionRef('inv_stores'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Crear tiendas de prueba si está vacío
      if (data.length === 0) {
        setDoc(getDocRef('inv_stores', 'store_1'), { name: 'Farmacia San Juan', address: 'Centro', assignedTo: 'Juan Perez' });
        setDoc(getDocRef('inv_stores', 'store_2'), { name: 'Farmacia Central', address: 'Av. Bolívar', assignedTo: 'Juan Perez' });
        setDoc(getDocRef('inv_stores', 'store_3'), { name: 'Farmasalud', address: 'Plaza Mayor', assignedTo: 'Maria Lopez' });
        setDoc(getDocRef('inv_stores', 'store_4'), { name: 'Botica Nueva', address: 'Calle 8', assignedTo: 'Maria Lopez' });
      }
      setStoresList(data);
    }, (err) => console.error(err)));

    // Productos
    unsubs.push(onSnapshot(getCollectionRef('inv_products'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Crear productos de prueba si está vacío
      if (data.length === 0) {
        setDoc(getDocRef('inv_products', 'prod_1'), { name: 'Aspirina 500mg', barcode: '111222' });
        setDoc(getDocRef('inv_products', 'prod_2'), { name: 'Paracetamol 1g', barcode: '333444' });
        setDoc(getDocRef('inv_products', 'prod_3'), { name: 'Ibuprofeno 400mg', barcode: '555666' });
        setDoc(getDocRef('inv_products', 'prod_4'), { name: 'Vitamina C', barcode: '777888' });
        setDoc(getDocRef('inv_products', 'prod_5'), { name: 'Jarabe para la tos', barcode: '999000' });
      }
      setProductsList(data);
    }, (err) => console.error(err)));

    // Registros de Inventario (Submissions)
    unsubs.push(onSnapshot(getCollectionRef('inv_submissions'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp);
      setSubmissions(data);
    }, (err) => console.error(err)));

    // Inyectar librería de escáner de códigos de barra
    if (!document.getElementById('html5-qrcode-script')) {
      const script = document.createElement('script');
      script.id = 'html5-qrcode-script';
      script.src = 'https://unpkg.com/html5-qrcode';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => unsubs.forEach(unsub => unsub());
  }, [user]);

  if (loading) return <div className="flex h-screen items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  if (!profile) {
    return <LoginScreen usersList={usersList} onSelectProfile={setProfile} systemError={systemError} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans text-gray-800">
      {/* Encabezado */}
      <header className="bg-blue-700 text-white p-4 shadow-md flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {profile.role === 'admin' ? <LayoutDashboard size={24} /> : <Store size={24} />}
          <h1 className="text-xl font-bold truncate tracking-wide flex items-baseline gap-2">
            {profile.role === 'admin' ? 'Panel Admin' : 'NexaStock'}
            <span className="text-xs font-normal opacity-75">{APP_VERSION}</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium bg-blue-800 px-3 py-1 rounded-full hidden sm:block">{profile.name}</span>
          <button onClick={() => setProfile(null)} className="p-2 hover:bg-blue-600 rounded-full transition-colors" title="Cerrar Sesión">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Área Principal */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4">
        {systemError && (
          <div className="mb-4 bg-red-100 text-red-800 p-4 rounded-xl shadow flex items-start gap-3 border border-red-300">
            <AlertCircle className="shrink-0 mt-0.5" />
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

// --- PANTALLA DE INICIO DE SESIÓN ---
function LoginScreen({ usersList, onSelectProfile, systemError }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = usersList.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4 flex-col gap-4">
      {systemError && (
        <div className="w-full max-w-md bg-red-100 border border-red-300 p-4 rounded-xl text-red-800 text-sm flex items-start gap-2 shadow-sm animate-fade-in">
           <AlertCircle size={20} className="shrink-0" />
           <p><b>Aviso del Sistema:</b> <br/>{systemError}</p>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex justify-center mb-4 relative w-fit mx-auto">
          <Boxes size={56} className="text-blue-600" />
          <ScanLine size={28} className="absolute -bottom-2 -right-2 text-green-500 bg-white rounded-lg p-0.5" />
        </div>
        <h2 className="text-3xl font-black text-center mb-1 text-gray-800 tracking-tight">NexaStock</h2>
        <p className="text-center text-sm text-gray-500 mb-6 font-medium flex items-center justify-center gap-2">
          Control de Inventarios 
          <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{APP_VERSION}</span>
        </p>
        
        <div className="relative mb-6">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar mi nombre..." 
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="max-h-64 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {filteredUsers.length === 0 ? (
            <div className="text-center text-gray-500 py-4">
               {systemError ? 'Esperando conexión con la base de datos...' : 'No se encontraron usuarios.'}
            </div>
          ) : (
            filteredUsers.map(u => (
              <button
                key={u.id}
                onClick={() => onSelectProfile(u)}
                className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group"
              >
                <div>
                  <p className="font-semibold text-gray-800 group-hover:text-blue-700">{u.name}</p>
                  <p className="text-xs text-gray-500 capitalize">{u.role === 'admin' ? 'Administrador' : 'Vendedor'}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 group-hover:bg-blue-200 group-hover:text-blue-700">
                  {u.role === 'admin' ? <Users size={16} /> : <Store size={16} />}
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// --- VISTA DEL VENDEDOR (MÓVIL) ---
function RepApp({ profile, stores, products, getCollectionRef }) {
  const [selectedStore, setSelectedStore] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrar solo las tiendas asignadas a este vendedor
  const myStores = stores.filter(s => s.assignedTo === profile.id || s.assignedTo === profile.name);
  const filteredStores = myStores.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  if (selectedStore) {
    return <InventoryForm store={selectedStore} products={products} profile={profile} getCollectionRef={getCollectionRef} onBack={() => setSelectedStore(null)} />;
  }

  return (
    <div className="space-y-4 max-w-md mx-auto">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Mis Farmacias Asignadas</h2>
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Buscar farmacia..." 
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-3">
        {myStores.length === 0 ? (
          <div className="bg-yellow-50 text-yellow-800 p-4 rounded-xl border border-yellow-200 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm">No tienes farmacias asignadas. Pídele al administrador que te asigne tiendas.</p>
          </div>
        ) : filteredStores.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No se encontraron coincidencias.</p>
        ) : (
          filteredStores.map(store => (
            <div key={store.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800">{store.name}</h3>
                <p className="text-sm text-gray-500">{store.address || 'Sin dirección'}</p>
              </div>
              <button 
                onClick={() => setSelectedStore(store)}
                className="bg-blue-100 text-blue-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-200 transition-colors"
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

// --- FORMULARIO DE INVENTARIO (MÓVIL) ---
function InventoryForm({ store, products, profile, getCollectionRef, onBack }) {
  const [items, setItems] = useState([]); // { product: {}, qty: number }
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

    // Validación Estricta: Sin ceros y sin negativos
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg(`La cantidad para ${product.name} debe ser mayor a 0.`);
      return;
    }
    // Validación Estricta: Sin duplicados
    if (items.some(i => i.product.id === product.id)) {
      setErrorMsg(`El producto ${product.name} ya fue agregado a la lista.`);
      return;
    }

    setItems([{ product, qty }, ...items]);
    setSearchTerm(''); // Limpiar buscador tras agregar
  };

  const handleRemoveItem = (productId) => {
    setItems(items.filter(i => i.product.id !== productId));
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      setErrorMsg("Debe agregar al menos un producto.");
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        repId: profile.id,
        repName: profile.name,
        storeId: store.id,
        storeName: store.name,
        timestamp: Date.now(),
        dateString: new Date().toLocaleDateString(),
        items: items.map(i => ({
          productId: i.product.id,
          productName: i.product.name,
          quantity: i.qty
        }))
      };
      await addDoc(getCollectionRef('inv_submissions'), payload);
      alert("¡Inventario guardado con éxito!"); 
      onBack();
    } catch (err) {
      console.error(err);
      setErrorMsg("Error al guardar. Intente de nuevo.");
      setIsSubmitting(false);
    }
  };

  const onScanSuccess = (decodedText) => {
    setShowScanner(false);
    setSearchTerm(decodedText);
    const found = products.find(p => p.barcode === decodedText);
    if (found) {
      setSearchTerm(found.name); 
    } else {
      setErrorMsg(`Código ${decodedText} no encontrado en catálogo.`);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-md mx-auto">
      {/* Cabecera del Formulario */}
      <div className="bg-white p-4 rounded-t-2xl shadow-sm border-b border-gray-200 shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tienda</span>
            <h2 className="text-xl font-bold text-gray-800 leading-tight">{store.name}</h2>
          </div>
          <button onClick={onBack} className="text-gray-500 hover:bg-gray-100 p-2 rounded-full">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-sm flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar o escanear..." 
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setShowScanner(true)}
            className="bg-gray-800 text-white p-2 w-11 h-11 rounded-xl flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <Camera size={20} />
          </button>
        </div>
      </div>

      {/* Lista de Items Escaneados */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 custom-scrollbar">
        {searchTerm ? (
          // Resultados de Búsqueda
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase">Resultados de búsqueda</p>
            {filteredProducts.slice(0, 10).map(p => (
              <div key={p.id} className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 flex items-center gap-2">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800 text-sm">{p.name}</p>
                  <p className="text-xs text-gray-400">Cod: {p.barcode || 'N/A'}</p>
                </div>
                <input 
                  type="number" 
                  id={`qty-${p.id}`}
                  placeholder="Cant" 
                  className="w-16 p-2 border border-gray-300 rounded-lg text-center"
                  min="1"
                />
                <button 
                  onClick={() => handleAddProduct(p, document.getElementById(`qty-${p.id}`).value)}
                  className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700"
                >
                  <Plus size={18} />
                </button>
              </div>
            ))}
            {filteredProducts.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No hay productos.</p>}
          </div>
        ) : (
          // Items Agregados
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase">Productos Registrados ({items.length})</p>
            {items.length === 0 ? (
              <div className="text-center py-10 opacity-50">
                <Package size={48} className="mx-auto mb-2" />
                <p>Busca o escanea productos para agregarlos al inventario.</p>
              </div>
            ) : (
              items.map((item, idx) => (
                <div key={idx} className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center justify-between animate-fade-in">
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{item.product.name}</p>
                    <p className="text-xs text-gray-500">Cantidad: <span className="font-bold text-blue-600 text-base ml-1">{item.qty}</span></p>
                  </div>
                  <button onClick={() => handleRemoveItem(item.product.id)} className="text-red-500 p-2 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Botón de Enviar */}
      <div className="bg-white p-4 border-t border-gray-200 shrink-0">
        <button 
          onClick={handleSubmit}
          disabled={items.length === 0 || isSubmitting}
          className={`w-full py-3 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all
            ${items.length === 0 || isSubmitting ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 shadow-lg'}`}
        >
          {isSubmitting ? 'Guardando...' : <><Check size={20} /> Finalizar Visita</>}
        </button>
      </div>

      {/* Modal del Escáner */}
      {showScanner && (
        <BarcodeScannerModal 
          onClose={() => setShowScanner(false)} 
          onScan={onScanSuccess} 
        />
      )}
    </div>
  );
}

// --- MODAL DE ESCÁNER CON HTML5-QRCODE ---
function BarcodeScannerModal({ onClose, onScan }) {
  const [error, setError] = useState('');

  useEffect(() => {
    let html5QrCode;
    
    const initScanner = async () => {
      const qrReaderEl = document.getElementById('qr-reader');
      if (!qrReaderEl) return; // Si el usuario cerró el modal rápido

      // Usamos Html5Qrcode directo en lugar del Scanner genérico para auto-iniciar
      if (window.Html5Qrcode) {
        html5QrCode = new window.Html5Qrcode("qr-reader");
        try {
          await html5QrCode.start(
            { facingMode: "environment" }, // Prioriza la cámara trasera
            { fps: 10, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
              html5QrCode.stop().then(() => {
                onScan(decodedText);
              }).catch(err => console.error("Error deteniendo escáner", err));
            },
            (errorMessage) => { /* ignorar errores menores de escaneo continuo */ }
          );
        } catch (err) {
          console.error("Error iniciando cámara:", err);
          setError("No se pudo acceder a la cámara. Por favor, verifique los permisos en su navegador.");
        }
      } else {
        // Reintentar si la librería aún está descargándose
        setTimeout(initScanner, 500);
      }
    };

    // Esperar a que el DOM pinte el div #qr-reader
    const timer = setTimeout(initScanner, 100);

    return () => {
      clearTimeout(timer);
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Error limpiando escáner", err));
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex flex-col">
      <div className="p-4 flex justify-between items-center bg-transparent text-white">
        <h3 className="font-bold">Escanear Código</h3>
        <button onClick={onClose} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"><X size={20} /></button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4">
        {error ? (
          <div className="text-red-500 bg-red-100 p-4 rounded-xl text-center font-medium max-w-xs">
            <AlertCircle className="mx-auto mb-2" size={32} />
            {error}
          </div>
        ) : (
          <div id="qr-reader" className="w-full max-w-sm rounded-xl overflow-hidden shadow-2xl bg-black"></div>
        )}
      </div>
      <div className="p-6 text-center text-white/70 text-sm bg-transparent">
        Apunte la cámara al código de barras o QR del producto.<br/>
        Asegúrese de otorgar permisos a la cámara.
      </div>
    </div>
  );
}

// --- PANEL DE CONTROL ADMINISTRADOR ---
function AdminDashboard({ submissions, stores, products, users, getCollectionRef, getDocRef }) {
  const [activeTab, setActiveTab] = useState('live'); 

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row min-h-[80vh]">
      {/* Barra Lateral Admin */}
      <div className="w-full md:w-64 bg-gray-50 border-r border-gray-200 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto">
        <TabButton icon={<LayoutDashboard size={18}/>} label="En Vivo & Reportes" active={activeTab === 'live'} onClick={() => setActiveTab('live')} />
        <div className="hidden md:block my-2 border-t border-gray-200"></div>
        <p className="hidden md:block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 ml-2 mt-2">Catálogos</p>
        <TabButton icon={<Store size={18}/>} label="Tiendas" active={activeTab === 'stores'} onClick={() => setActiveTab('stores')} />
        <TabButton icon={<Package size={18}/>} label="Productos" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
        <TabButton icon={<Users size={18}/>} label="Vendedores" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
      </div>

      {/* Área de Contenido Admin */}
      <div className="flex-1 p-4 md:p-6 overflow-y-auto bg-white custom-scrollbar">
        {activeTab === 'live' && <AdminLiveView submissions={submissions} stores={stores} users={users} />}
        {activeTab === 'stores' && <CatalogManager title="Tiendas" collectionName="inv_stores" data={stores} fields={[{key: 'name', label: 'Nombre Farmacia'}, {key: 'address', label: 'Dirección'}, {key: 'assignedTo', label: 'Vendedor Asignado (Nombre exacto)'}]} getCollectionRef={getCollectionRef} getDocRef={getDocRef} />}
        {activeTab === 'products' && <CatalogManager title="Productos" collectionName="inv_products" data={products} fields={[{key: 'name', label: 'Nombre Producto'}, {key: 'barcode', label: 'Código de Barras'}]} getCollectionRef={getCollectionRef} getDocRef={getDocRef} />}
        {activeTab === 'users' && <CatalogManager title="Usuarios" collectionName="inv_users" data={users} fields={[{key: 'name', label: 'Nombre Completo'}, {key: 'role', label: 'Rol (admin/rep)'}]} getCollectionRef={getCollectionRef} getDocRef={getDocRef} />}
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors whitespace-nowrap
        ${active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
    >
      {icon} <span>{label}</span>
    </button>
  );
}

// --- VISTA EN VIVO Y REPORTES ADMIN ---
function AdminLiveView({ submissions }) {
  const [filterStore, setFilterStore] = useState('');
  const [filterRep, setFilterRep] = useState('');
  const [filterDate, setFilterDate] = useState('');

  // Aplicar filtros locales
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
    link.download = `Reporte_Inventario_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Registros en Tiempo Real</h2>
          <p className="text-sm text-gray-500">Monitorea la actividad de los vendedores al instante.</p>
        </div>
        <button onClick={downloadCSV} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-semibold shadow-sm transition-colors">
          <Download size={18} /> Exportar Reporte
        </button>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Buscar Farmacia</label>
          <input type="text" value={filterStore} onChange={e => setFilterStore(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Ej. Farmacia San Juan..." />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Buscar Vendedor</label>
          <input type="text" value={filterRep} onChange={e => setFilterRep(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" placeholder="Nombre del vendedor..." />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1">Fecha Exacta</label>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg text-sm" />
        </div>
      </div>

      {/* Tabla de Resultados */}
      <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-700 border-b border-gray-200">
                <th className="p-3 font-semibold">Fecha y Hora</th>
                <th className="p-3 font-semibold">Vendedor</th>
                <th className="p-3 font-semibold">Farmacia</th>
                <th className="p-3 font-semibold">Items Escaneados</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr><td colSpan="4" className="p-8 text-center text-gray-500">No hay registros que coincidan con los filtros.</td></tr>
              ) : (
                filteredData.map(sub => (
                  <tr key={sub.id} className="border-b border-gray-100 hover:bg-blue-50/50 transition-colors">
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-semibold text-gray-800">{new Date(sub.timestamp).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{new Date(sub.timestamp).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs font-semibold">{sub.repName}</span>
                    </td>
                    <td className="p-3 font-medium text-gray-800">{sub.storeName}</td>
                    <td className="p-3">
                      <div className="space-y-1 max-h-24 overflow-y-auto custom-scrollbar pr-2">
                        {sub.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs bg-gray-50 p-1 rounded">
                            <span className="truncate w-32 md:w-48">{item.productName}</span>
                            <span className="font-bold text-blue-600">x{item.quantity}</span>
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

// --- GESTOR DE CATÁLOGOS GENÉRICO (CRUD + CSV) ---
function CatalogManager({ title, collectionName, data, fields, getCollectionRef, getDocRef }) {
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = data.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateDoc(getDocRef(collectionName, editingId), formData);
      } else {
        await addDoc(getCollectionRef(collectionName), formData);
      }
      setFormData({});
      setEditingId(null);
    } catch (err) {
      console.error(err);
      alert("Error al guardar.");
    }
  };

  const handleDelete = async (id) => {
    if(confirm('¿Eliminar este registro?')) {
      await deleteDoc(getDocRef(collectionName, id));
    }
  };

  const handleEdit = (item) => {
    setFormData(item);
    setEditingId(item.id);
  };

  const handleCSVUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      const lines = text.split('\n');
      if(lines.length < 2) return alert("CSV vacío o inválido");
      
      let count = 0;
      for(let i = 1; i < lines.length; i++) {
        if(!lines[i].trim()) continue;
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const obj = {};
        
        fields.forEach((f, index) => {
           if(values[index]) obj[f.key] = values[index];
        });

        if(Object.keys(obj).length > 0) {
           await addDoc(getCollectionRef(collectionName), obj);
           count++;
        }
      }
      alert(`Se importaron ${count} registros.`);
      e.target.value = null; 
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Gestión de {title}</h2>
          <p className="text-sm text-gray-500">Agrega, edita, elimina o carga masivamente.</p>
        </div>
        <div className="relative overflow-hidden inline-block">
          <button className="flex items-center gap-2 bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-2 rounded-xl font-semibold transition-colors">
            <FileUp size={18} /> Cargar CSV
          </button>
          <input type="file" accept=".csv" onChange={handleCSVUpload} className="absolute inset-0 opacity-0 cursor-pointer" title="Sube un archivo CSV separado por comas" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario */}
        <div className="lg:col-span-1 bg-gray-50 p-5 rounded-2xl border border-gray-200 h-fit">
          <h3 className="font-bold text-gray-700 mb-4">{editingId ? 'Editar Registro' : 'Nuevo Registro'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            {fields.map(f => (
              <div key={f.key}>
                <label className="block text-xs font-bold text-gray-500 mb-1">{f.label}</label>
                <input 
                  type="text" 
                  required
                  value={formData[f.key] || ''} 
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700">
                {editingId ? 'Actualizar' : 'Guardar'}
              </button>
              {editingId && (
                <button type="button" onClick={() => {setEditingId(null); setFormData({});}} className="px-4 bg-gray-200 text-gray-700 py-2 rounded-lg font-bold hover:bg-gray-300">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Lista */}
        <div className="lg:col-span-2 border border-gray-200 rounded-2xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-3 border-b border-gray-200 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={`Buscar en ${title.toLowerCase()}...`}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 sticky top-0 z-10">
                  {fields.map(f => <th key={f.key} className="p-3 font-semibold">{f.label}</th>)}
                  <th className="p-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.length === 0 ? (
                  <tr><td colSpan={fields.length + 1} className="p-8 text-center text-gray-500">No hay datos.</td></tr>
                ) : (
                  filteredData.map(item => (
                    <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                      {fields.map(f => <td key={f.key} className="p-3">{item[f.key]}</td>)}
                      <td className="p-3 flex justify-end gap-2">
                        <button onClick={() => handleEdit(item)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded">Editar</button>
                        <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16}/></button>
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