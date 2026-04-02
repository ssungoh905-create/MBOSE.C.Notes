import { useState, useEffect, useRef, createContext, useContext, ReactNode, FormEvent, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { 
  BookOpen, 
  Video, 
  Calculator, 
  MessageSquare, 
  ChevronRight, 
  Lock, 
  CheckCircle2, 
  Clock, 
  LogOut, 
  Settings, 
  ShieldCheck, 
  CreditCard, 
  AlertCircle,
  Send,
  Trash2,
  Plus,
  ArrowLeft,
  QrCode,
  Copy,
  ExternalLink,
  Menu,
  X,
  Users,
  Edit2,
  Search,
  Image as ImageIcon,
  Paperclip
} from "lucide-react";
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logout, 
  handleFirestoreError, 
  OperationType,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail
} from "./firebase";
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  addDoc, 
  serverTimestamp, 
  Timestamp,
  deleteDoc,
  limit,
  where,
  getDocs,
  getCountFromServer,
  writeBatch
} from "firebase/firestore";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";

/* ═══════════════════════════════════════════════
   Com.Mbose.Notes — MBOSE 2026 Class XII Commerce
═══════════════════════════════════════════════ */

const APP_NAME = "Com.Mbose.Notes";
const TAGLINE = "100% Important Notes Provided by MBOSE";
const OWNER_EMAIL = "ssungoh905@gmail.com";

/* ── Default chapter structure ── */
const CHAPTERS = {
  acc: {
    label: "Accountancy", icon: <BookOpen className="w-6 h-6" />, color: "#10b981",
    chapters: [
      { id: "a1",  title: "Not-for-Profit Organisations" },
      { id: "a2",  title: "Partnership Firms – Fundamentals" },
      { id: "a3",  title: "Admission of a Partner" },
      { id: "a4",  title: "Retirement & Death of a Partner" },
      { id: "a5",  title: "Dissolution of Partnership Firm" },
      { id: "a6",  title: "Issue & Forfeiture of Shares" },
      { id: "a7",  title: "Issue & Redemption of Debentures" },
      { id: "a8",  title: "Financial Statements of Companies" },
      { id: "a9",  title: "Analysis of Financial Statements" },
      { id: "a10", title: "Accounting Ratios" },
      { id: "a11", title: "Cash Flow Statement" },
    ]
  },
  bs: {
    label: "Business Studies", icon: <Calculator className="w-6 h-6" />, color: "#3b82f6",
    chapters: [
      { id: "b1",  title: "Nature & Significance of Management" },
      { id: "b2",  title: "Principles of Management" },
      { id: "b3",  title: "Business Environment" },
      { id: "b4",  title: "Planning" },
      { id: "b5",  title: "Organising" },
      { id: "b6",  title: "Staffing" },
      { id: "b7",  title: "Directing" },
      { id: "b8",  title: "Controlling" },
      { id: "b9",  title: "Financial Management" },
      { id: "b10", title: "Financial Markets" },
      { id: "b11", title: "Marketing Management" },
      { id: "b12", title: "Consumer Protection" },
    ]
  },
  eco: {
    label: "Economics", icon: <BookOpen className="w-6 h-6" />, color: "#f59e0b",
    chapters: [
      { id: "e1",  title: "Introduction to Microeconomics" },
      { id: "e2",  title: "Consumer Equilibrium & Demand" },
      { id: "e3",  title: "Producer Behaviour & Supply" },
      { id: "e4",  title: "Forms of Market & Price Determination" },
      { id: "e5",  title: "National Income & Related Aggregates" },
      { id: "e6",  title: "Money & Banking" },
      { id: "e7",  title: "Income Determination & Employment" },
      { id: "e8",  title: "Government Budget & the Economy" },
      { id: "e9",  title: "Balance of Payments & Exchange Rate" },
    ]
  },
  math: {
    label: "Mathematics", icon: <Calculator className="w-6 h-6" />, color: "#8b5cf6",
    chapters: [
      { id: "m1",  title: "Relations and Functions" },
      { id: "m2",  title: "Inverse Trigonometric Functions" },
      { id: "m3",  title: "Matrices & Determinants" },
      { id: "m4",  title: "Continuity & Differentiability" },
      { id: "m5",  title: "Application of Derivatives" },
      { id: "m6",  title: "Integrals & Applications" },
      { id: "m7",  title: "Differential Equations" },
      { id: "m8",  title: "Linear Programming" },
      { id: "m9",  title: "Probability" },
    ]
  },
  eng: {
    label: "English", icon: <BookOpen className="w-6 h-6" />, color: "#ef4444",
    chapters: [
      { id: "en1", title: "Flamingo – The Last Lesson" },
      { id: "en2", title: "Flamingo – Lost Spring" },
      { id: "en3", title: "Flamingo – Deep Water" },
      { id: "en4", title: "Flamingo – Indigo" },
      { id: "en5", title: "Poetry – My Mother at Sixty-Six" },
      { id: "en6", title: "Poetry – An Elementary School" },
      { id: "en7", title: "Vistas – The Third Level" },
      { id: "en8", title: "Writing Skills & Grammar" },
    ]
  },
  ent: {
    label: "Entrepreneurship", icon: <BookOpen className="w-6 h-6" />, color: "#0891b2",
    chapters: [
      { id: "ent1", title: "Concept of Entrepreneurship" },
      { id: "ent2", title: "Entrepreneurial Journey" },
      { id: "ent3", title: "Business Planning" },
      { id: "ent4", title: "Resource Mobilisation" },
    ]
  },
};

/* ── Context ── */
interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'student' | 'admin';
  paid?: boolean;
  accessUntil?: string;
  roll?: string;
  downloads?: { chapterId: string; timestamp: any }[];
}

interface AppConfig {
  price: number;
  days: number;
  currency: string;
  upiId: string;
  upiName: string;
  announcement?: string;
}

interface AppContextType {
  user: UserProfile | null;
  loading: boolean;
  config: AppConfig;
  subjects: Record<string, any>;
  isAdmin: boolean;
  hasAccess: boolean;
  pendingPayment: any | null;
  page: string;
  setPage: (p: string) => void;
  refreshUser: () => Promise<void>;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  confirm: (msg: string, onConfirm: () => void) => void;
  downloadNote: (chapterId: string) => Promise<void>;
  downloadStats: Record<string, number>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

/* ════════════════════════════════════════════════
   COMPONENTS
════════════════════════════════════════════════ */

const ErrorBoundary = ({ children }: { children: ReactNode }) => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      try {
        const parsed = JSON.parse(event.message);
        setError(parsed.error || "An unexpected error occurred.");
      } catch {
        setError(event.message);
      }
    };
    window.addEventListener("error", handleError);
    return () => window.removeEventListener("error", handleError);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-[#06090f] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-8">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-500 mb-2">Something went wrong</h2>
          <p className="text-slate-400 text-sm mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-red-500 text-white font-bold py-3 rounded-xl tap-active"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const Layout = ({ children, bg = "bg-[#08090f]" }: { children: ReactNode, bg?: string }) => {
  return (
    <div className={`min-h-screen ${bg} flex justify-center`}>
      <div className="w-full max-w-[430px] min-h-screen relative overflow-x-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
};

const LoadingScreen = () => (
  <div className="min-h-screen bg-[#06090f] flex flex-col items-center justify-center p-6 text-center">
    <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mb-6 animate-pulse">
      <BookOpen className="w-8 h-8 text-emerald-500" />
    </div>
    <h2 className="text-xl font-bold text-emerald-500 mb-2">Loading {APP_NAME}</h2>
    <p className="text-slate-500 text-sm">Preparing your study materials...</p>
  </div>
);

/* ════════════════════════════════════════════════
   PAGES
════════════════════════════════════════════════ */

const LandingPage = () => {
  const { setPage, config } = useApp();
  return (
    <Layout>
      <div className="flex-1 bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent p-6 pt-16 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl mx-auto flex items-center justify-center shadow-2xl shadow-emerald-500/20 mb-6">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">{APP_NAME}</h1>
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-1.5 mb-6">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">{TAGLINE}</span>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed max-w-[280px] mx-auto">
            MBOSE 2026 · Class XII Commerce<br />
            The ultimate study companion for Meghalaya students.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { icon: <BookOpen />, title: "Notes", desc: "PDF Downloads" },
            { icon: <Video />, title: "Videos", desc: "Expert Lectures" },
            { icon: <Calculator />, title: "Formulas", desc: "Quick Reference" },
            { icon: <MessageSquare />, title: "Chat", desc: "Student Group" }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 text-left"
            >
              <div className="text-emerald-500 mb-2">{item.icon}</div>
              <div className="text-white font-bold text-sm">{item.title}</div>
              <div className="text-slate-500 text-[10px] mt-1">{item.desc}</div>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-6 mb-8"
        >
          <div className="text-slate-500 text-xs mb-1">One-time payment · Full access</div>
          <div className="text-5xl font-black text-emerald-500 mb-1">{config.currency}{config.price}</div>
          <div className="text-slate-500 text-sm mb-6">{config.days} days · All Subjects</div>
          <button 
            onClick={() => setPage("auth")}
            className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-emerald-500/20 tap-active"
          >
            Get Started Now
          </button>
        </motion.div>

        <div className="space-y-4 mb-12">
          <h3 className="text-white font-bold text-sm text-left px-2">How it works</h3>
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-4 text-left">
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 font-bold text-xs shrink-0">1</div>
              <div>
                <div className="text-white font-bold text-xs">Create Account</div>
                <div className="text-slate-500 text-[10px] mt-0.5">Sign up with your email or Google account.</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 font-bold text-xs shrink-0">2</div>
              <div>
                <div className="text-white font-bold text-xs">Scan & Pay</div>
                <div className="text-slate-500 text-[10px] mt-0.5">Scan the UPI QR code and pay the one-time fee.</div>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 font-bold text-xs shrink-0">3</div>
              <div>
                <div className="text-white font-bold text-xs">Get Access</div>
                <div className="text-slate-500 text-[10px] mt-0.5">Submit your UTR/Txn ID. Admin will approve within 24h.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-slate-600 text-[10px] uppercase tracking-widest pb-12">
          © 2026 {APP_NAME} · MBOSE Class XII
        </div>
      </div>
    </Layout>
  );
};

const AuthPage = () => {
  const { refreshUser, showToast } = useApp() as any;
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const createUserProfile = async (user: any, displayName?: string) => {
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      const q = query(collection(db, "users"), where("email", "==", user.email));
      const snap = await getDocs(q);
      
      let initialPaid = false;
      let initialAccessUntil = null;
      
      if (!snap.empty) {
        const placeholderData = snap.docs[0].data();
        initialPaid = placeholderData.paid || false;
        initialAccessUntil = placeholderData.accessUntil || null;
        if (snap.docs[0].id !== user.uid) {
          await deleteDoc(doc(db, "users", snap.docs[0].id));
        }
      }

      await setDoc(userDocRef, {
        uid: user.uid,
        name: displayName || user.displayName || "Student",
        email: user.email,
        role: user.email === OWNER_EMAIL ? "admin" : "student",
        paid: initialPaid,
        accessUntil: initialAccessUntil,
        createdAt: serverTimestamp(),
        lastActive: serverTimestamp(),
        downloads: []
      });
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await loginWithGoogle();
      await createUserProfile(result.user);
    } catch (err: any) {
      setError(err.message || "Failed to login with Google");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (isSignUp && !name) return;
    
    setLoading(true);
    setError(null);
    try {
      if (isSignUp) {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
        await createUserProfile(result.user, name);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      showToast("Password reset email sent! Please check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-md bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-4">
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              {isSignUp ? "Create Account" : "Student Login"}
            </h2>
            <p className="text-slate-500 text-sm">
              {isSignUp ? "Join us to access study materials" : "Welcome back to your study portal"}
            </p>
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="text-slate-500 text-[10px] font-bold uppercase mb-2 block ml-1">Full Name</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/30 transition-all"
                />
              </div>
            )}
            <div>
              <label className="text-slate-500 text-[10px] font-bold uppercase mb-2 block ml-1">Email Address</label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/30 transition-all"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2 ml-1">
                <label className="text-slate-500 text-[10px] font-bold uppercase">Password</label>
                {!isSignUp && (
                  <button 
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-emerald-500 text-[10px] font-bold uppercase hover:underline"
                  >
                    Forgot?
                  </button>
                )}
              </div>
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/30 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] p-3 rounded-xl font-medium">
                {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl tap-active disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20"
            >
              {loading ? "Processing..." : (isSignUp ? "Sign Up" : "Sign In")}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold">
              <span className="bg-slate-900 px-4 text-slate-600">Or continue with</span>
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-slate-900 font-bold py-4 rounded-xl flex items-center justify-center gap-3 tap-active disabled:opacity-50 transition-all"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Google
          </button>

          <div className="mt-8 text-center">
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-emerald-500 text-xs font-bold hover:underline"
            >
              {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

const PaymentPage = () => {
  const { config, user, setPage, showToast } = useApp();
  const [txnId, setTxnId] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(config.upiId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement("textarea");
      textArea.value = config.upiId;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed', err);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleSubmit = async () => {
    if (!txnId.trim() || !user) return;
    setLoading(true);
    try {
      // Check if there's already a pending payment to avoid duplicates
      const q = query(collection(db, "payments"), where("uid", "==", user.uid), where("status", "==", "pending"));
      const snap = await getDocs(q);
      if (!snap.empty) {
        showToast("You already have a pending payment request.", "error");
        setLoading(false);
        return;
      }

      await addDoc(collection(db, "payments"), {
        uid: user.uid,
        email: user.email,
        name: user.name,
        txnId: txnId.trim(),
        status: "pending",
        submittedAt: serverTimestamp()
      });
      showToast("Payment submitted successfully!");
      setPage("app");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "payments");
    } finally {
      setLoading(false);
    }
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`upi://pay?pa=${config.upiId}&pn=${encodeURIComponent(config.upiName)}&am=${config.price}&cu=INR`)}&color=10b981&bgcolor=08090f`;

  return (
    <Layout>
      <div className="p-6">
        <button onClick={() => setPage("app")} className="text-emerald-500 font-bold flex items-center gap-2 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-black text-white mb-2">Unlock Access</h2>
          <p className="text-slate-500 text-sm">Pay {config.currency}{config.price} for {config.days} days of full access.</p>
        </div>

        <div className="bg-slate-900 border-2 border-dashed border-emerald-500/30 rounded-3xl p-8 text-center mb-6">
          <img src={qrUrl} className="w-40 h-40 mx-auto rounded-xl mb-6 bg-white p-2" alt="UPI QR" />
          <div className="text-3xl font-black text-emerald-500 mb-1">{config.currency}{config.price}</div>
          <div className="text-slate-500 text-xs">Scan with any UPI app</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-6 flex items-center justify-between">
          <div>
            <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">UPI ID</div>
            <div className="text-white font-bold">{config.upiId}</div>
          </div>
          <button 
            onClick={handleCopy}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-500'}`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs font-bold shrink-0">1</div>
            <p className="text-slate-400 text-xs leading-relaxed">Pay {config.currency}{config.price} to the UPI ID above.</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs font-bold shrink-0">2</div>
            <p className="text-slate-400 text-xs leading-relaxed">Copy the Transaction ID / UTR from your payment app.</p>
          </div>
          <div className="flex gap-3">
            <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 text-xs font-bold shrink-0">3</div>
            <p className="text-slate-400 text-xs leading-relaxed">Paste it below and submit for approval.</p>
          </div>
        </div>

        <div className="space-y-4">
          <input 
            type="text"
            placeholder="Enter Transaction ID / UTR"
            value={txnId}
            onChange={(e) => setTxnId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white font-mono placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all"
          />
          <button 
            onClick={handleSubmit}
            disabled={loading || !txnId.trim()}
            className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl tap-active disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit for Approval"}
          </button>
        </div>
      </div>
    </Layout>
  );
};

/* ════════════════════════════════════════════════
   CAMPUSES
════════════════════════════════════════════════ */

const stripHtml = (html: string) => {
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

const CampusNotes = () => {
  const { hasAccess, subjects, isAdmin, setPage, downloadNote, user, downloadStats } = useApp();
  const [selSub, setSelSub] = useState<string | null>(null);
  const [selCh, setSelCh] = useState<string | null>(null);
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [newChTitle, setNewChTitle] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const preventCopy = (e: ClipboardEvent) => {
      if (!isAdmin) {
        e.preventDefault();
        return false;
      }
    };
    const preventContext = (e: MouseEvent) => {
      if (!isAdmin) {
        e.preventDefault();
        return false;
      }
    };
    
    if (selCh) {
      document.addEventListener("copy", preventCopy);
      document.addEventListener("contextmenu", preventContext);
    }
    
    return () => {
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("contextmenu", preventContext);
    };
  }, [selCh, isAdmin]);

  const addChapter = async (subId: string, title: string) => {
    if (!title.trim()) return;
    try {
      const sub = { ...subjects[subId] };
      const newId = `${subId}_${Date.now()}`;
      const newChapters = [...sub.chapters, { id: newId, title: title.trim() }];
      
      // Remove non-serializable icon before saving
      delete sub.icon;
      
      await setDoc(doc(db, "chapters", subId), {
        ...sub,
        chapters: newChapters
      });
      setNewChTitle("");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chapters/${subId}`);
    }
  };

  useEffect(() => {
    if (selCh) {
      setLoading(true);
      const unsub = onSnapshot(doc(db, "notes", selCh), (doc) => {
        setNote(doc.data());
        setLoading(false);
      });
      return () => unsub();
    }
  }, [selCh]);

  if (selCh && selSub) {
    const sub = subjects[selSub];
    const ch = sub.chapters.find((c: any) => c.id === selCh);
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6">
        <button onClick={() => setSelCh(null)} className="text-emerald-500 font-bold flex items-center gap-2 mb-6">
          <ArrowLeft className="w-4 h-4" /> {sub.label}
        </button>
        
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="px-3 py-1 rounded-full text-[10px] font-bold text-white" style={{ background: sub.color }}>
              {sub.label}
            </div>
            <div className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Chapter {sub.chapters.findIndex((c: any) => c.id === selCh) + 1}</div>
          </div>
          <h2 className="text-xl font-black text-white leading-tight">{ch?.title}</h2>
          {isAdmin && (
            <button 
              onClick={() => setPage("admin")}
              className="mt-4 text-emerald-500 text-[10px] font-bold uppercase flex items-center gap-1"
            >
              Edit in Admin Panel <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="relative min-h-[400px] flex flex-col items-center">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : note?.content ? (
            <div className="w-full space-y-8">
              <motion.div 
                initial={{ opacity: 0, rotate: -0.5, y: 10 }}
                animate={{ opacity: 1, rotate: 0, y: 0 }}
                className="w-full bg-[#fdfdfd] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.5)] rounded-sm p-8 md:p-12 relative overflow-hidden border-t-[12px] border-emerald-500/10"
                style={{
                  backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)',
                  backgroundSize: '100% 2rem',
                  backgroundPosition: '0 1.5rem'
                }}
              >
                {/* Paper Texture Overlay */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]" />
                
                {/* Watermark */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] select-none overflow-hidden rotate-[-30deg]">
                  <div className="text-6xl font-black whitespace-nowrap text-slate-900">
                    {user?.email}<br />{user?.email}<br />{user?.email}
                  </div>
                </div>

                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-200 pb-4">
                    <div className="flex flex-col">
                      <div className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                        Posted: {note.updatedAt instanceof Timestamp ? note.updatedAt.toDate().toLocaleDateString() : 'Recently'}
                      </div>
                      <div className="text-emerald-600 text-[8px] font-black uppercase mt-0.5">Verified Study Material</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="text-slate-900 font-bold text-[10px]">Campus Admin</div>
                        <div className="text-slate-400 text-[8px]">Official Post</div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                  
                  {note.imageUrl && (
                    <div className="mb-8 rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                      <img 
                        src={note.imageUrl} 
                        alt="Note Content" 
                        className="w-full h-auto" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                  
                  <div 
                    className="text-slate-800 text-sm md:text-base leading-[2rem] select-none no-select font-medium rich-text-content"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                </div>
              </motion.div>

              <div className="px-2">
                <button 
                  onClick={() => downloadNote(selCh!)}
                  className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/20 tap-active"
                >
                  <BookOpen className="w-5 h-5" />
                  Download PDF
                </button>
                <div className="mt-3 text-center">
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                    {isAdmin ? (
                      <span className="flex items-center justify-center gap-2">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        Total Downloads: <span className="text-emerald-500">{downloadStats[selCh!] || 0}</span>
                      </span>
                    ) : `Weekly Limit: 2 Downloads · Used: ${(user?.downloads || []).filter(d => {
                      const dDate = d.timestamp instanceof Timestamp ? d.timestamp.toDate() : new Date(d.timestamp);
                      return dDate > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                    }).length}/2`}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center">
              <div className="text-3xl mb-4">📝</div>
              <div className="text-slate-500 text-sm font-bold">Notes coming soon</div>
              <p className="text-slate-700 text-xs mt-1">The teacher is currently preparing this chapter.</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (selSub) {
    const sub = subjects[selSub];
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-6">
        <button onClick={() => setSelSub(null)} className="text-emerald-500 font-bold flex items-center gap-2 mb-6">
          <ArrowLeft className="w-4 h-4" /> Subjects
        </button>
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white" style={{ background: sub.color }}>
            {sub.icon}
          </div>
          <div>
            <h2 className="text-xl font-black text-white">{sub.label}</h2>
            <p className="text-slate-500 text-xs">{sub.chapters.length} Chapters · MBOSE 2026</p>
          </div>
        </div>

        <div className="space-y-3">
          {sub.chapters.map((ch: any, i: number) => {
            const isLocked = !hasAccess;
            return (
              <button 
                key={ch.id}
                onClick={() => !isLocked && setSelCh(ch.id)}
                className={`w-full bg-slate-900 border border-slate-800 rounded-2xl p-5 text-left flex items-center justify-between tap-active ${isLocked ? 'opacity-50' : ''}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">Chapter {i + 1}</div>
                  <div className="text-white font-bold text-sm truncate">{ch.title}</div>
                </div>
                {isLocked ? <Lock className="w-4 h-4 text-slate-700" /> : <ChevronRight className="w-5 h-5 text-emerald-500" />}
              </button>
            );
          })}

          {isAdmin && (
            <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-5">
              <div className="text-slate-500 text-[10px] font-bold uppercase mb-3">Add New Chapter</div>
              <div className="flex gap-2">
                <input 
                  type="text"
                  placeholder="Chapter Title"
                  value={newChTitle}
                  onChange={(e) => setNewChTitle(e.target.value)}
                  className="flex-1 bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none"
                />
                <button 
                  onClick={() => addChapter(selSub, newChTitle)}
                  className="bg-emerald-500 text-white p-3 rounded-xl"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  const filteredResults: any[] = [];
  if (search.trim()) {
    Object.entries(subjects).forEach(([subId, sub]: [string, any]) => {
      sub.chapters.forEach((ch: any) => {
        const inTitle = ch.title.toLowerCase().includes(search.toLowerCase());
        if (inTitle) {
          filteredResults.push({ subId, sub, ch, note: null });
        }
      });
    });
  }

  return (
    <div className="p-6 fade-in">
      <h2 className="text-2xl font-black text-white mb-2">Study Notes</h2>
      <p className="text-emerald-500 text-sm font-bold mb-6">✅ {TAGLINE}</p>

      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 mb-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
          <BookOpen className="w-16 h-16 text-emerald-500" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">MBOSE Excellence</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed font-medium italic">
            "These notes outline a systematic and professional method for answering questions in MBOSE examinations, helping students enhance clarity, structure, and presentation in order to maximize their scores."
          </p>
        </div>
      </div>

      <div className="relative mb-8">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-700" />
        <input 
          type="text"
          placeholder="Search chapters or content..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pl-14 pr-5 py-4 text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all"
        />
      </div>

      {search.trim() ? (
        <div className="space-y-4">
          <div className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-4">Search Results ({filteredResults.length})</div>
          {filteredResults.length > 0 ? (
            filteredResults.map((res, i) => {
              const isLocked = !hasAccess;
              return (
                <button 
                  key={res.ch.id}
                  onClick={() => !isLocked && (setSelSub(res.subId), setSelCh(res.ch.id), setSearch(""))}
                  className={`w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-5 flex items-center gap-5 tap-active ${isLocked ? 'opacity-50' : ''}`}
                >
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: res.sub.color }}>
                    {res.sub.icon}
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-emerald-500 text-[10px] font-bold uppercase">{res.sub.label}</div>
                    <div className="text-white font-bold text-sm truncate">{res.ch.title}</div>
                    <div className="text-slate-500 text-[10px] mt-1 line-clamp-1 italic">
                      Click to view chapter notes
                    </div>
                  </div>
                  {isLocked ? <Lock className="w-4 h-4 text-slate-700" /> : <ChevronRight className="w-5 h-5 text-slate-800" />}
                </button>
              );
            })
          ) : (
            <div className="text-center py-10">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-slate-500 text-sm font-bold">No results found</p>
              <p className="text-slate-700 text-xs mt-1">Try different keywords or check spelling.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(subjects).map(([key, sub]: [string, any]) => (
            <button 
              key={key}
              onClick={() => setSelSub(key)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-3xl p-5 flex items-center gap-5 tap-active"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: sub.color }}>
                {sub.icon}
              </div>
              <div className="text-left flex-1">
                <div className="text-white font-bold text-lg">{sub.label}</div>
                <div className="text-slate-500 text-xs mt-1">{sub.chapters.length} Chapters</div>
              </div>
              <ChevronRight className="w-6 h-6 text-slate-800" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const CampusVideos = () => {
  const { hasAccess, subjects, isAdmin, setPage } = useApp();
  const [selSub, setSelSub] = useState("acc");
  const [playing, setPlaying] = useState<string | null>(null);
  const [videos, setVideos] = useState<Record<string, string>>({});

  const saveVideo = async (chId: string, ytId: string) => {
    try {
      await setDoc(doc(db, "videos", chId), {
        chapterId: chId,
        youtubeId: ytId.trim()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "videos");
    }
  };

  useEffect(() => {
    if (!hasAccess) return;
    const unsub = onSnapshot(collection(db, "videos"), (snap) => {
      const vids: Record<string, string> = {};
      snap.docs.forEach(d => vids[d.id] = d.data().youtubeId);
      setVideos(vids);
    });
    return () => unsub();
  }, [hasAccess]);

  const sub = subjects[selSub];

  return (
    <div className="p-6 fade-in">
      <h2 className="text-2xl font-black text-white mb-2">Video Lectures</h2>
      <p className="text-slate-500 text-sm mb-8">Expert explanations for every chapter.</p>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {Object.entries(subjects).map(([key, s]: [string, any]) => (
          <button 
            key={key}
            onClick={() => setSelSub(key)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selSub === key ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {sub.chapters.map((ch: any, i: number) => {
          const vidId = videos[ch.id];
          const isLocked = !hasAccess;
          return (
            <div key={ch.id} className={`bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 ${isLocked ? 'opacity-50' : ''}`}>
              <button 
                onClick={() => !isLocked && vidId && setPlaying(vidId)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${vidId && !isLocked ? 'bg-red-500/10 text-red-500' : 'bg-slate-800 text-slate-600'}`}
              >
                {isLocked ? <Lock className="w-5 h-5" /> : vidId ? <Video className="w-6 h-6" /> : <Video className="w-6 h-6 opacity-20" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-sm truncate">{ch.title}</div>
                <div className="text-slate-500 text-[10px] mt-1">
                  {isLocked ? "🔒 Locked" : vidId ? "Tap to watch" : "Coming soon"}
                </div>
                {isAdmin && (
                  <div className="mt-3 flex gap-2">
                    <input 
                      type="text"
                      placeholder="YouTube ID"
                      defaultValue={vidId || ""}
                      onBlur={(e) => saveVideo(ch.id, e.target.value)}
                      className="flex-1 bg-black/40 border border-slate-800 rounded-lg px-3 py-1.5 text-white text-[10px] outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {playing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6"
          >
            <button onClick={() => setPlaying(null)} className="absolute top-8 right-8 text-white p-2">
              <X className="w-8 h-8" />
            </button>
            <div className="w-full max-w-2xl aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${playing}?autoplay=1`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
              />
            </div>
            <p className="text-slate-500 text-xs mt-8">Streaming from YouTube · MBOSE 2026</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CampusFormulas = () => {
  const { isAdmin, subjects, showToast, confirm } = useApp();
  const [formulas, setFormulas] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [fSub, setFSub] = useState("Accountancy");
  const [fTitle, setFTitle] = useState("");
  const [fForm, setFForm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const addFormula = async () => {
    if (!fTitle.trim() || !fForm.trim()) return;
    try {
      if (editingId) {
        await updateDoc(doc(db, "formulas", editingId), {
          subject: fSub,
          title: fTitle.trim(),
          formula: fForm.trim(),
        });
      } else {
        await addDoc(collection(db, "formulas"), {
          subject: fSub,
          title: fTitle.trim(),
          formula: fForm.trim(),
          createdAt: serverTimestamp()
        });
      }
      setFTitle(""); setFForm(""); setShowAdd(false); setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, editingId ? OperationType.UPDATE : OperationType.CREATE, "formulas");
    }
  };

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "formulas"), orderBy("createdAt", "desc")), (snap) => {
      setFormulas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const filtered = formulas.filter(f => 
    f.title.toLowerCase().includes(search.toLowerCase()) || 
    f.subject.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 fade-in">
      <h2 className="text-2xl font-black text-white mb-2">Formulas</h2>
      <p className="text-slate-500 text-sm mb-8">Quick reference for calculations.</p>

      <div className="relative mb-8">
        <input 
          type="text"
          placeholder="Search formulas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white placeholder:text-slate-700 outline-none focus:border-emerald-500/50 transition-all"
        />
      </div>

      {isAdmin && (
        <div className="mb-8">
          {!showAdd ? (
            <button 
              onClick={() => { setShowAdd(true); setEditingId(null); setFTitle(""); setFForm(""); }}
              className="w-full bg-emerald-500/10 border border-dashed border-emerald-500/30 text-emerald-500 font-bold py-4 rounded-2xl flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" /> Add New Formula
            </button>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-white font-bold">{editingId ? "Edit Formula" : "New Formula"}</h3>
                <button onClick={() => { setShowAdd(false); setEditingId(null); }} className="text-slate-500"><X className="w-5 h-5" /></button>
              </div>
              <select 
                value={fSub}
                onChange={(e) => setFSub(e.target.value)}
                className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none"
              >
                {Object.values(subjects).map((s: any) => (
                  <option key={s.label}>{s.label}</option>
                ))}
              </select>
              <input 
                type="text"
                placeholder="Formula Title"
                value={fTitle}
                onChange={(e) => setFTitle(e.target.value)}
                className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none"
              />
              <textarea 
                placeholder="Formula / Content"
                value={fForm}
                onChange={(e) => setFForm(e.target.value)}
                className="w-full h-24 bg-black/40 border border-slate-800 rounded-xl p-4 text-white text-sm outline-none"
              />
              <button 
                onClick={addFormula}
                className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl tap-active"
              >
                {editingId ? "Update Formula" : "Add Formula"}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🧮</div>
            <div className="text-slate-500 font-bold">No formulas found</div>
          </div>
        ) : (
          filtered.map((f) => (
            <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-4 bg-emerald-500 rounded-full" />
                  <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-wider">{f.subject}</span>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <button 
                      onClick={() => {
                        setFSub(f.subject);
                        setFTitle(f.title);
                        setFForm(f.formula);
                        setEditingId(f.id);
                        setShowAdd(true);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      className="text-emerald-500 p-2 tap-active"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => confirm("Delete this formula?", async () => {
                        try {
                          await deleteDoc(doc(db, "formulas", f.id));
                          showToast("Formula deleted");
                        } catch (error) {
                          handleFirestoreError(error, OperationType.DELETE, "formulas");
                        }
                      })}
                      className="text-red-500 p-2 tap-active"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              <h3 className="text-white font-bold mb-4">{f.title}</h3>
              <div className="bg-black/40 border border-slate-800 rounded-2xl p-4 font-mono text-emerald-500 text-sm leading-relaxed break-all">
                {f.formula}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const CampusChat = () => {
  const { user, isAdmin, hasAccess, showToast, confirm } = useApp();
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [mode, setMode] = useState<"group" | "support">("group");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isAdmin && !hasAccess) {
      setMode("support");
    }
  }, [isAdmin, hasAccess]);

  const deleteMsg = async (id: string) => {
    confirm("Delete this message?", async () => {
      try {
        await deleteDoc(doc(db, mode === "group" ? "messages" : "support_messages", id));
        showToast("Message deleted");
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, mode === "group" ? "messages" : "support_messages");
      }
    });
  };

  useEffect(() => {
    const col = mode === "group" ? "messages" : "support_messages";
    const q = mode === "group" 
      ? query(collection(db, col), orderBy("at", "asc"), limit(50))
      : query(collection(db, col), where("chatId", "==", user?.uid), orderBy("at", "asc"));

    const unsub = onSnapshot(q, (snap) => {
      setMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [mode, user?.uid]);

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    try {
      const col = mode === "group" ? "messages" : "support_messages";
      const payload: any = {
        from: user.name,
        email: user.email,
        fromUid: auth.currentUser?.uid,
        role: user.role,
        text: text.trim(),
        at: serverTimestamp()
      };
      if (mode === "support") {
        payload.chatId = user.uid;
      }
      await addDoc(collection(db, col), payload);
      setText("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, mode === "group" ? "messages" : "support_messages");
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-130px)]">
      <div className="p-6 border-b border-slate-900 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white">{mode === "group" ? "Student Chat" : "Support Chat"}</h2>
          <p className="text-slate-500 text-xs">{mode === "group" ? "Connect with other Commerce students." : "Private chat with the Owner."}</p>
        </div>
        {!isAdmin && hasAccess && (
          <div className="flex bg-slate-900 p-1 rounded-xl">
            <button 
              onClick={() => setMode("group")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${mode === "group" ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
            >
              Group
            </button>
            <button 
              onClick={() => setMode("support")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${mode === "support" ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}
            >
              Support
            </button>
          </div>
        )}
        {!isAdmin && !hasAccess && (
          <div className="px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-bold uppercase">
            Support Only
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
        {msgs.length === 0 && (
          <div className="text-center py-10">
            <MessageSquare className="w-10 h-10 text-slate-800 mx-auto mb-3" />
            <p className="text-slate-600 text-xs italic">No messages yet. Start the conversation!</p>
          </div>
        )}
        {msgs.map((m) => {
          const isMe = m.fromUid === auth.currentUser?.uid;
          const isAdminMsg = m.role === 'admin' || m.email === OWNER_EMAIL;
          const time = m.at instanceof Timestamp 
            ? m.at.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
            : "...";
          
          return (
            <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
              <div className="flex items-center gap-2 mb-1 px-1">
                {!isMe && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-white">{m.from}</span>
                    <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-tighter ${isAdminMsg ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      {isAdminMsg ? 'Admin' : 'Student'}
                    </span>
                  </div>
                )}
                {isMe && (
                  <span className="text-[9px] text-slate-600 font-bold uppercase">{time}</span>
                )}
                {isAdmin && (
                  <button 
                    onClick={() => deleteMsg(m.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 p-1"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              
              <div className={`relative max-w-[85%] px-4 py-3 rounded-2xl text-sm shadow-lg ${
                isMe 
                  ? 'bg-emerald-500 text-white rounded-tr-none' 
                  : 'bg-slate-900 text-slate-300 border border-slate-800 rounded-tl-none'
              }`}>
                {m.text}
                {!isMe && (
                  <div className="absolute -bottom-5 left-1 flex items-center gap-2">
                    <span className="text-[9px] text-slate-600 font-bold uppercase">{time}</span>
                    {isAdmin && <span className="text-[8px] text-slate-700 truncate max-w-[100px]">{m.email}</span>}
                  </div>
                )}
              </div>
              {!isMe && <div className="h-4" />} {/* Spacer for absolute timestamp */}
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-slate-900/50 border-t border-slate-900 flex gap-3">
        <input 
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-emerald-500/50"
        />
        <button 
          onClick={handleSend}
          className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center tap-active"
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════
   ADMIN PANEL
════════════════════════════════════════════════ */

const AdminSupport = () => {
  const { user, allUsers, confirm, showToast } = useApp() as any;
  const [convos, setConvos] = useState<any[]>([]);
  const [selConvo, setSelConvo] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "support_messages"), orderBy("at", "desc"), limit(100)), (snap) => {
      const unique: Record<string, any> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (!unique[data.chatId]) {
          const student = allUsers.find((u: any) => u.uid === data.chatId);
          unique[data.chatId] = { 
            chatId: data.chatId, 
            lastMsg: data.text, 
            at: data.at, 
            name: data.from,
            email: data.email,
            paid: student?.paid,
            accessUntil: student?.accessUntil
          };
        }
      });
      setConvos(Object.values(unique));
    });
    return () => unsub();
  }, [allUsers]);

  useEffect(() => {
    if (!selConvo) return;
    const unsub = onSnapshot(query(collection(db, "support_messages"), where("chatId", "==", selConvo), orderBy("at", "asc")), (snap) => {
      setMsgs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });
    return () => unsub();
  }, [selConvo]);

  const handleSend = async () => {
    if (!text.trim() || !user || !selConvo) return;
    try {
      await addDoc(collection(db, "support_messages"), {
        chatId: selConvo,
        from: user.name,
        email: user.email,
        fromUid: auth.currentUser?.uid,
        role: 'admin',
        text: text.trim(),
        at: serverTimestamp()
      });
      setText("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "support_messages");
    }
  };

  const deleteConvo = async (chatId: string) => {
    confirm("Are you sure you want to delete this entire conversation?", async () => {
      try {
        const q = query(collection(db, "support_messages"), where("chatId", "==", chatId));
        const snap = await getDocs(q);
        const batch = writeBatch(db);
        snap.docs.forEach(d => batch.delete(d.ref));
        await batch.commit();
        setSelConvo(null);
        showToast("Conversation deleted.");
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, "support_messages");
      }
    });
  };

  const filteredConvos = convos.filter(c => 
    (c.name || "").toLowerCase().includes(search.toLowerCase()) || 
    (c.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const selectedStudent = convos.find(c => c.chatId === selConvo);

  return (
    <div className="flex h-[600px] bg-slate-900/50 rounded-3xl overflow-hidden border border-slate-800">
      <div className="w-1/3 border-r border-slate-800 flex flex-col">
        <div className="p-4 border-b border-slate-800">
          <div className="text-[10px] font-bold uppercase text-slate-500 mb-3">Conversations</div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
            <input 
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-black/40 border border-slate-800 rounded-xl pl-8 pr-4 py-2 text-[10px] text-white outline-none focus:border-emerald-500/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredConvos.map(c => (
            <button 
              key={c.chatId}
              onClick={() => setSelConvo(c.chatId)}
              className={`w-full p-4 text-left border-b border-slate-800 transition-all ${selConvo === c.chatId ? 'bg-emerald-500/10 border-r-2 border-r-emerald-500' : 'hover:bg-slate-900'}`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="text-white font-bold text-xs truncate">{c.name}</div>
                {c.paid && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />}
              </div>
              <div className="text-slate-500 text-[10px] truncate">{c.lastMsg}</div>
              <div className="text-[8px] text-slate-700 mt-2 font-bold uppercase">
                {c.at instanceof Timestamp ? c.at.toDate().toLocaleDateString() : ""}
              </div>
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 flex flex-col bg-[#08090f]">
        {selConvo ? (
          <>
            <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-xs">
                  {selectedStudent?.name[0]}
                </div>
                <div>
                  <div className="text-white font-bold text-xs">{selectedStudent?.name}</div>
                  <div className="text-slate-500 text-[10px]">{selectedStudent?.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${selectedStudent?.paid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                  {selectedStudent?.paid ? 'Paid Member' : 'Free User'}
                </div>
                <button 
                  onClick={() => deleteConvo(selectedStudent!.chatId)}
                  className="p-2 text-slate-700 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide">
              {msgs.map(m => {
                const isMe = m.fromUid === auth.currentUser?.uid;
                const time = m.at instanceof Timestamp ? m.at.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "...";
                return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}>
                    <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm shadow-lg ${isMe ? 'bg-emerald-500 text-white rounded-tr-none' : 'bg-slate-900 text-slate-300 border border-slate-800 rounded-tl-none'}`}>
                      {m.text}
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[8px] text-slate-700 font-bold uppercase">{time}</span>
                    </div>
                  </div>
                );
              })}
              <div ref={scrollRef} />
            </div>
            <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex gap-3">
              <input 
                type="text"
                placeholder="Type a reply..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 text-white text-sm outline-none focus:border-emerald-500/30 transition-all"
              />
              <button 
                onClick={handleSend}
                className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 tap-active"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
            <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mb-4 border border-slate-800">
              <MessageSquare className="w-8 h-8 text-slate-700" />
            </div>
            <h3 className="text-white font-bold mb-1">Support Center</h3>
            <p className="text-slate-600 text-xs italic max-w-[200px]">Select a student conversation from the left to start providing assistance.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const AdminPanel = () => {
  const { config, setPage, showToast, confirm } = useApp();
  const [tab, setTab] = useState("payments");
  const [pending, setPending] = useState<any[]>([]);
  const [stats, setStats] = useState({ students: 0, paid: 0, notes: 0, revenue: 0, downloads: 0 });

  // Notes Editor State
  const [selSub, setSelSub] = useState<string>("acc");
  const [selCh, setSelCh] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteImage, setNoteImage] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState(false);
  const [notePreview, setNotePreview] = useState(false);

  // Formulas Editor State
  const [fSub, setFSub] = useState("Accountancy");
  const [fTitle, setFTitle] = useState("");
  const [fForm, setFForm] = useState("");
  const [formulas, setFormulas] = useState<any[]>([]);

  // Videos Editor State
  const [vSub, setVSub] = useState("acc");
  const [videos, setVideos] = useState<Record<string, string>>({});

  // Config Editor State
  const [configForm, setConfigForm] = useState<AppConfig>(config);
  const [savingConfig, setSavingConfig] = useState(false);

  // Subject Structure State (for editing chapter names)
  const [subjectStructure, setSubjectStructure] = useState<Record<string, any>>(CHAPTERS);

  // User Management State
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "email" | "active" | "downloads">("active");
  const [freeEmail, setFreeEmail] = useState("");
  const [granting, setGranting] = useState(false);

  useEffect(() => {
    setConfigForm(config);
  }, [config]);

  useEffect(() => {
    if (tab === "payments") {
      const unsubPay = onSnapshot(query(collection(db, "payments"), orderBy("submittedAt", "desc")), (snap) => {
        setPending(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubPay();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "users") {
      const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllUsers(docs);
      });
      return () => unsubUsers();
    }
  }, [tab]);

  useEffect(() => {
    // Stats and general counts - fetch once or use lightweight listeners
    const fetchInitialStats = async () => {
      try {
        // We avoid fetching the entire notes collection because it contains heavy base64 images
        // For now, we'll just skip the notes count or use a separate counter if needed
        
        // Use getCountFromServer for even faster stats
        const usersCountSnap = await getCountFromServer(collection(db, "users"));
        const paidQuery = query(collection(db, "users"), where("paid", "==", true));
        const paidCountSnap = await getCountFromServer(paidQuery);
        
        setStats(prev => ({ 
          ...prev, 
          students: usersCountSnap.data().count, 
          paid: paidCountSnap.data().count,
          revenue: paidCountSnap.data().count * config.price
        }));
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };
    
    fetchInitialStats();

    const unsubStats = onSnapshot(doc(db, "stats", "downloads"), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const total = Object.values(data).reduce((a: any, b: any) => a + b, 0) as number;
        setStats(prev => ({ ...prev, downloads: total }));
      }
    });

    return () => { unsubStats(); };
  }, [config.price]);

  useEffect(() => {
    if (tab === "formulas") {
      const unsubForms = onSnapshot(collection(db, "formulas"), (snap) => {
        setFormulas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsubForms();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "videos" || tab === "notes") {
      const unsubVids = onSnapshot(collection(db, "videos"), (snap) => {
        const vids: Record<string, string> = {};
        snap.docs.forEach(d => vids[d.id] = d.data().youtubeId);
        setVideos(vids);
      });
      const unsubChapters = onSnapshot(collection(db, "chapters"), (snap) => {
        if (snap.docs.length > 0) {
          const struct: Record<string, any> = { ...CHAPTERS };
          snap.docs.forEach(d => {
            struct[d.id] = { ...struct[d.id], ...d.data() };
          });
          setSubjectStructure(struct);
        }
      });
      return () => { unsubVids(); unsubChapters(); };
    }
  }, [tab]);

  const handleApprove = async (payment: any) => {
    try {
      await updateDoc(doc(db, "payments", payment.id), { status: "approved" });
      
      const accessUntil = new Date();
      accessUntil.setDate(accessUntil.getDate() + config.days);
      const accessUntilStr = accessUntil.toISOString();

      if (payment.uid) {
        await updateDoc(doc(db, "users", payment.uid), { 
          paid: true,
          accessUntil: accessUntilStr
        });
        showToast(`Payment approved and access granted for ${payment.email} until ${accessUntil.toLocaleDateString()}.`);
      } else {
        // Fallback: try to find user by email
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", payment.email));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          await updateDoc(doc(db, "users", userDoc.id), { 
            paid: true,
            accessUntil: accessUntilStr
          });
          showToast(`Payment approved and access granted for ${payment.email} until ${accessUntil.toLocaleDateString()}.`);
        } else {
          showToast(`Payment approved for ${payment.email}, but user record not found to grant access automatically.`, 'error');
        }
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "payments/users");
    }
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await setDoc(doc(db, "config", "global"), configForm);
      showToast("Settings saved successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "config/global");
    } finally {
      setSavingConfig(false);
    }
  };

  const saveChapterName = async (subId: string, chId: string, newTitle: string) => {
    try {
      const sub = { ...subjectStructure[subId] };
      const newChapters = sub.chapters.map((c: any) => c.id === chId ? { ...c, title: newTitle } : c);
      
      // Remove non-serializable icon before saving
      delete sub.icon;
      
      await setDoc(doc(db, "chapters", subId), {
        ...sub,
        chapters: newChapters
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chapters/${subId}`);
    }
  };

  const addChapter = async (subId: string, title: string) => {
    if (!title.trim()) return;
    try {
      const sub = { ...subjectStructure[subId] };
      const newId = `${subId}_${Date.now()}`;
      const newChapters = [...sub.chapters, { id: newId, title: title.trim() }];
      
      // Remove non-serializable icon before saving
      delete sub.icon;
      
      await setDoc(doc(db, "chapters", subId), {
        ...sub,
        chapters: newChapters
      });
      showToast("Chapter added!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chapters/${subId}`);
    }
  };

  const saveNote = async () => {
    if (!selCh) return;
    setSavingNote(true);
    try {
      await setDoc(doc(db, "notes", selCh), {
        chapterId: selCh,
        content: noteContent,
        imageUrl: noteImage,
        updatedAt: serverTimestamp()
      });
      showToast("Note posted successfully!");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "notes");
    } finally {
      setSavingNote(false);
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      showToast("Image too large! Max 500KB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setNoteImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addFormula = async () => {
    if (!fTitle.trim() || !fForm.trim()) return;
    try {
      await addDoc(collection(db, "formulas"), {
        subject: fSub,
        title: fTitle.trim(),
        formula: fForm.trim(),
        createdAt: serverTimestamp()
      });
      setFTitle(""); setFForm("");
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, "formulas");
    }
  };

  const deleteFormula = async (id: string) => {
    try {
      await deleteDoc(doc(db, "formulas", id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, "formulas");
    }
  };

  const saveVideo = async (chId: string, ytId: string) => {
    try {
      await setDoc(doc(db, "videos", chId), {
        chapterId: chId,
        youtubeId: ytId.trim()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "videos");
    }
  };

  const grantFreeAccess = async () => {
    if (!freeEmail.trim() || !freeEmail.includes("@")) return;
    setGranting(true);
    try {
      const accessUntil = new Date();
      accessUntil.setDate(accessUntil.getDate() + config.days);
      const accessUntilStr = accessUntil.toISOString();

      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", freeEmail.trim().toLowerCase()));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        await updateDoc(doc(db, "users", userDoc.id), { 
          paid: true,
          accessUntil: accessUntilStr
        });
        showToast(`Access granted to existing user: ${freeEmail} until ${accessUntil.toLocaleDateString()}`);
      } else {
        // Create a placeholder user
        await addDoc(collection(db, "users"), {
          email: freeEmail.trim().toLowerCase(),
          paid: true,
          accessUntil: accessUntilStr,
          role: "student",
          createdAt: serverTimestamp()
        });
        showToast(`Access granted to new email: ${freeEmail} until ${accessUntil.toLocaleDateString()}`);
      }
      setFreeEmail("");
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "users");
    } finally {
      setGranting(false);
    }
  };

  const toggleUserAccess = async (userId: string, currentPaid: boolean) => {
    try {
      const accessUntil = new Date();
      accessUntil.setDate(accessUntil.getDate() + config.days);
      const accessUntilStr = accessUntil.toISOString();
      
      await updateDoc(doc(db, "users", userId), { 
        paid: !currentPaid,
        accessUntil: !currentPaid ? accessUntilStr : null
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
    }
  };

  const extendUserAccess = async (userId: string, days: number) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (!userDoc.exists()) return;
      
      const userData = userDoc.data();
      let currentUntil = userData.accessUntil ? (userData.accessUntil instanceof Timestamp ? userData.accessUntil.toDate() : new Date(userData.accessUntil)) : new Date();
      if (currentUntil < new Date()) currentUntil = new Date();
      
      currentUntil.setDate(currentUntil.getDate() + days);
      
      await updateDoc(doc(db, "users", userId), { 
        paid: true,
        accessUntil: currentUntil.toISOString()
      });
      showToast(`Access extended by ${days} days.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
    }
  };

  return (
    <Layout bg="bg-[#06090f]">
      <div className="p-6 pb-24">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-black text-white">Admin Panel</h2>
            <p className="text-emerald-500 text-xs font-bold">Owner Control</p>
          </div>
          <button onClick={() => setPage("app")} className="p-2 bg-slate-900 rounded-xl text-slate-500">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {[
            { label: "Students", val: stats.students, color: "text-blue-500", sub: `+${allUsers.filter(u => {
              const cTime = u.createdAt ? (u.createdAt instanceof Timestamp ? u.createdAt.toMillis() : new Date(u.createdAt).getTime()) : 0;
              return cTime > Date.now() - 86400000;
            }).length} today` },
            { label: "Revenue", val: `${config.currency}${stats.revenue}`, color: "text-emerald-500", sub: `${stats.paid} active subs` },
            { label: "Downloads", val: stats.downloads, color: "text-purple-500", sub: "Total chapters" },
            { label: "Pending", val: pending.filter(p => p.status === 'pending').length, color: "text-amber-500", sub: "Awaiting approval" }
          ].map((s, i) => (
            <div key={i} className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
              <div className="text-slate-500 text-[10px] font-bold uppercase mb-1">{s.label}</div>
              <div className={`text-2xl font-black ${s.color}`}>{s.val}</div>
              <div className="text-slate-700 text-[8px] font-bold mt-1 uppercase tracking-tighter">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {["payments", "users", "chat", "notes", "videos", "formulas", "config"].map(t => (
            <button 
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 rounded-2xl text-xs font-bold capitalize transition-all shrink-0 relative ${tab === t ? 'text-white' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
            >
              {tab === t && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute inset-0 bg-emerald-500 rounded-2xl -z-10"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              {t}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {tab === "payments" && (
          <div className="space-y-4">
            <h3 className="text-white font-bold mb-4">Pending Approvals</h3>
            {pending.filter(p => p.status === 'pending').length === 0 ? (
              <div className="text-center py-20 text-slate-700 text-sm">No pending payments</div>
            ) : (
              pending.filter(p => p.status === 'pending').map(p => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-white font-bold">{p.name}</div>
                      <div className="text-slate-500 text-xs">{p.email}</div>
                    </div>
                    <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-500">
                      Pending
                    </div>
                  </div>
                  <div className="bg-black/40 rounded-xl p-3 mb-4 font-mono text-xs text-slate-400">
                    UTR: <span className="text-white">{p.txnId}</span>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => handleApprove(p)}
                      className="flex-1 bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs tap-active"
                    >
                      Approve
                    </button>
                    <button className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 font-bold py-3 rounded-xl text-xs tap-active">
                      Reject
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === "users" && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-white font-bold mb-4">Grant Free Access</h3>
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="Student Email"
                    value={freeEmail}
                    onChange={(e) => setFreeEmail(e.target.value)}
                    className="flex-1 bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500/30"
                  />
                  <button 
                    onClick={grantFreeAccess}
                    disabled={granting}
                    className="bg-emerald-500 text-white font-bold px-6 rounded-xl tap-active disabled:opacity-50"
                  >
                    {granting ? "..." : "Grant"}
                  </button>
                </div>
              </div>
              <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-6">
                <h3 className="text-white font-bold mb-4">Search Students</h3>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input 
                    type="text" 
                    placeholder="Name or Email..."
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full bg-black/40 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white text-sm outline-none focus:border-emerald-500/30"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-slate-500 text-[10px] font-bold uppercase">
                  {userSearch ? `Found ${allUsers.filter(u => (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())).length} Students` : `All Students (${allUsers.length})`}
                </h3>
                <div className="flex gap-2">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1 text-[8px] font-bold text-slate-400 outline-none"
                  >
                    <option value="active">Sort: Last Active</option>
                    <option value="name">Sort: Name</option>
                    <option value="email">Sort: Email</option>
                    <option value="downloads">Sort: Downloads</option>
                  </select>
                </div>
              </div>
              {allUsers
                .filter(u => 
                  (u.name || "").toLowerCase().includes(userSearch.toLowerCase()) || 
                  u.email.toLowerCase().includes(userSearch.toLowerCase())
                )
                .sort((a, b) => {
                  if (sortBy === "name") return (a.name || "").localeCompare(b.name || "");
                  if (sortBy === "email") return a.email.localeCompare(b.email);
                  if (sortBy === "downloads") return (b.downloads || []).length - (a.downloads || []).length;
                  if (sortBy === "active") {
                    const aTime = a.lastActive ? (a.lastActive instanceof Timestamp ? a.lastActive.toMillis() : new Date(a.lastActive).getTime()) : 0;
                    const bTime = b.lastActive ? (b.lastActive instanceof Timestamp ? b.lastActive.toMillis() : new Date(b.lastActive).getTime()) : 0;
                    return bTime - aTime;
                  }
                  return 0;
                })
                .map(u => {
                const accessUntilDate = u.accessUntil ? (u.accessUntil instanceof Timestamp ? u.accessUntil.toDate() : new Date(u.accessUntil)) : null;
                const lastActiveDate = u.lastActive ? (u.lastActive instanceof Timestamp ? u.lastActive.toDate() : new Date(u.lastActive)) : null;
                const isExpiring = u.paid && accessUntilDate && accessUntilDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                const isExpired = u.paid && accessUntilDate && accessUntilDate < new Date();
                const downloadCount = (u.downloads || []).length;
                
                return (
                  <div key={u.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <div className="text-white font-bold text-xs truncate">{u.name || "Student"}</div>
                          <div className="bg-slate-800 text-slate-500 text-[7px] px-1.5 py-0.5 rounded font-black uppercase tracking-tighter">
                            {downloadCount} Downloads
                          </div>
                        </div>
                        <div className="text-slate-500 text-[8px] uppercase mt-1">{u.email} • {u.role}</div>
                        <div className="flex gap-3 mt-1">
                          {accessUntilDate && (
                            <div className={`text-[8px] font-bold ${isExpired ? 'text-red-500' : isExpiring ? 'text-amber-500' : 'text-emerald-500'}`}>
                              Access: {accessUntilDate.toLocaleDateString()}
                            </div>
                          )}
                          {lastActiveDate && (
                            <div className="text-slate-600 text-[8px] font-bold uppercase">
                              Active: {lastActiveDate.toLocaleDateString()} {lastActiveDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => toggleUserAccess(u.id, u.paid)}
                        className={`px-3 py-1.5 rounded-lg text-[8px] font-bold uppercase transition-all ${u.paid ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}
                      >
                        {u.paid ? (isExpired ? "Expired" : "Paid Access") : "No Access"}
                      </button>
                    </div>
                    
                    {u.paid && (
                      <div className="flex gap-2 pt-2 border-t border-slate-800/50">
                        <button 
                          onClick={() => extendUserAccess(u.id, 30)}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[8px] font-bold py-2 rounded-lg transition-colors"
                        >
                          +30 Days
                        </button>
                        <button 
                          onClick={() => extendUserAccess(u.id, 180)}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-[8px] font-bold py-2 rounded-lg transition-colors"
                        >
                          +180 Days
                        </button>
                        <button 
                          onClick={() => {
                            const d = prompt("Enter days to add:");
                            if (d && !isNaN(Number(d))) extendUserAccess(u.id, Number(d));
                          }}
                          className="flex-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-bold py-2 rounded-lg"
                        >
                          Custom
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "chat" && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden h-[600px]">
            <AdminSupport />
          </div>
        )}

        {tab === "notes" && (
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {Object.entries(subjectStructure).map(([key, s]: [string, any]) => (
                <button 
                  key={key}
                  onClick={() => { setSelSub(key); setSelCh(null); }}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${selSub === key ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {selCh ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <button onClick={() => setSelCh(null)} className="text-emerald-500 text-xs font-bold flex items-center gap-2">
                  <ArrowLeft className="w-3 h-3" /> Back to Chapters
                </button>
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-white font-bold">{subjectStructure[selSub].chapters.find((c: any) => c.id === selCh)?.title}</h4>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setNotePreview(!notePreview)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${notePreview ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                      >
                        {notePreview ? "Edit Mode" : "Preview Post"}
                      </button>
                      <button 
                        onClick={() => confirm("Are you sure you want to delete this chapter?", async () => {
                          const sub = { ...subjectStructure[selSub] };
                          const newChapters = sub.chapters.filter((c: any) => c.id !== selCh);
                          
                          // Remove non-serializable icon before saving
                          delete sub.icon;
                          
                          await setDoc(doc(db, "chapters", selSub), { ...sub, chapters: newChapters });
                          setSelCh(null);
                          showToast("Chapter deleted");
                        })}
                        className="text-red-500 p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {notePreview ? (
                    <div className="w-full bg-[#fdfdfd] shadow-xl rounded-sm p-8 relative overflow-hidden border-t-8 border-emerald-500/10 mb-4"
                      style={{
                        backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px)',
                        backgroundSize: '100% 2rem',
                        backgroundPosition: '0 1.5rem'
                      }}
                    >
                      <div className="relative z-10">
                        <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-3">
                          <div className="text-slate-400 text-[8px] font-bold uppercase tracking-widest">Preview Post</div>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        </div>
                        {noteImage && (
                          <div className="mb-6 rounded-lg overflow-hidden border border-slate-200">
                            <img src={noteImage} alt="Note" className="w-full h-auto" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <div 
                          className="text-slate-800 text-sm leading-[2rem] font-medium rich-text-content"
                          dangerouslySetInnerHTML={{ __html: noteContent || "No content to preview..." }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col gap-4">
                        <div className="bg-black/40 border border-slate-800 rounded-2xl overflow-hidden">
                          <ReactQuill 
                            theme="snow"
                            value={noteContent}
                            onChange={setNoteContent}
                            placeholder="Compose your note post here..."
                            className="quill-editor"
                          />
                        </div>
                        
                        <div className="flex flex-wrap gap-3">
                          <label className="flex-1 min-w-[140px] bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 group">
                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <div className="w-10 h-10 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                            <div className="text-center">
                              <div className="text-white text-[10px] font-bold uppercase">Add Image</div>
                              <div className="text-slate-500 text-[8px]">Gallery / Camera</div>
                            </div>
                          </label>

                          {noteImage && (
                            <div className="flex-1 min-w-[140px] bg-slate-900 border border-slate-800 rounded-xl p-2 relative group">
                              <img src={noteImage} alt="Preview" className="w-full h-20 object-cover rounded-lg opacity-50" referrerPolicy="no-referrer" />
                              <button 
                                onClick={() => setNoteImage(null)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-[8px] font-bold text-emerald-500 uppercase">Image Added</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <button 
                    onClick={saveNote}
                    disabled={savingNote}
                    className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl mt-4 tap-active disabled:opacity-50"
                  >
                    {savingNote ? "Posting..." : "Post Note"}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="space-y-2">
                {subjectStructure[selSub].chapters.map((ch: any, i: number) => (
                  <div key={ch.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="text-slate-500 text-[10px] font-bold uppercase">Chapter {i+1}</div>
                      <button 
                        onClick={async () => {
                          setSelCh(ch.id);
                          const d = await getDoc(doc(db, "notes", ch.id));
                          if (d.exists()) {
                            const data = d.data();
                            setNoteContent(data.content || "");
                            setNoteImage(data.imageUrl || null);
                          } else {
                            setNoteContent("");
                            setNoteImage(null);
                          }
                        }}
                        className="text-emerald-500 text-[10px] font-bold uppercase flex items-center gap-1"
                      >
                        Edit Notes <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                    <input 
                      type="text"
                      defaultValue={ch.title}
                      onBlur={(e) => saveChapterName(selSub, ch.id, e.target.value)}
                      className="bg-black/40 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm outline-none focus:border-emerald-500/30"
                    />
                  </div>
                ))}
                
                <div className="bg-slate-900/50 border border-dashed border-slate-800 rounded-2xl p-4">
                  <div className="text-slate-500 text-[10px] font-bold uppercase mb-2">Add New Chapter</div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      id="newChTitle"
                      placeholder="Chapter Title"
                      className="flex-1 bg-black/40 border border-slate-800 rounded-xl px-4 py-2 text-white text-sm outline-none"
                    />
                    <button 
                      onClick={() => {
                        const input = document.getElementById("newChTitle") as HTMLInputElement;
                        addChapter(selSub, input.value);
                        input.value = "";
                      }}
                      className="bg-emerald-500 text-white p-2 rounded-xl"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === "videos" && (
          <div className="space-y-6">
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
              {Object.entries(subjectStructure).map(([key, s]: [string, any]) => (
                <button 
                  key={key}
                  onClick={() => setVSub(key)}
                  className={`px-4 py-2 rounded-full text-[10px] font-bold whitespace-nowrap transition-all ${vSub === key ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-slate-500 border border-slate-800'}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {subjectStructure[vSub]?.chapters.map((ch: any, i: number) => (
                <div key={ch.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                  <div className="text-white font-bold text-xs mb-3">Ch {i+1}: {ch.title}</div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="YouTube Video ID"
                      defaultValue={videos[ch.id] || ""}
                      onBlur={(e) => saveVideo(ch.id, e.target.value)}
                      className="flex-1 bg-black/40 border border-slate-800 rounded-xl px-4 py-2 text-white text-xs outline-none"
                    />
                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                      <Video className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "formulas" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-white font-bold mb-4">Add New Formula</h3>
              <select 
                value={fSub}
                onChange={(e) => setFSub(e.target.value)}
                className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm mb-3 outline-none"
              >
                {Object.values(subjectStructure).map((s: any) => (
                  <option key={s.label}>{s.label}</option>
                ))}
              </select>
              <input 
                type="text"
                placeholder="Formula Title"
                value={fTitle}
                onChange={(e) => setFTitle(e.target.value)}
                className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm mb-3 outline-none"
              />
              <textarea 
                placeholder="Formula / Content"
                value={fForm}
                onChange={(e) => setFForm(e.target.value)}
                className="w-full h-24 bg-black/40 border border-slate-800 rounded-xl p-4 text-white text-sm mb-4 outline-none"
              />
              <button 
                onClick={addFormula}
                className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl tap-active"
              >
                Add Formula
              </button>
            </div>

            <div className="space-y-3">
              {formulas.map(f => (
                <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-start justify-between">
                  <div>
                    <div className="text-emerald-500 text-[10px] font-bold uppercase mb-1">{f.subject}</div>
                    <div className="text-white font-bold text-sm">{f.title}</div>
                  </div>
                  <button onClick={() => deleteFormula(f.id)} className="text-red-500 p-2">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "config" && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
              <h3 className="text-white font-bold mb-6">Global Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-slate-500 text-[10px] font-bold uppercase mb-2 block">Price ({config.currency})</label>
                  <input 
                    type="number" 
                    value={configForm.price} 
                    onChange={(e) => setConfigForm({ ...configForm, price: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/30" 
                  />
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] font-bold uppercase mb-2 block">Access Days</label>
                  <input 
                    type="number" 
                    value={configForm.days} 
                    onChange={(e) => setConfigForm({ ...configForm, days: Number(e.target.value) })}
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/30" 
                  />
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] font-bold uppercase mb-2 block">UPI ID</label>
                  <input 
                    type="text" 
                    value={configForm.upiId} 
                    onChange={(e) => setConfigForm({ ...configForm, upiId: e.target.value })}
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/30" 
                  />
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] font-bold uppercase mb-2 block">UPI Name</label>
                  <input 
                    type="text" 
                    value={configForm.upiName} 
                    onChange={(e) => setConfigForm({ ...configForm, upiName: e.target.value })}
                    className="w-full bg-black/40 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-emerald-500/30" 
                  />
                </div>
                <div>
                  <label className="text-slate-500 text-[10px] font-bold uppercase mb-2 block">Announcement</label>
                  <textarea 
                    value={configForm.announcement || ""} 
                    onChange={(e) => setConfigForm({ ...configForm, announcement: e.target.value })}
                    className="w-full h-24 bg-black/40 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-emerald-500/30" 
                  />
                </div>
                <button 
                  onClick={saveConfig}
                  disabled={savingConfig}
                  className="w-full bg-emerald-500 text-white font-bold py-4 rounded-2xl mt-4 tap-active disabled:opacity-50"
                >
                  {savingConfig ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}
          </motion.div>
        </AnimatePresence>
      </div>
    </Layout>
  );
};

/* ════════════════════════════════════════════════
   ROOT APP
════════════════════════════════════════════════ */

const AppProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("landing");
  const [toast, setToast] = useState<{ msg: string, type: 'success' | 'error' } | null>(null);
  const [confirmData, setConfirmData] = useState<{ msg: string, onConfirm: () => void } | null>(null);
  const [isBlurred, setIsBlurred] = useState(false);
  const [config, setConfig] = useState<AppConfig>({
    price: 299,
    days: 180,
    currency: "₹",
    upiId: "ssungoh905@okaxis",
    upiName: "Com.Mbose.Notes"
  });
  const [subjects, setSubjects] = useState<Record<string, any>>(CHAPTERS);
  const [pendingPayment, setPendingPayment] = useState<any | null>(null);
  const [downloadStats, setDownloadStats] = useState<Record<string, number>>({});

  const refreshUser = async () => {
    if (auth.currentUser) {
      try {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data() as UserProfile;
          setUser(userData);
          
          // Update lastActive
          await updateDoc(doc(db, "users", auth.currentUser.uid), {
            lastActive: serverTimestamp()
          });
        }
      } catch (error) {
        console.error("Error refreshing user:", error);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    let unsubUser: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        // Real-time user profile sync
        if (unsubUser) unsubUser();
        unsubUser = onSnapshot(doc(db, "users", fbUser.uid), (doc) => {
          if (doc.exists()) {
            setUser(doc.data() as UserProfile);
          }
        });
        setPage("app");
      } else {
        if (unsubUser) unsubUser();
        setUser(null);
        setPage("landing");
      }
      setLoading(false);
    });

    const unsubConfig = onSnapshot(doc(db, "config", "global"), (doc) => {
      if (doc.exists()) setConfig(doc.data() as AppConfig);
    });

    const unsubChapters = onSnapshot(collection(db, "chapters"), (snap) => {
      if (snap.docs.length > 0) {
        const struct: Record<string, any> = { ...CHAPTERS };
        snap.docs.forEach(d => {
          struct[d.id] = { ...struct[d.id], ...d.data() };
        });
        setSubjects(struct);
      }
    });

    const unsubStats = onSnapshot(doc(db, "stats", "downloads"), (doc) => {
      if (doc.exists()) setDownloadStats(doc.data() as Record<string, number>);
    });

    const handleBlur = () => setIsBlurred(true);
    const handleFocus = () => setIsBlurred(false);
    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);

    return () => { 
      unsubAuth(); 
      if (unsubUser) unsubUser();
      unsubConfig(); 
      unsubChapters(); 
      unsubStats(); 
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  useEffect(() => {
    if (user && !user.paid && user.role !== 'admin') {
      const q = query(collection(db, "payments"), where("email", "==", user.email), where("status", "==", "pending"));
      const unsubPay = onSnapshot(q, (snap) => {
        const myPay = snap.docs[0];
        setPendingPayment(myPay ? { id: myPay.id, ...myPay.data() } : null);
      });
      return () => unsubPay();
    }
  }, [user]);

  const isAdmin = user?.role === 'admin';
  const hasAccess = isAdmin || (user?.paid && (!user?.accessUntil || (user.accessUntil instanceof Timestamp ? user.accessUntil.toDate() : new Date(user.accessUntil)) > new Date()));

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const confirm = (msg: string, onConfirm: () => void) => {
    setConfirmData({ msg, onConfirm });
  };

  const downloadNote = async (chapterId: string) => {
    if (!user) return;
    if (isAdmin) {
      showToast("Admin download: No limits applied.");
      return;
    }

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentDownloads = (user.downloads || []).filter(d => {
      const dDate = d.timestamp instanceof Timestamp ? d.timestamp.toDate() : new Date(d.timestamp);
      return dDate > oneWeekAgo;
    });

    if (recentDownloads.length >= 2) {
      showToast("Weekly download limit (2) reached. Try again later.", "error");
      return;
    }

    try {
      // Use local timestamp for immediate UI update if needed, 
      // though onSnapshot will override with server value soon
      const newDownload = { chapterId, timestamp: new Date() };
      await updateDoc(doc(db, "users", user.uid), {
        downloads: [...(user.downloads || []), newDownload]
      });

      // Increment global counter
      const statsRef = doc(db, "stats", "downloads");
      const statsDoc = await getDoc(statsRef);
      if (statsDoc.exists()) {
        await updateDoc(statsRef, {
          [chapterId]: (statsDoc.data()[chapterId] || 0) + 1
        });
      } else {
        await setDoc(statsRef, { [chapterId]: 1 });
      }

      showToast("Download recorded. Preparing your file...");
      
      // Fetch note content for download
      const noteDoc = await getDoc(doc(db, "notes", chapterId));
      if (noteDoc.exists()) {
        const content = noteDoc.data().content;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `MBOSE_Note_${chapterId}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast("Download started!");
      } else {
        showToast("Note content not found.", "error");
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users");
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, 
      loading, 
      config, 
      subjects,
      isAdmin, 
      hasAccess, 
      pendingPayment, 
      page, 
      setPage,
      refreshUser,
      showToast,
      confirm,
      downloadNote,
      downloadStats
    }}>
      <div className={`min-h-screen bg-[#08090f] text-slate-300 font-sans selection:bg-emerald-500/30 transition-all duration-500 ${isBlurred ? 'blur-on-blur' : ''}`}>
        {children}

        <AnimatePresence>
          {toast && (
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl flex items-center gap-3"
            >
              {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}
              <span className="text-xs font-bold text-white">{toast.msg}</span>
            </motion.div>
          )}

          {confirmData && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center shadow-2xl"
              >
                <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-white font-bold text-lg mb-2">Are you sure?</h3>
                <p className="text-slate-500 text-sm mb-8">{confirmData.msg}</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setConfirmData(null)}
                    className="flex-1 bg-slate-800 text-slate-400 font-bold py-4 rounded-xl tap-active"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => { confirmData.onConfirm(); setConfirmData(null); }}
                    className="flex-1 bg-red-500 text-white font-bold py-4 rounded-xl tap-active shadow-lg shadow-red-500/20"
                  >
                    Confirm
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppContext.Provider>
  );
};

const LockedCampus = () => {
  const { setPage, config, pendingPayment } = useApp();
  
  if (pendingPayment) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6 animate-pulse"
        >
          <Clock className="w-10 h-10 text-emerald-500" />
        </motion.div>
        <h2 className="text-2xl font-black text-white mb-2">Payment Pending</h2>
        <p className="text-slate-500 text-sm mb-8 max-w-xs">
          We've received your transaction ID. Admin is verifying your payment. 
          Access will be granted within 24 hours.
        </p>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 w-full max-w-xs">
          <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">Transaction ID</div>
          <div className="text-white font-mono text-xs truncate">{pendingPayment.txnId}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[60vh]">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-6"
      >
        <Lock className="w-10 h-10 text-emerald-500" />
      </motion.div>
      <h2 className="text-2xl font-black text-white mb-2">Campus Locked</h2>
      <p className="text-slate-500 text-sm mb-8 max-w-xs">
        You need to purchase access to view study notes, videos, and formulas.
      </p>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full max-w-xs bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl shadow-xl shadow-emerald-500/20 mb-6 cursor-pointer"
        onClick={() => setPage("pay")}
      >
        <div className="text-white/70 text-[10px] font-bold uppercase mb-1">One-time Payment</div>
        <div className="text-4xl font-black text-white mb-1">{config.currency}{config.price}</div>
        <div className="text-white/80 text-xs mb-6">{config.days} Days Full Access</div>
        <div className="bg-white text-emerald-600 font-black py-3 rounded-xl text-sm">
          Buy Now
        </div>
      </motion.div>
      
      <p className="text-slate-600 text-[10px]">
        Secure payment via UPI · Instant submission
      </p>
    </div>
  );
};

const MainContent = () => {
  const { page, loading, isAdmin, hasAccess, user, pendingPayment, setPage, config } = useApp();
  const [tab, setTab] = useState(0);

  if (loading || (page === "app" && !user)) return <LoadingScreen />;

  if (page === "landing") return <LandingPage />;
  if (page === "auth") return <AuthPage />;
  if (page === "pay") return <PaymentPage />;
  if (page === "admin" && isAdmin) return <AdminPanel />;

  const renderContent = () => {
    if (!isAdmin && !hasAccess) {
      if (tab === 3) return <CampusChat />;
      return <LockedCampus />;
    }
    
    switch(tab) {
      case 0: return <CampusNotes />;
      case 1: return <CampusVideos />;
      case 2: return <CampusFormulas />;
      case 3: return <CampusChat />;
      default: return <CampusNotes />;
    }
  };

  return (
    <Layout>
      <div className="bg-[#0a0d14] border-b border-slate-900 p-4 pt-6 flex justify-between items-center sticky top-0 z-50">
        <div>
          <h1 className="text-lg font-black text-white leading-none">{APP_NAME}</h1>
          <p className="text-emerald-500 text-[10px] font-bold uppercase mt-1">MBOSE 2026 · Class XII</p>
        </div>
        <div className="flex items-center gap-3">
          {!isAdmin && !hasAccess && (
            <button 
              onClick={() => setPage("pay")}
              className="px-4 py-2 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-xl shadow-lg shadow-emerald-500/20 animate-pulse"
            >
              Buy Now
            </button>
          )}
          {isAdmin && (
            <button onClick={() => setPage("admin")} className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </button>
          )}
          <button onClick={() => logout()} className="p-2 bg-slate-900 text-slate-500 rounded-xl">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {config.announcement && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 p-3 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-emerald-500 shrink-0" />
          <p className="text-emerald-500 text-[10px] font-bold leading-tight">{config.announcement}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto pb-24">
        {renderContent()}
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-[#0a0d14]/80 backdrop-blur-xl border-t border-slate-900 flex justify-around p-3 pb-8 z-50">
        {[
          { icon: <BookOpen />, label: "Notes" },
          { icon: <Video />, label: "Videos" },
          { icon: <Calculator />, label: "Formulas" },
          { icon: <MessageSquare />, label: "Chat" }
        ].map((t, i) => (
          <button 
            key={i}
            onClick={() => setTab(i)}
            className={`flex flex-col items-center gap-1 transition-all ${tab === i ? 'text-emerald-500' : 'text-slate-600'}`}
          >
            <div className={`${tab === i ? 'scale-110' : 'scale-100'} transition-transform`}>{t.icon}</div>
            <span className="text-[10px] font-bold uppercase tracking-tighter">{t.label}</span>
          </button>
        ))}
      </div>
    </Layout>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainContent />
      </AppProvider>
    </ErrorBoundary>
  );
}
