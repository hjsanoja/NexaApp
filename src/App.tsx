// @ts-nocheck
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc, addDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { Camera, Search, Plus, Trash2, Download, LogOut, Users, Store, Package, LayoutDashboard, FileUp, X, Check, AlertCircle, ScanLine, Boxes, Lock, ChevronLeft, Eye, EyeOff, Filter, ChevronRight, ClipboardList, ListPlus, Edit3, History, DollarSign } from 'lucide-react';

// --- VERSIÓN DE LA APP ---
const APP_VERSION = "v1.7.1";

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

// --- DATOS INICIALES REALES ---
const REAL_USERS = [
  { id: 'admin_1', name: 'Admin Principal', role: 'admin', password: 'admin26' },
  { id: 'rep_sofy', name: 'Sofy Hernandez', role: 'rep', password: 'sofy' },
  { id: 'rep_daniel', name: 'Daniel Gil', role: 'rep', password: 'daniel' },
  { id: 'rep_linyirubi', name: 'Linyirubi Vazquez', role: 'rep', password: 'linyirubi' },
  { id: 'rep_tanya', name: 'Tanya Perez', role: 'rep', password: 'tanya' },
  { id: 'rep_maria', name: 'Maria Celeste Diaz', role: 'rep', password: 'maria' },
  { id: 'rep_francis', name: 'Francis Vásquez', role: 'rep', password: 'francis' }
];

const RAW_STORES = [
  {r:"Sofy Hernandez",s:["ARCO","BARROCA","BELLA VISTA","BOULEVAR DE CATIA","CARICUAO","ELEANOR","MADRE CABRINI","PLAZA CARICUAO","NUEVA CARACAS","ZONA FRANCA","MATERNIDAD","OLIVO","ROBLE","METROCENTER","XANA CATIA (CUTIRA)","MUNDO PHARMA CATÍA","XANA CARICUAO (ARAGUANEY)","LOCATEL SAN MARTIN","LOCATEL YAGUARA","LOCATEL CARICUAO","RED VITAL LA YAGUARA","CONGRESO","LOCATEL PLAZA BOLIVAR","CUARTEL"]},
  {r:"Daniel Gil",s:["FARMAGO FUERZAS ARMADAS","ANTINEA","CLAVELINAS","EL AVILA","LA CANDELARIA","RIO FARO","TOPACIO","VENECIA","LOCATEL HCC","LOCATEL FENIX","FARMA CANDELARIA GRUPO ANSELMO","MARAPLUS A CANDELARIA","MARAPLUS BELLAS ARTES","GRANATE","VERTIENTE","CAMINITO","TURQUESA","NELLYS","LOCATEL LA MARRON","PIRINEOS","FARMAGO AV UNIVERSIDAD","PUNCERES","LOCATEL GUARENAS","LOCATEL GUATIRE","XANA GUARENAS (ANACONDA)","FARMAGO BUENAVENTURA"]},
  {r:"Linyirubi Vazquez",s:["VENTUARI","DANILA","GRISELDA","MARFIL","JARDINES DEL VALLE","MONJES","NACAR","NATALIA","OPALO","FARMAGO AV VICTORIA","LOCATEL EL VALLE","LOCATEL STA MONICA","XANA (ESTEFANIA) BELLO MONTE","FARMAGO SABANA GRANDE","MARAPLUS LA FLORIDA","FARMAGO AV LIBERTADOR","FARMAGO CC RECREO","ALTOZANO","SCARLET","LOCATEL LOS TEQUES","LOCATEL SAN ANTONIO","XANA SAN ANTONIO (LA CASCADA)"]},
  {r:"Tanya Perez",s:["ALBITA (SANTA EDUVIGIS)","AMBAR (SAN IGNASIO)","CARLOTA","CUARZO (MILENIUN)","ESMERALDA (CUA)","ESTACION SUR CHARAL","LA CASTELLANA VE","LIDER (CC LIDER)","MELANIE","MUCURA (LOS CHORROS)","OFELIA","TOBOGAN (ALTAMIRA)","LUZMAR (CHACAO)","MARAPLUS LA CASTELLANA","LOCATEL LA CASTELLANA","MARAPLUS LOS RUICES","LOCATEL LOS 2 CAMINOS","FARMAGO FRANCISCO DE MIRANDA","FARMAGO CHACAO","XANA CEIBA (LA FLORESTA)","INDIGO (SAMBIL)","RUBI (SAMBIL)"]},
  {r:"Maria Celeste Diaz",s:["AUTANA","CHUAO","IRENE (PLAZA LAS AMERICAS)","PEDRO LUIS","TEO (CCCT)","TEPUY","ZAFIRO (VIZCAYA)","LOCATEL MERCEDES","FARMAGO ROSAL","FARMAGO LIDO","XANA EL ROSAL (CC LIDO)","MONICA (CERRO VERDE)","FARMA BAHIA","XANA NAIGUATA (MANGLE)","MAIQUETIA","MARIA ANTONIETA","MARINERA","PLAYA GRANDE","RAFAEL TEODORO","REGULO"]},
  {r:"Francis Vásquez",s:["SAN PASTOR (UNICENTRO)","XANA UNICENTRO EL MARQUEZ","ACONCAGUA (SANTA FE)","CORINA (LA URBINA)","JOYA (MACARACUAY)","JUAN BAUTISTA  (MARICHE)","MONTAÑAL (PETARE)","OCUMITO (TERRAZAS DEL AVILA)","ROMANA (MANZANARES)","SETENTA (CC MACARACUAY)","SUSANA (CC  CONGRESA)","MIRENA (LA URBINA)","EXPRESO (EXP BARUTA)","GRACIELA (LAGUNITAS)","MANANTIAL (HATILLO)","JOSE MIGUEL (HATILLO)","TEREPAIMA (LA TRINIDAD)","LOCATEL BOLEITA","LOCATEL PETARE.","FARMAGO HORIZONTE","FARMAGO SANTA ROSA DE LIMA","XANA SANTA ROSA DE LIMA","FARMANUTRY (BARUTA)"]}
];
let REAL_STORES = [];
RAW_STORES.forEach(group => group.s.forEach((store, i) => REAL_STORES.push({ id: `st_${group.r.split(' ')[0]}_${i}`, name: store, assignedTo: group.r })));

const REAL_PRODUCTS = [
  "ACETAMINOFEN 150mg/5mL JBE x 120 mL","ACETAMINOFEN 650 mg TAB X 10","AMBROXOL 15 mg/5 ml JBE X 120 ml PED","AMBROXOL 30 mg/5 ml JBE X 120 ml AD","AMOXICILINA 500 MG CAP X 12 VZLA","ATORVASTATINA 20 MG TAB X 14 VZLA","ATORVASTATINA 40 mg TAB  X 14","BROMHEXINA 4 mg/5 ml JBE X 120 ml PED","FLUOXETINA 20 MG CAP X 14","FLUOXETINA 20MG CAP X 28","CEFADROXILO 500 MG CAP X12 VZLA","CETIRIZINA 10 mg TAB X 10","CETIRIZINA 5mg /5 mL JBE X 60 mL","CETIRIZINA 5mg /5 mL SOL ORAL x 60mL","CLINDAMICINA 300 MG CAP X 16 VZL","CLINDAMICINA 300 MG CAP X 20","HIDROCLOROTIAZIDA 12,5 mg TAB x 30","CLOTRIM+NEOMIC+DEXAMETA CREM X20 G VZL","DESLORATADINA 2,5 MG/5ML JBE X 60 ML","DESLORATADINA 5 MG TAB  X 10","DICLOFENAC POTASICO 50 mg TAB x 10","DIOSMINA + HESPERIDINA 500 mg / 40 mg x10TAB","ENALAPRIL 20 MG TAB X20","GENTAMICINA 0,1% CRE X 15 g","LOSARTAN POTASICO 100mg TAB REC X 30","EZETIMIBA-SINVASTATINA 10-20MG X 30TAB","IBUPROFENO 800 mg TAB X 10","KETOPROFENO 100 mg CAP X 20","PANTOPRAZOL 40 mg TAB x 10","PIROXICAM 20 mg CAP X 10","SILDENAFIL 50 MG TAB REC  X 1","ALBENDAZOL 200 MG TAB X 2","AMOXICILINA 500 MG CAP X 6 VZLA","CEFADROXILO 250 MG/5 ML PPS FCOX60ML VZL","AMLODIPINO 5 MG TAB X 10 TAB","ATENOLOL 100 MG TAB X 30","ATENOLOL 50 MG TAB X 30","LOSARTAN + HCTZ 50/12,5MG TAB X 15","LOSARTAN+HCTZ 50-12,5mg TAB R X 30","MELOXICAM 15 MG TAB X 10","MELOXICAM 7,5 MG TAB X 10 VZL","SERTRALINA 50 MG TAB X 10 VZL","SERTRALINA 50 MG TAB X 30","IBUPROFENO 100 mg/5 ml SUSP X 60 ml","ALBENDAZOL 400 mg/20 ml SUSP X 20 ml","TADALAFILO 20 MG TAB X 1","AMLODIPINA 10 MG TAB X 10","AZITROMICINA 500 MG TAB X 5 VZLA","AZITROMICINA 200 MG/5 ML PPS X 15 ML VZL","AZITROMICINA 500 MG TAB X 3","BETAHISTINA 16 mg TAB X 20","ESCITALOPRAM 10MG X 30 TABLETAS ","ESCITALOPRAM 20MG X 30 TABLETAS ","CAPTOPRIL 25 MG TAB X20","CARVEDILOL 12,5 mg TAB x 30","CIPROFLOXACINA 500 MG TAB X6","CLARITROMICINA 500 MG TAB X10 VZL","DICLOFENACO SODICO 50 MG TAB X20","GLIMEPIRIDE 2 MG TAB X 16","GLIMEPIRIDE 2 MG TAB X 30","GLIMEPIRIDE 4 MG TAB X 16","GLIMEPIRIDE 4 MG TAB X 30","IRBESARTAN 150 mg TAB x 10","IRBESARTAN 150 mg TAB x 30","ATORVASTATINA 20mg TAB REC X 30","ATORVASTATINA 40mg TAB REC X 30","LEVOCETIRIZINA 5 mg TAB x 10","LORATADINA 10MG TAB X 20","LORATADINA 10MG TAB X 10","CANDESARTAN 16mg TAB X 30","MOXIFLOXACINO 400 mg TAB  X 7 VEN","ACETAMINOFEN 500 mg TAB X 20","ACICLOVIR 200 mg TAB X 24","ALBENDAZOL 200 MG TAB X 6","AMPICILINA 250MG/5ML PPS X 60 ML VZLA","ENALAPRIL 10 MG COMP X 20","DICLOFENAC POT 2mg/mL SUSP ORAL 120ML","CLOPIDOGREL 75 mg X 14 TAB","CLOPIDOGREL 75mg TAB REC X 30","FLUCONAZOL 150 mg CAP X 2","DICLOFENAC POTASICO 50 mg TAB x 30","OMEPRAZOL 20 MG CAP X 8","OMEPRAZOL 20 mg CAP X 30","CANDESARTAN 16 MG TAB X 10","MONTELUKAST 10mg TAB REC X 10","MONTELUKAST 5mg TAB MAST X 10","MONTELUKAST 5 MG TAB MAST X 30","MONTELUKAST 10 MG TAB X 30","IBUPROFENO 200mg TAB REC X 10","FLAVOXATO 200 MG X 10","AMLODIPINO 10mg TAB X 30","CARVEDILOL 6,25 mg X 30","OLMESARTAN 20mg TAB REC X 30","OLMESARTAN 40mg TAB REC X 30","OLMESARTAN 20mg TAB x 10","OLMESARTAN 40mg TAB x 10","OLMESARTAN + HCTZ 40/12,5 MG TAB X 10","OLMESARTAN+HCTZ 40-12,5 MG TAB REC X 30","AMLODIPINA 5mg COMP X 30","LOSARTAN+HCTZ 100-25mg TAB R X 30","LOSARTAN + HCTZ 100/25MG TAB X 10","LOSARTAN POTASICO 100 MG TAB  REC  X 10","LOSARTAN POTASICO 50mg TAB REC X 30","LOSARTAN POTASICO 50 MG TAB X 14","LOSARTAN POTASICO 50 MG TAB X 10","VALSARTAN 80MG TAB X 30","VALSARTAN 80 MG TAB X14  ","VALSARTAN+HCTZ 80/12,5MG TAB X14 ","VALSARTAN + HCTZ 160mg -12,5mg TAB x 14","VALSARTAN + HCT 80/12,5MG TAB X 30","VALSARTAN 80 MG + AMLODIPINA 5 MG X 10","VALSARTAN+AMLODIPINA 80-5MG TAB X 30","VALSARTAN 160 MG + AMLODIPINA 10 MG X 10","ESOMEPRAZOL 20mg TAB REC X 14 VEN","ESOMEPRAZOL 40mg TAB REC X 14 VEN","CIPROFIBRATO 100 mg TAB X 30","KETOROLACO 30MG X 4 TAB ","FEXOFENADINA SUSP 120 MG X 5 ML","FEXOFENADINA 120MG X 10 TAB REC ","OMEPRAZOL 40 MG CAP X 30","METRONIDAZOL 500 MG X10","NITAZOXANIDA 500MG X6 TAB VZL","CANDESARTAN 8 MG TAB X 10","CANDESARTAN 8 MG TAB X 30","DOMPERIDONA 10 MG X 30","LEVOSULPIRIDE 25 MG X 30","CAPTOPRIL 50mg TAB X 30","IRBESARTAN 300 mg TAB x 10","LEVOFLOXACINA 500 MG X 7","ROSUVASTATINA 10 MG X 10","ROSUVASTATINA 20 X 10","ROSUVASTATINA 10 MG TAB X 30","ROSUVASTATINA 20 MG TAB X 30","TERBINAFINA 250 MG X 14TAB","TRIMEBUTINA MALEATO 200 MG TAB X 30","TRIMEBUTINA MALEATO 200 MG TAB x 10","TIOCOLCHICOSIDO 4MG TAB CJA X 10 VEN","NIFEDIPINA 10 MG CAP X 14","CIPROFLOXACINA 500 MG TAB x 10","ENALAPRIL 20 MG TAB X30","VALSARTAN 160MG TAB x 30","FUROATO DE MOMETASONA 0,05% NASAL x 18G","LORATADINA-PSEUDO 5-60mg/5mL  JBE x 60ML","DICLOFENAC POTASICO 50MG DISP TAB x 100","DICLOXACILINA 250 MG/ 5ML PPS X 80 ML","DICLOXACILINA 500 MG CAP X 50","GLUCO+CONDRO 1500/1200MG PPS X 15 ","ZOPICLONA 7,5MG TAB X 10","LACOSAMIDA 200 MG TAB X 30","LAMOTRIGINA 50 MG TAB X 30","LAMOTRIGINA 100 MG TAB X 30","LEVETIRACETAM 500 MG TAB X 30","LEVETIRACETAM 1000 MG TAB X 30","IVABRADINA 5 MG TAB X 30","CEFADROXILO 250 mg/5 mL PPS FCO X 60 mL VZL","CEFADROXILO 500 mg CAP X 12 VZLA","CLARITROMICINA 500 MG TAB X 10 VZL","VALSARTAN+AMLODIPINA 80-5MG TAB X 30","OLMESARTAN 20mg TAB REC X 10","OLMESARTAN 40mg TAB REC X 10","ATORVASTATINA 40 mg TAB  X 14","ATORVASTATINA 20 MG TAB X 14 VZLA","GLIMEPIRIDE 2 MG TAB X 30","GLIMEPIRIDE 2 MG TAB X 16","GLIMEPIRIDE 4 MG TAB X 16","CLOPIDOGREL 75 mg X 14 TAB","CLOPIDOGREL 75mg TAB REC X 30","IRBESARTAN 150 MG TAB X 10","IRBESARTAN 150 mg TAB x 30","IRBESARTAN 300 mg TAB X 10","ROSUVASTATINA 10 MG X 10","ROSUVASTATINA 10 MG X 30","ROSUVASTATINA 20 MG X 10","ROSUVASTATINA 20 MG X 30","CIPROFIBRATO 100 mg TAB X 30","TRIMEBUTINA 200 MG TAB X 30","DIOSMINA-HESPERIDINA 450-50 mg TAB x 10","LOSARTAN + HCTZ 50/12,5MG TAB X 30","VALSARTAN+AMLODIPINA 80-5MG TAB X 10","VALSARTAN 160 MG + AMLODIPINA 10 MG X 10","VALSARTAN 80 MG TAB X 14","VALSARTAN 80MG TAB X 30","OLMESARTAN HCTZ 40 X 12,5 X 10","OLMESARTAN 20mg TAB REC X 30","OLMESARTAN 40mg TAB REC X 30","ATORVASTATINA 40 mg TAB  X 30","ATORVASTATINA 20 MG TAB X 30","LOSARTAN + HCTZ 100/25MG TAB X 30","LOSARTAN + HCTZ 100/25MG TAB X 10","LOSARTAN + HCTZ 50/12,5MG TAB X 15","DIOSMINA-HESPERIDINA 450-50 mg TAB x 30","DICIGEL REF SUSP X 240 mL","ESOZ 40 mg CAP x 28","OMEPRAZOL 20 MG CAP X 8","ANALPER FEM PLU 200 mg-10 mg TAB X10 VEN","ANALPER PLUS 500mg-10mg TAB x 10 REFORM","LEVOSULPIRIDE TABL 25 MG x 30","Leprit 25 Mg Tab X 30","BUMETIN TAB 300MGX20","RIXIGAL 550MG X 14TAB REC","PROLARDII x 10 SOBRES","XEROGRAX 120 mg CAP X 30","GLIMEPIRIDE TABL 2 MG x 30","GLIMERID 4 MG TAB X 30","AIREX 0,05% X 15ML","DESLER M 5mg - 10mg TAB REC X 10","DESLER M 5mg - 10mg TAB x 30","SINUX 5 MG-60 MG TAB REC X 10","BUCOXOLGAR 3mg-1mg MENTA TAB MAST X 10","MONUKAST 5 MG TAB MASTICABLE X 30","MONTELUKAST 10mg TAB REC X 10","PULMOLIX 600MG SOBRES X 10 VNZ","BROXOL FLEM 750 mg/15 ml JBE X 120 ml AD","BROXOL S/ALCOHOL S/AZUCAR AD JBEx120 ml","CETIRIZINA 10 mg TAB X 10","DESLER 5 MG X 10 TABLETAS","ALLERFEX 120MG X 10TAB"
].map((p, i) => ({ id: `prod_real_${i}`, name: p, barcode: '' }));

// --- COMPONENTE ENVOLTORIO ---
export default function App() {
  useEffect(() => {
    document.title = "NexaStock | Inventarios";
    const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/svg+xml'; link.rel = 'icon';
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

  // Función para forzar la carga de datos reales (Expuesta en Login)
  const forceSyncRealData = async () => {
    if(!confirm('Esto borrará los usuarios, tiendas y productos actuales y cargará la base de datos oficial. ¿Continuar?')) return;
    try {
      const delDocs = async (list, colName) => {
        for (let item of list) await deleteDoc(getDocRef(colName, item.id));
      };
      await delDocs(usersList, 'inv_users');
      await delDocs(storesList, 'inv_stores');
      await delDocs(productsList, 'inv_products');

      const batchCreate = async (list, colName) => {
        for (let item of list) await setDoc(getDocRef(colName, item.id), item);
      };
      await batchCreate(REAL_USERS, 'inv_users');
      await batchCreate(REAL_STORES, 'inv_stores');
      await batchCreate(REAL_PRODUCTS, 'inv_products');
      
      alert('¡Base de datos actualizada con éxito! La página se recargará.');
      window.location.reload();
    } catch (e) { alert('Error: ' + e.message); }
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
      if (data.length === 0) REAL_USERS.forEach(u => setDoc(getDocRef('inv_users', u.id), u));
      setUsersList(data);
    }, (err) => setSystemError(`Error BD: ${err.message}`)));

    unsubs.push(onSnapshot(getCollectionRef('inv_stores'), (snap) => setStoresList(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
    unsubs.push(onSnapshot(getCollectionRef('inv_products'), (snap) => setProductsList(snap.docs.map(d => ({ id: d.id, ...d.data() })))));
    unsubs.push(onSnapshot(getCollectionRef('inv_submissions'), (snap) => setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => b.timestamp - a.timestamp))));

    if (!document.getElementById('html5-qrcode-script')) {
      const script = document.createElement('script');
      script.id = 'html5-qrcode-script'; script.src = 'https://unpkg.com/html5-qrcode'; script.async = true;
      document.body.appendChild(script);
    }
    return () => unsubs.forEach(unsub => unsub());
  }, [user]);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!profile) return <LoginScreen usersList={usersList} onSelectProfile={handleSetProfile} systemError={systemError} forceSyncRealData={forceSyncRealData} />;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      <header className="bg-indigo-700 text-white p-4 shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm shadow-inner shrink-0">
              {profile.role === 'admin' ? <LayoutDashboard size={24} className="text-white" /> : <Store size={24} className="text-white" />}
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2 leading-none mb-1">
                {profile.role === 'admin' ? 'Panel Admin' : 'NexaStock'}
                <span className="bg-indigo-900/50 text-indigo-100 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider">{APP_VERSION}</span>
              </h1>
              <p className="text-xs text-indigo-200 font-bold tracking-wide">Sesión: {profile.name}</p>
            </div>
          </div>
          <button onClick={() => handleSetProfile(null)} className="bg-indigo-800 p-3 rounded-2xl hover:bg-rose-500 hover:text-white transition-colors shadow-sm" title="Cerrar Sesión">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto p-0 md:p-4 pb-28 md:pb-6 relative">
        {systemError && (
          <div className="m-4 mb-2 md:m-0 md:mb-6 bg-rose-50 text-rose-800 p-4 rounded-2xl shadow-sm flex items-start gap-3 border border-rose-200">
            <AlertCircle className="shrink-0 mt-0.5 text-rose-500" />
            <p className="text-sm font-bold">{systemError}</p>
          </div>
        )}

        {profile.role === 'admin' ? (
          <AdminDashboard submissions={submissions} stores={storesList} products={productsList} users={usersList} getCollectionRef={getCollectionRef} getDocRef={getDocRef} forceSyncRealData={forceSyncRealData} />
        ) : (
          <RepApp profile={profile} stores={storesList} products={productsList} submissions={submissions} getCollectionRef={getCollectionRef} />
        )}
      </main>
    </div>
  );
}

// --- PANTALLA DE INICIO DE SESIÓN ---
function LoginScreen({ usersList, onSelectProfile, systemError, forceSyncRealData }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [password, setPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const filteredUsers = usersList.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleLogin = (e) => {
    e.preventDefault();
    setPassError('');
    if (password === selectedUser.password) onSelectProfile(selectedUser);
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
                <input type="text" placeholder="Buscar mi usuario..." className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-900 font-medium transition-all shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
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
        
        {/* BOTÓN DE EMERGENCIA AÑADIDO AQUÍ */}
        <div className="text-center mt-6 flex flex-col items-center gap-3">
          <p className="text-slate-400 text-xs font-bold tracking-widest">VERSIÓN {APP_VERSION}</p>
          <button onClick={forceSyncRealData} className="text-[11px] text-rose-600 font-black border-2 border-rose-200 bg-rose-50 px-4 py-2 rounded-xl hover:bg-rose-600 hover:text-white transition-colors shadow-sm flex items-center gap-2">
            <AlertCircle size={14} /> Forzar Actualización de BD
          </button>
        </div>

      </div>
    </div>
  );
}

// --- VISTA DEL VENDEDOR (SELECCIÓN DE RUTA E HISTORIAL) ---
function RepApp({ profile, stores, products, submissions, getCollectionRef }) {
  const [selectedStore, setSelectedStore] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('stores'); 

  const myStores = stores.filter(s => s.assignedTo === profile.name);
  const filteredStores = myStores.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const mySubmissions = submissions.filter(s => s.repId === profile.id || s.repName === profile.name);

  if (selectedStore) return <InventoryForm store={selectedStore} products={products} profile={profile} getCollectionRef={getCollectionRef} onBack={() => setSelectedStore(null)} />;

  return (
    <div className="flex flex-col min-h-full pb-20 relative">
      <div className="flex-1 space-y-6 max-w-lg mx-auto w-full p-4 md:p-0">
        
        {activeTab === 'stores' ? (
          <>
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
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                        <Store size={28} />
                      </div>
                      <div>
                        <h3 className="font-black text-slate-900 text-lg leading-tight mb-1">{store.name}</h3>
                        <p className="text-sm text-slate-500 font-medium truncate max-w-[200px]">{store.address || 'Sin dirección'}</p>
                      </div>
                    </div>
                    <button onClick={() => setSelectedStore(store)} className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors text-center shadow-md">
                      Inventariar
                    </button>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-black text-slate-900 mb-2">Mi Historial</h2>
              <p className="text-sm text-slate-500 font-medium">Reportes enviados por ti (Solo lectura).</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              {mySubmissions.length === 0 ? (
                <p className="text-center text-slate-500 py-10 font-bold">Aún no has enviado reportes.</p>
              ) : (
                mySubmissions.map(sub => (
                  <div key={sub.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col gap-3">
                    <div className="flex justify-between items-start gap-2 border-b border-slate-100 pb-3">
                      <h3 className="font-black text-slate-900 leading-tight text-lg">{sub.storeName}</h3>
                      <span className="text-xs font-bold text-slate-400 shrink-0 text-right">
                        {new Date(sub.timestamp).toLocaleDateString()}<br/>
                        {new Date(sub.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="space-y-1 mt-1">
                      {sub.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded-lg text-sm">
                          <span className="font-bold text-slate-700 truncate mr-2">{item.productName}</span>
                          <div className="flex gap-2 shrink-0">
                            {item.price > 0 && <span className="text-emerald-600 font-bold">${item.price}</span>}
                            <span className="text-indigo-600 font-black bg-indigo-100 px-2 rounded">x{item.quantity}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-2 flex justify-around items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50 safe-area-pb">
        <button onClick={() => setActiveTab('stores')} className={`flex flex-col items-center gap-1 p-2 w-24 rounded-2xl transition-all ${activeTab === 'stores' ? 'text-indigo-700' : 'text-slate-400'}`}>
          <div className={`${activeTab === 'stores' ? 'bg-indigo-100 p-2 rounded-xl scale-110 shadow-sm' : 'p-2'}`}><Store size={20}/></div>
          <span className="text-[10px] font-bold">Mis Rutas</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={`flex flex-col items-center gap-1 p-2 w-24 rounded-2xl transition-all ${activeTab === 'history' ? 'text-indigo-700' : 'text-slate-400'}`}>
          <div className={`${activeTab === 'history' ? 'bg-indigo-100 p-2 rounded-xl scale-110 shadow-sm' : 'p-2'}`}><History size={20}/></div>
          <span className="text-[10px] font-bold">Mi Historial</span>
        </button>
      </div>
    </div>
  );
}

// --- FORMULARIO DE INVENTARIO CON PRECIO ---
function InventoryForm({ store, products, profile, getCollectionRef, onBack }) {
  const [items, setItems] = useState([]); 
  const [searchTerm, setSearchTerm] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [scanToast, setScanToast] = useState(null); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('catalog'); 
  const toastTimer = useRef(null);
  const itemsRef = useRef(items);

  useEffect(() => { itemsRef.current = items; }, [items]);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || (p.barcode && p.barcode.includes(searchTerm)));

  const handleAddProduct = (product, qtyStr, priceStr) => {
    setErrorMsg('');
    const qty = parseInt(qtyStr, 10);
    const price = parseFloat(priceStr);
    
    const hasQty = !isNaN(qty) && qty > 0;
    const hasPrice = !isNaN(price) && price > 0;

    if (!hasQty && !hasPrice) return setErrorMsg(`Debe ingresar Cantidad o Precio para ${product.name}`);
    if (hasPrice && !hasQty) return setErrorMsg(`Para reportar precio de ${product.name}, DEBE indicar la cantidad en inventario.`);

    if (items.some(i => i.product.id === product.id)) return setErrorMsg(`${product.name} ya está en la lista.`);
    
    setItems([{ product, qty: hasQty ? qty : 0, price: hasPrice ? price : null }, ...items]);
    setSearchTerm(''); 
    setActiveTab('cart'); 
  };

  const handleRemoveItem = (productId) => setItems(items.filter(i => i.product.id !== productId));

  const handleSubmit = async () => {
    if (items.length === 0) return setErrorMsg("La lista está vacía.");
    setIsSubmitting(true);
    try {
      await addDoc(getCollectionRef('inv_submissions'), {
        repId: profile.id, repName: profile.name, storeId: store.id, storeName: store.name,
        timestamp: Date.now(), dateString: new Date().toLocaleDateString(),
        items: items.map(i => ({ productId: i.product.id, productName: i.product.name, quantity: i.qty, price: i.price }))
      });
      alert("¡Reporte enviado con éxito!"); 
      onBack();
    } catch (err) { setErrorMsg("Error de red al guardar."); setIsSubmitting(false); }
  };

  const onScanContinuous = (decodedText) => {
    const found = products.find(p => p.barcode === decodedText);
    if (found) {
      const existingItem = itemsRef.current.find(i => i.product.id === found.id);
      const newTotal = existingItem ? existingItem.qty + 1 : 1;
      setItems(prev => {
        const exists = prev.find(i => i.product.id === found.id);
        if (exists) return prev.map(i => i.product.id === found.id ? { ...i, qty: exists.qty + 1 } : i);
        return [{ product: found, qty: 1, price: null }, ...prev];
      });
      setScanToast({ type: 'success', text: `+1 ${found.name} (Llevas: ${newTotal})`, id: Date.now() });
    } else {
      setScanToast({ type: 'error', text: `Código no existe`, id: Date.now() });
    }
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setScanToast(null), 2000);
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

        <div className="flex border-b border-slate-200">
          <button onClick={() => setActiveTab('catalog')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'catalog' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <ListPlus size={18}/> Catálogo
          </button>
          <button onClick={() => setActiveTab('cart')} className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === 'cart' ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <ClipboardList size={18}/> Lista <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md text-xs">{items.reduce((acc, i) => acc + i.qty, 0)}</span>
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
                  <div key={p.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-2">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <p className="font-black text-slate-800 text-sm leading-tight flex-1">{p.name}</p>
                      <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-md border border-slate-100 whitespace-nowrap">Cod: {p.barcode || 'S/N'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <DollarSign className="absolute left-2.5 top-2.5 text-emerald-500" size={16} />
                        <input type="number" step="0.01" id={`price-${p.id}`} placeholder="Precio" className="w-full pl-8 pr-2 h-10 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-emerald-700 focus:ring-2 focus:ring-indigo-600 outline-none" />
                      </div>
                      <input type="number" id={`qty-${p.id}`} placeholder="Cant" min="1" className="w-20 h-10 border border-slate-200 bg-slate-50 rounded-xl text-center font-black text-slate-800 focus:ring-2 focus:ring-indigo-600 outline-none" />
                      <button onClick={() => handleAddProduct(p, document.getElementById(`qty-${p.id}`).value, document.getElementById(`price-${p.id}`).value)} className="bg-indigo-100 text-indigo-700 w-10 h-10 rounded-xl hover:bg-indigo-600 hover:text-white flex items-center justify-center font-bold transition-colors shrink-0">
                        <Plus size={20} />
                      </button>
                    </div>
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
                  <div className="flex-1 pr-4">
                    <p className="font-black text-slate-800 text-sm leading-tight mb-2">{item.product.name}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {item.price > 0 && <span className="bg-emerald-50 text-emerald-700 font-bold text-xs px-2 py-1 rounded-lg border border-emerald-200">Precio: ${item.price}</span>}
                      <span className="bg-slate-100 text-slate-800 font-bold text-xs px-2 py-1 rounded-lg border border-slate-200">Cant: <span className="font-black">{item.qty}</span></span>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveItem(item.product.id)} className="text-rose-500 bg-rose-50 p-2 hover:bg-rose-100 rounded-xl shrink-0">
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

      {showScanner && <BarcodeScannerModal onClose={() => setShowScanner(false)} onScan={onScanContinuous} scanToast={scanToast} />}
    </div>
  );
}

function BarcodeScannerModal({ onClose, onScan, scanToast }) {
  const [error, setError] = useState('');

  useEffect(() => {
    let html5QrCode; let lastScan = ''; let lastTime = 0;
    const initScanner = async () => {
      const el = document.getElementById('qr-reader');
      if (!el || !window.Html5Qrcode) return setTimeout(initScanner, 500);
      html5QrCode = new window.Html5Qrcode("qr-reader");
      const config = { fps: 10, qrbox: { width: 250, height: 250 } };
      const successCb = (text) => { 
        const now = Date.now();
        if (text === lastScan && now - lastTime < 1000) return;
        lastScan = text; lastTime = now; onScan(text); 
      };
      try { await html5QrCode.start({ facingMode: "environment" }, config, successCb, ()=>{}); } 
      catch (err1) {
        try {
          const devices = await window.Html5Qrcode.getCameras();
          if (devices && devices.length > 0) await html5QrCode.start(devices[0].id, config, successCb, ()=>{});
          else throw new Error("No cámaras");
        } catch (err2) { setError("Acceso a cámara denegado."); }
      }
    };
    initScanner();
    return () => { if (html5QrCode && html5QrCode.isScanning) html5QrCode.stop().catch(()=>{}); };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-sm z-50 flex flex-col">
      <div className="p-4 flex justify-between items-center text-white">
        <h3 className="font-bold">Escanear Rápido</h3>
        <button onClick={onClose} className="p-2 bg-white/20 rounded-full"><X size={20} /></button>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {scanToast && <div key={scanToast.id} className={`absolute top-10 z-50 px-6 py-3 rounded-full shadow-2xl font-black text-lg animate-fade-in ${scanToast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>{scanToast.text}</div>}
        {error ? <div className="text-rose-400 bg-rose-500/10 p-6 rounded-3xl text-center font-bold max-w-xs border border-rose-500/20"><AlertCircle className="mx-auto mb-2" size={32} />{error}</div> : <div id="qr-reader" className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl bg-black aspect-square border-2 border-slate-700"></div>}
      </div>
      <div className="p-8 text-center text-slate-300 font-medium text-sm">Escaneo continuo activado.<br/>Pase los códigos frente a la cámara.</div>
    </div>
  );
}

// --- PANEL DE CONTROL ADMINISTRADOR ---
function AdminDashboard({ submissions, stores, products, users, getCollectionRef, getDocRef, forceSyncRealData }) {
  const [activeTab, setActiveTab] = useState('live'); 

  useEffect(() => { window.scrollTo(0,0); }, [activeTab]);

  return (
    <div className="bg-slate-100 flex flex-col min-h-screen relative">
      <div className="flex-1 p-3 md:p-8 pb-32 md:pb-24 max-w-7xl mx-auto w-full">
        {activeTab === 'live' && <AdminLiveView submissions={submissions} getDocRef={getDocRef} />}
        {activeTab === 'stores' && <CatalogManager title="Farmacias" col="inv_stores" data={stores} fields={[{k: 'name', l: 'Nombre'}, {k: 'address', l: 'Dirección'}, {k: 'assignedTo', l: 'Vendedor', type: 'select', opts: users.filter(u=>u.role==='rep').map(u=>u.name)}]} getRef={getCollectionRef} getDoc={getDocRef} />}
        {activeTab === 'products' && <CatalogManager title="Productos" col="inv_products" data={products} fields={[{k: 'name', l: 'Producto'}, {k: 'barcode', l: 'Cód. Barras'}]} getRef={getCollectionRef} getDoc={getDocRef} />}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <CatalogManager title="Equipo" col="inv_users" data={users} fields={[{k: 'name', l: 'Nombre'}, {k: 'role', l: 'Rol', type: 'select', opts: ['admin', 'rep']}, {k: 'password', l: 'Clave'}]} getRef={getCollectionRef} getDoc={getDocRef} />
            <div className="max-w-6xl mx-auto bg-rose-50 border border-rose-200 p-6 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <h4 className="font-black text-rose-800 text-lg">Zona de Peligro (Carga Inicial)</h4>
                <p className="text-sm text-rose-700 font-medium mt-1">Si la base de datos tiene datos de prueba viejos, presione aquí para limpiar y cargar el personal, productos y farmacias reales de NexaStock.</p>
              </div>
              <button onClick={forceSyncRealData} className="w-full sm:w-auto shrink-0 bg-rose-600 text-white px-6 py-3 rounded-xl font-black shadow-md hover:bg-rose-700 transition-colors">Formatear y Cargar Datos Reales</button>
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-2 md:p-3 flex justify-around items-center shadow-[0_-5px_20px_rgba(0,0,0,0.05)] z-50 safe-area-pb">
        <TabButton icon={<LayoutDashboard size={20}/>} label="Inventario" active={activeTab === 'live'} onClick={() => setActiveTab('live')} />
        <TabButton icon={<Store size={20}/>} label="Farmacias" active={activeTab === 'stores'} onClick={() => setActiveTab('stores')} />
        <TabButton icon={<Package size={20}/>} label="Productos" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
        <TabButton icon={<Users size={20}/>} label="Equipo" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
      </div>
    </div>
  );
}

function TabButton({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 w-20 rounded-2xl transition-all ${active ? 'text-indigo-700' : 'text-slate-400 hover:text-slate-600'}`}>
      <div className={`${active ? 'bg-indigo-100 p-2 rounded-xl scale-110 shadow-sm' : 'p-2'}`}>{icon}</div>
      <span className="text-[10px] md:text-xs font-bold truncate w-full text-center">{label}</span>
    </button>
  );
}

// --- VISTA INVENTARIO ADMINISTRADOR ---
function AdminLiveView({ submissions, getDocRef }) {
  const [filterStore, setFilterStore] = useState('');
  const [filterRep, setFilterRep] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null); 

  const groupedData = useMemo(() => {
    const groups = {};
    submissions.forEach(sub => {
      const dateStr = new Date(sub.timestamp).toLocaleDateString();
      const key = `${sub.storeId}-${dateStr}`;
      
      if (!groups[key]) {
        groups[key] = { id: key, storeName: sub.storeName, reps: new Set(), dateStr: dateStr, timestamp: sub.timestamp, itemsMap: {}, rawSubmissions: [] };
      }
      groups[key].reps.add(sub.repName);
      if (sub.timestamp > groups[key].timestamp) groups[key].timestamp = sub.timestamp; 
      groups[key].rawSubmissions.push(sub); 

      sub.items.forEach(item => {
        if (!groups[key].itemsMap[item.productId]) groups[key].itemsMap[item.productId] = { ...item };
        else groups[key].itemsMap[item.productId].quantity += item.quantity;
      });
    });

    return Object.values(groups).map(g => ({
      ...g, repNames: Array.from(g.reps).join(', '), mergedItems: Object.values(g.itemsMap)
    })).sort((a,b) => b.timestamp - a.timestamp);
  }, [submissions]);

  const uniqueStores = [...new Set(groupedData.map(s => s.storeName))].filter(Boolean);

  const filteredData = groupedData.filter(g => {
    const matchStore = filterStore ? g.storeName === filterStore : true;
    const matchRep = filterRep ? g.repNames.includes(filterRep) : true;
    const matchDate = filterDate ? new Date(g.timestamp).toISOString().split('T')[0] === filterDate : true;
    return matchStore && matchRep && matchDate;
  });

  const activeFiltersCount = (filterStore ? 1 : 0) + (filterRep ? 1 : 0) + (filterDate ? 1 : 0);

  const downloadCSV = () => {
    let csv = "Fecha,Hora,Vendedor,Farmacia,Producto,Cantidad,Precio\n";
    submissions.forEach(sub => {
      const date = new Date(sub.timestamp);
      sub.items.forEach(item => {
        const cleanStore = `"${sub.storeName.replace(/"/g, '""')}"`;
        const cleanProduct = `"${item.productName.replace(/"/g, '""')}"`;
        const priceStr = item.price ? item.price : '';
        csv += `${date.toLocaleDateString()},${date.toLocaleTimeString()},"${sub.repName}",${cleanStore},${cleanProduct},${item.quantity},${priceStr}\n`;
      });
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob); link.download = `Reporte_NexaStock_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleSelectGroup = (group) => { setSelectedGroup(group); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleDeleteItem = async (subId, productId) => {
    if(!confirm('¿Eliminar este producto del reporte?')) return;
    try {
      const sub = submissions.find(s => s.id === subId);
      const newItems = sub.items.filter(i => i.productId !== productId);
      if(newItems.length === 0) await deleteDoc(getDocRef('inv_submissions', subId));
      else await updateDoc(getDocRef('inv_submissions', subId), { items: newItems });
      if(newItems.length === 0) setSelectedGroup(null);
    } catch(e) { alert("Error al eliminar"); }
  };

  const handleEditItem = async (subId, item) => {
    const newQtyStr = prompt(`Nueva cantidad para ${item.productName}:`, item.quantity);
    if(newQtyStr === null) return;
    const newPriceStr = prompt(`Nuevo precio para ${item.productName} (Deje vacío si no aplica):`, item.price || '');
    if(newPriceStr === null) return;

    const newQty = parseInt(newQtyStr, 10);
    const newPrice = parseFloat(newPriceStr);
    if(isNaN(newQty) || newQty <= 0) return alert("Cantidad inválida");

    try {
      const sub = submissions.find(s => s.id === subId);
      const newItems = sub.items.map(i => i.productId === item.productId ? { ...i, quantity: newQty, price: isNaN(newPrice) ? null : newPrice } : i);
      await updateDoc(getDocRef('inv_submissions', subId), { items: newItems });
    } catch(e) { alert("Error al editar"); }
  };

  if (selectedGroup) {
    const freshGroupSubs = submissions.filter(s => selectedGroup.rawSubmissions.some(rs => rs.id === s.id));
    if (freshGroupSubs.length === 0) { setSelectedGroup(null); return null; }

    return (
      <div className="space-y-4 animate-fade-in max-w-3xl mx-auto">
        <button onClick={() => setSelectedGroup(null)} className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 px-4 py-2.5 rounded-xl w-fit hover:bg-indigo-100 transition-colors shadow-sm">
          <ChevronLeft size={18} /> Volver a Inventario
        </button>
        <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-200">
          <div className="mb-6 border-b border-slate-100 pb-4">
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-1 rounded-md mb-2 inline-block">Edición de Reporte</span>
            <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight mb-3">{selectedGroup.storeName}</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <span className="bg-slate-100 text-slate-700 px-3 py-2 rounded-xl text-sm font-bold flex items-center gap-2"><LayoutDashboard size={16} className="text-slate-400"/> {selectedGroup.dateStr}</span>
            </div>
          </div>
          
          <div className="space-y-6">
            {freshGroupSubs.map(sub => (
              <div key={sub.id} className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex justify-between items-center">
                  <span className="font-bold text-slate-700 text-xs flex items-center gap-2"><Users size={14}/> {sub.repName} <span className="opacity-50">({new Date(sub.timestamp).toLocaleTimeString()})</span></span>
                </div>
                <div className="p-3 space-y-2">
                  {sub.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3 rounded-xl border border-slate-100 gap-3">
                      <div className="flex-1">
                        <span className="font-black text-slate-800 text-sm">{item.productName}</span>
                        <div className="flex gap-2 mt-1">
                          {item.price > 0 && <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">Precio: ${item.price}</span>}
                          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">Cant: {item.quantity}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 shrink-0 self-end sm:self-auto">
                        <button onClick={() => handleEditItem(sub.id, item)} className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-lg transition-colors"><Edit3 size={16}/></button>
                        <button onClick={() => handleDeleteItem(sub.id, item.productId)} className="bg-rose-50 hover:bg-rose-100 text-rose-500 p-2 rounded-lg transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight">Inventario Global</h2>
          <p className="text-xs md:text-sm text-slate-500 font-medium">Toca un reporte para editar precios o cantidades.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setShowFilters(!showFilters)} className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold transition-all border ${showFilters || activeFiltersCount > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 shadow-sm'}`}>
            <Filter size={18} /> Filtros {activeFiltersCount > 0 && <span className="bg-indigo-600 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center">{activeFiltersCount}</span>}
          </button>
          <button onClick={downloadCSV} className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold shadow-md transition-all">
            <Download size={18} /> CSV
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm animate-fade-in-up">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Farmacia</label>
            <select value={filterStore} onChange={e => setFilterStore(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="">Todas</option>
              {uniqueStores.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha Exacta</label>
            <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="w-full p-3 border border-slate-200 bg-slate-50 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:hidden gap-3">
        {filteredData.length === 0 ? <p className="text-center p-10 font-bold text-slate-400 bg-white rounded-3xl">Sin registros.</p> : (
          filteredData.map(group => (
            <div key={group.id} onClick={() => handleSelectGroup(group)} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col gap-3 active:scale-95 transition-transform">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-black text-slate-900 leading-tight text-lg">{group.storeName}</h3>
                <span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg text-xs font-black shrink-0">{group.mergedItems.length} items</span>
              </div>
              <div className="flex flex-col gap-1 mt-1">
                <span className="text-sm font-bold text-slate-600 flex items-center gap-2"><Users size={14} className="text-slate-400"/> {group.repNames}</span>
                <span className="text-sm font-bold text-slate-600 flex items-center gap-2"><LayoutDashboard size={14} className="text-slate-400"/> {group.dateStr}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:block border border-slate-200 rounded-3xl overflow-hidden shadow-sm bg-white">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <th className="p-5 font-bold uppercase text-xs">Fecha</th>
              <th className="p-5 font-bold uppercase text-xs">Farmacia</th>
              <th className="p-5 font-bold uppercase text-xs">Personal</th>
              <th className="p-5 font-bold uppercase text-xs text-center">Productos</th>
              <th className="p-5"></th>
            </tr>
          </thead>
          <tbody>
            {filteredData.length === 0 ? <tr><td colSpan="5" className="p-10 text-center font-bold text-slate-400">Sin registros.</td></tr> : (
              filteredData.map(group => (
                <tr key={group.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="p-5 font-bold text-slate-800">{group.dateStr}</td>
                  <td className="p-5 font-black text-slate-900">{group.storeName}</td>
                  <td className="p-5 font-bold text-slate-600">{group.repNames}</td>
                  <td className="p-5 text-center"><span className="bg-slate-100 font-black text-slate-700 px-3 py-1 rounded-lg">{group.mergedItems.length}</span></td>
                  <td className="p-5 text-right"><button onClick={() => handleSelectGroup(group)} className="bg-indigo-50 text-indigo-600 font-bold px-4 py-2 rounded-xl hover:bg-indigo-100 transition-colors">Gestionar</button></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- GESTOR DE CATÁLOGOS ---
function CatalogManager({ title, col, data, fields, getRef, getDoc }) {
  const [formData, setFormData] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDropdown, setFilterDropdown] = useState({});
  const [showForm, setShowForm] = useState(false);

  const filteredData = data.filter(item => {
    const matchesSearch = Object.values(item).some(val => String(val).toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDrops = fields.filter(f => f.type === 'select').every(f => !filterDropdown[f.k] || item[f.k] === filterDropdown[f.k]);
    return matchesSearch && matchesDrops;
  });

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) await updateDoc(getDoc(col, editingId), formData);
      else await addDoc(getRef(col), formData);
      setFormData({}); setEditingId(null); setShowForm(false);
    } catch (err) { alert("Error al guardar."); }
  };
  
  const handleDelete = async (id) => { if(confirm('¿Eliminar registro?')) await deleteDoc(getDoc(col, id)); };
  
  const handleEdit = (item) => { 
    setFormData(item); setEditingId(item.id); 
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-center bg-white p-5 lg:p-6 rounded-3xl shadow-sm border border-slate-200">
        <h2 className="text-xl lg:text-3xl font-black text-slate-900">{title}</h2>
        <button onClick={() => setShowForm(!showForm)} className="lg:hidden bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1 shadow-sm">
          {showForm ? <X size={16}/> : <Plus size={16}/>} {showForm ? 'Cerrar' : 'Nuevo'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-1 bg-white p-5 lg:p-6 rounded-3xl border border-slate-200 shadow-sm h-fit lg:sticky lg:top-24 ${showForm ? 'block' : 'hidden lg:block'}`}>
          <h3 className="font-black text-slate-800 mb-5">{editingId ? 'Editando Registro' : 'Nuevo Registro'}</h3>
          <form onSubmit={handleSave} className="space-y-4">
            {fields.map(f => (
              <div key={f.k}>
                <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{f.l}</label>
                {f.type === 'select' ? (
                  <select required value={formData[f.k] || ''} onChange={e => setFormData({...formData, [f.k]: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 bg-slate-50">
                    <option value="">Seleccione...</option>
                    {f.opts.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input type="text" required value={formData[f.k] || ''} onChange={e => setFormData({...formData, [f.k]: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-800 bg-slate-50" />
                )}
              </div>
            ))}
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-md">{editingId ? 'Actualizar' : 'Guardar'}</button>
              {editingId && <button type="button" onClick={() => {setEditingId(null); setFormData({}); setShowForm(false);}} className="px-5 bg-slate-100 text-slate-600 py-3 rounded-xl text-sm font-bold hover:bg-slate-200">Cancelar</button>}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
              <input type="text" placeholder="Búsqueda rápida..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-bold" />
            </div>
            {fields.filter(f => f.type === 'select').map(f => (
              <select key={`filter-${f.k}`} value={filterDropdown[f.k] || ''} onChange={(e) => setFilterDropdown({...filterDropdown, [f.k]: e.target.value})} className="w-full sm:w-auto p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Todo {f.l}</option>
                {f.opts.map(o => <option key={`opt-${o}`} value={o}>{o}</option>)}
              </select>
            ))}
          </div>

          <div className="grid grid-cols-1 md:hidden gap-3">
            {filteredData.length === 0 ? <p className="text-center p-10 font-bold text-slate-400 bg-white rounded-3xl">Sin datos.</p> : (
              filteredData.map(item => (
                <div key={item.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200 flex flex-col gap-2">
                  {fields.map(f => (
                    <div key={f.k} className="flex justify-between items-center border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                      <span className="text-[10px] uppercase font-bold text-slate-400">{f.l}</span>
                      <span className="font-bold text-slate-800 text-right truncate max-w-[65%] text-sm">{f.k === 'password' ? '••••••••' : item[f.k]}</span>
                    </div>
                  ))}
                  <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-slate-100">
                    <button onClick={() => handleEdit(item)} className="text-indigo-600 font-bold text-sm bg-indigo-50 px-5 py-2 rounded-xl">Editar</button>
                    <button onClick={() => handleDelete(item.id)} className="text-rose-500 font-bold text-sm bg-rose-50 p-2.5 rounded-xl"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))
            )}
          </div>

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