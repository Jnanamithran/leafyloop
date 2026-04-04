/**
 * pages/LoginPage.jsx
 */
import { useState }      from "react";
import { Link }          from "react-router-dom";
import { useForm }       from "react-hook-form";
import { zodResolver }   from "@hookform/resolvers/zod";
import { z }             from "zod";
import { motion }        from "framer-motion";
import { Eye, EyeOff, Leaf, Mail, Lock } from "lucide-react";

import { PageTransition } from "../components/PageTransition";
import { useAuth }        from "../hooks";
import { signInWithGoogle } from "../utils/firebase";

const FOREST = "#1B3022";
const SAGE   = "#2D5A27";

const loginSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

function GoogleButton({ onClick, loading }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={loading}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border-2
                 border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-sm
                 transition-all disabled:opacity-60"
    >
      {loading ? (
        <div className="w-5 h-5 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
      ) : (
        <>
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </>
      )}
    </motion.button>
  );
}

export function LoginPage() {
  const [showPass, setShowPass] = useState(false);
  const { login, loginLoading, googleLogin, googleLoading } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const handleGoogle = async () => {
    const idToken = await signInWithGoogle();
    if (idToken) googleLogin(idToken);
  };

  const inputCls = "w-full pl-10 pr-4 py-3 border border-stone-200 rounded-2xl text-sm text-stone-800 " +
    "placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/30 focus:border-[#2D5A27] bg-white";

  return (
    <PageTransition>
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                   style={{ background: FOREST }}>
                <Leaf size={28} className="text-white" />
              </div>
              <span className="text-2xl font-bold" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
                LeafyLoop
              </span>
            </Link>
            <h1 className="text-xl font-bold text-stone-800 mt-4">Welcome back 🌿</h1>
            <p className="text-stone-400 text-sm mt-1">Sign in to your plant account</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8 space-y-5">
            {/* Google */}
            <GoogleButton onClick={handleGoogle} loading={googleLoading} />

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-100" />
              <span className="text-xs text-stone-400">or sign in with email</span>
              <div className="flex-1 h-px bg-stone-100" />
            </div>

            <form onSubmit={handleSubmit(login)} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input {...register("email")} type="email" placeholder="Email address" className={inputCls} />
              </div>
              {errors.email && <p className="text-xs text-red-500 -mt-2">{errors.email.message}</p>}

              {/* Password */}
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  {...register("password")}
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  className={inputCls + " pr-12"}
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-red-500 -mt-2">{errors.password.message}</p>}

              <motion.button
                type="submit"
                disabled={loginLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm
                           disabled:opacity-60 transition-all shadow-md"
                style={{ background: FOREST }}
              >
                {loginLoading ? "Signing in…" : "Sign In"}
              </motion.button>
            </form>
          </div>

          <p className="text-center text-sm text-stone-500 mt-5">
            Don't have an account?{" "}
            <Link to="/register" className="font-semibold hover:underline" style={{ color: SAGE }}>
              Create one
            </Link>
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * pages/RegisterPage.jsx (exported from same file for brevity)
 */
const registerSchema = z.object({
  name:            z.string().min(2, "Name is too short"),
  email:           z.string().email("Invalid email address"),
  password:        z.string()
                     .min(8, "Must be at least 8 characters")
                     .regex(/[A-Z]/, "Needs an uppercase letter")
                     .regex(/[0-9]/, "Needs a number"),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path:    ["confirmPassword"],
});

export function RegisterPage() {
  const [showPass, setShowPass] = useState(false);
  const { register: registerUser, registerLoading, googleLogin, googleLoading } = useAuth();

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const handleGoogle = async () => {
    const idToken = await signInWithGoogle();
    if (idToken) googleLogin(idToken);
  };

  const inputCls = "w-full pl-10 pr-4 py-3 border border-stone-200 rounded-2xl text-sm text-stone-800 " +
    "placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#2D5A27]/30 focus:border-[#2D5A27] bg-white";

  return (
    <PageTransition>
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex flex-col items-center gap-2">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg"
                   style={{ background: FOREST }}>
                <Leaf size={28} className="text-white" />
              </div>
              <span className="text-2xl font-bold" style={{ color: FOREST, fontFamily: "'Playfair Display', serif" }}>
                LeafyLoop
              </span>
            </Link>
            <h1 className="text-xl font-bold text-stone-800 mt-4">Join the green family 🌱</h1>
            <p className="text-stone-400 text-sm mt-1">Create your LeafyLoop account</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-8 space-y-5">
            <GoogleButton onClick={handleGoogle} loading={googleLoading} />

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-stone-100" />
              <span className="text-xs text-stone-400">or register with email</span>
              <div className="flex-1 h-px bg-stone-100" />
            </div>

            <form onSubmit={handleSubmit(registerUser)} className="space-y-4">
              {[
                { name: "name",            icon: "🌿", placeholder: "Full name",         type: "text"     },
                { name: "email",           icon: "✉️",  placeholder: "Email address",     type: "email"    },
                { name: "password",        icon: "🔒",  placeholder: "Password",          type: showPass ? "text" : "password", togglePw: true },
                { name: "confirmPassword", icon: "🔒",  placeholder: "Confirm password",  type: showPass ? "text" : "password" },
              ].map(({ name, icon, placeholder, type, togglePw }) => (
                <div key={name}>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm">{icon}</span>
                    <input
                      {...register(name)}
                      type={type}
                      placeholder={placeholder}
                      className={inputCls + (togglePw ? " pr-12" : "")}
                    />
                    {togglePw && (
                      <button
                        type="button"
                        onClick={() => setShowPass((s) => !s)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
                      >
                        {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    )}
                  </div>
                  {errors[name] && (
                    <p className="text-xs text-red-500 mt-1">{errors[name].message}</p>
                  )}
                </div>
              ))}

              <motion.button
                type="submit"
                disabled={registerLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-2xl text-white font-semibold text-sm disabled:opacity-60 shadow-md"
                style={{ background: FOREST }}
              >
                {registerLoading ? "Creating account…" : "Create Account 🌿"}
              </motion.button>
            </form>
          </div>

          <p className="text-center text-sm text-stone-500 mt-5">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold hover:underline" style={{ color: SAGE }}>Sign in</Link>
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}

// Default exports
export default LoginPage;
