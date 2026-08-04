<<<<<<< HEAD
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/authSlice';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
=======
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import { registerApi, registerCompanyApi } from '../api/authApi';
import { setUser } from '../store/authSlice';
import { theme } from '../styles/theme';

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  // landing page sends ?type=driver or ?type=fleet — defaults to individual either way
  const [accountType, setAccountType] = useState(
    searchParams.get('type') === 'fleet' ? 'company' : 'individual'
  );

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({ shouldUnregister: true });
>>>>>>> origin/ElSayed
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onSubmit = async (data) => {
    try {
<<<<<<< HEAD
      const response = await axiosInstance.post('/auth/register', data);
      dispatch(setUser(response.data.user));
      toast.success('acc created, welcome aboard');
      navigate('/home');
    } catch (err) {
      // alert(err.response?.data?.msg || 'Registration failed');
      toast.error(err.response?.data?.msg || 'Registration failed'); // user msg insted of alart
=======
      const response = accountType === 'company'
        ? await registerCompanyApi(data)
        : await registerApi(data);

      dispatch(setUser(response.data.user));
      toast.success(
        accountType === 'company' ? 'company registered, welcome aboard' : 'acc created, welcome aboard'
      );

      // Fleet Dashboard (Task 5) isn't built yet, so company_admin lands on /home too for now
      // BUG FIX: was navigate('fleet') — a path WITHOUT a leading slash is treated
      // as RELATIVE to the current URL by React Router. From "/register" that resolves
      // to "/register/fleet", which matches no route and bounces the user to "/landing".
      // Company admins could never reach the fleet dashboard after registering.
      // Fix: use the absolute path "/fleet".
      navigate(accountType === 'company' ? '/fleet' : '/home');
    } catch (err) {
      // BUG FIX: the old code only logged err.response?.data, which is
      // undefined when the request got NO HTTP response (server not running,
      // MongoDB down so the server crashed on boot, or CORS preflight blocked).
      // In that case the true cause lives in err.message / err.code
      // (e.g. "connect ECONNREFUSED 127.0.0.1:5000"). Now we log the
      // full error AND show a message that distinguishes a connection
      // failure from a real validation error.
      console.error('registration failed — status:', err.response?.status, '| message:', err.message, '| code:', err.code);
      if (!err.response) {
        toast.error('Cannot reach the server — is it running on :5000 with MongoDB up?');
      } else {
        toast.error(err.response?.data?.msg || 'Registration failed');
      }
>>>>>>> origin/ElSayed
    }
  };

  return (
<<<<<<< HEAD
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>S-WINDs 🌬️</h1>
        <p style={styles.subtitle}>Create your account</p>

        <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>

          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              style={styles.input}
              placeholder="Ahmed Mohamed"
              {...register('name', { required: 'Name is required' })}
            />
            {errors.name && <span style={styles.error}>{errors.name.message}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              placeholder="you@example.com"
              {...register('email', { required: 'Email is required' })}
            />
            {errors.email && <span style={styles.error}>{errors.email.message}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Min 6 characters"
              {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'Min 6 characters' } })}
            />
            {errors.password && <span style={styles.error}>{errors.password.message}</span>}
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Vehicle Type</label>
            <select style={styles.input} {...register('vehicleType')}>
              <option value="car">🚗 Car</option>
              <option value="motorcycle">🏍️ Motorcycle</option>
              <option value="truck">🚛 Truck</option>
            </select>
          </div>

          <button
            type="submit"
            style={isSubmitting ? styles.buttonDisabled : styles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>

        </form>

        <p style={styles.link}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
=======
    <div style={styles.page}>

      {/* ===== يسار: atmospheric panel، نفس أسلوب LoginPage ===== */}
      <div style={styles.leftPanel}>
        <div style={styles.leftGlow} />

        <div style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>S-WINDs</span>
        </div>

        <div style={styles.leftContent}>
          <h1 style={styles.leftTitle}>
            {accountType === 'company' ? (
              <>Manage Your Fleet.<br /><span style={{ color: theme.accentGreen }}>Stay Ahead.</span></>
            ) : (
              <>Join S-WINDs.<br /><span style={{ color: theme.accentBlue }}>Drive Smart.</span></>
            )}
          </h1>
          <p style={styles.leftSub}>
            {accountType === 'company'
              ? 'Add your vehicles and drivers, track them live, and send weather alerts in one place.'
              : 'Real-time weather intelligence for every journey.'}
          </p>

          <div style={styles.featuresList}>
            {(accountType === 'company'
              ? [
                  { icon: '🚛', text: 'Live fleet tracking' },
                  { icon: '👥', text: 'Invite drivers by email' },
                  { icon: '🔔', text: 'Emergency weather alerts' },
                  { icon: '📊', text: 'Fleet status at a glance' },
                ]
              : [
                  { icon: '🌦', text: 'ETA-Based Weather Forecast' },
                  { icon: '🗺', text: 'Smart Route Recommendations' },
                  { icon: '🛡', text: 'Per-Waypoint Risk Analysis' },
                  { icon: '⚡', text: 'Smart Departure Suggestions' },
                ]
            ).map(f => (
              <div key={f.text} style={styles.featureItem}>
                <span style={styles.featureIcon}>{f.icon}</span>
                <span style={styles.featureText}>{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={styles.roadVisual}>
          <svg width="100%" height="80" viewBox="0 0 400 80" preserveAspectRatio="none">
            <path d="M 0 80 Q 200 20 400 40" stroke="rgba(37,99,235,0.3)" strokeWidth="1" fill="none" />
            <path d="M 0 80 Q 200 30 400 50" stroke="rgba(37,99,235,0.15)" strokeWidth="1" fill="none" />
            <circle cx="120" cy="58" r="3" fill="#2563EB" opacity="0.6" />
            <circle cx="250" cy="35" r="3" fill="#10B981" opacity="0.6" />
            <circle cx="350" cy="45" r="3" fill="#F59E0B" opacity="0.5" />
          </svg>
        </div>
      </div>

      {/* ===== يمين: form ===== */}
      <div style={styles.rightPanel}>
        <div style={styles.formCard}>

          {/* Individual / Company toggle */}
          <div style={styles.toggleRow}>
            <button
              type="button"
              style={accountType === 'individual' ? styles.toggleBtnActive : styles.toggleBtn}
              onClick={() => setAccountType('individual')}
            >
              🚗 Individual
            </button>
            <button
              type="button"
              style={accountType === 'company'
                ? { ...styles.toggleBtnActive, background: theme.accentGreen }
                : styles.toggleBtn}
              onClick={() => setAccountType('company')}
            >
              🏢 Company
            </button>
          </div>

          <div style={styles.formHeader}>
            <h2 style={styles.formTitle}>
              {accountType === 'company' ? 'Register your company' : 'Create your account'}
            </h2>
            <p style={styles.formSub}>
              {accountType === 'company'
                ? "You'll manage the fleet — drivers get their own invite link, no driving for you."
                : 'Plan smarter, weather-aware trips.'}
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>

            {accountType === 'company' ? (
              <>
                <div style={styles.field}>
                  <label style={styles.label}>Company Name</label>
                  <input
                    style={styles.input}
                    placeholder="Nile Logistics"
                    {...register('companyName', { required: 'Company name is required' })}
                  />
                  {errors.companyName && <span style={styles.error}>{errors.companyName.message}</span>}
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Industry (optional)</label>
                  <input
                    style={styles.input}
                    placeholder="Freight & Logistics"
                    {...register('industry')}
                  />
                </div>

                <div style={styles.field}>
                  <label style={styles.label}>Your Name (admin)</label>
                  <input
                    style={styles.input}
                    placeholder="Ahmed Mohamed"
                    {...register('adminName', { required: 'Your name is required' })}
                  />
                  {errors.adminName && <span style={styles.error}>{errors.adminName.message}</span>}
                </div>
              </>
            ) : (
              <div style={styles.field}>
                <label style={styles.label}>Full Name</label>
                <input
                  style={styles.input}
                  placeholder="Ahmed Mohamed"
                  {...register('name', { required: 'Name is required' })}
                />
                {errors.name && <span style={styles.error}>{errors.name.message}</span>}
              </div>
            )}

            <div style={styles.field}>
              <label style={styles.label}>Email</label>
              <input
                style={styles.input}
                type="email"
                placeholder="you@example.com"
                {...register('email', { required: 'Email is required' })}
              />
              {errors.email && <span style={styles.error}>{errors.email.message}</span>}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Password</label>
              <input
                style={styles.input}
                type="password"
                placeholder="Min 6 characters"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Min 6 characters' },
                })}
              />
              {errors.password && <span style={styles.error}>{errors.password.message}</span>}
            </div>

            {accountType === 'individual' && (
              <div style={styles.field}>
                <label style={styles.label}>Vehicle Type</label>
                <select style={styles.input} {...register('vehicleType')}>
                  <option value="car">🚗 Car</option>
                  <option value="motorcycle">🏍️ Motorcycle</option>
                  <option value="truck">🚛 Truck</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.submitBtn,
                background: accountType === 'company' ? theme.accentGreen : theme.accentBlue,
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting
                ? 'Creating account...'
                : accountType === 'company' ? 'Register Company →' : 'Create Account →'}
            </button>
          </form>

          <p style={styles.switchText}>
            Already have an account? <Link to="/login" style={styles.link}>Log in</Link>
          </p>
        </div>
      </div>

>>>>>>> origin/ElSayed
    </div>
  );
};

const styles = {
<<<<<<< HEAD
  container: {
    minHeight: '100vh',
    backgroundColor: '#1F3864',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  logo: { textAlign: 'center', fontSize: '2.5rem', color: '#1F3864', margin: '0 0 8px 0' },
  subtitle: { textAlign: 'center', color: '#6b7280', marginBottom: '32px', fontSize: '0.9rem' },
  form: { display: 'flex', flexDirection: 'column', gap: '20px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '0.875rem', fontWeight: '600', color: '#374151' },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '1rem',
    outline: 'none',
  },
  error: { color: '#ef4444', fontSize: '0.75rem' },
  button: {
    padding: '14px',
    backgroundColor: '#2E75B6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  buttonDisabled: {
    padding: '14px',
    backgroundColor: '#93c5fd',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'not-allowed',
    marginTop: '8px',
  },
  link: { textAlign: 'center', marginTop: '20px', color: '#6b7280', fontSize: '0.875rem' },
=======
  page: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    background: theme.bgPrimary,
    fontFamily: 'system-ui, sans-serif',
  },

  leftPanel: {
    background: 'linear-gradient(160deg, #0D1321 0%, #080C14 100%)',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    borderRight: `1px solid ${theme.borderDefault}`,
  },
  leftGlow: {
    position: 'absolute',
    top: '-10%',
    left: '-10%',
    width: '70%',
    height: '70%',
    background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  logo: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'auto', position: 'relative', zIndex: 1 },
  logoIcon: { fontSize: '22px', color: theme.accentBlue },
  logoText: { fontSize: '20px', fontWeight: '700', color: theme.textPrimary },
  leftContent: { position: 'relative', zIndex: 1, marginBottom: '32px' },
  leftTitle: { fontSize: '34px', fontWeight: '800', color: theme.textPrimary, lineHeight: 1.2, margin: '0 0 16px' },
  leftSub: { fontSize: '15px', color: theme.textMuted, margin: '0 0 32px' },
  featuresList: { display: 'flex', flexDirection: 'column', gap: '14px' },
  featureItem: {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: theme.bgGlass, border: `1px solid ${theme.borderDefault}`,
    borderRadius: '10px', padding: '12px 16px',
  },
  featureIcon: { fontSize: '18px' },
  featureText: { fontSize: '13px', color: theme.textSecondary },
  roadVisual: { position: 'relative', zIndex: 1 },

  rightPanel: { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', overflowY: 'auto' },
  formCard: {
    width: '100%', maxWidth: '420px',
    background: 'rgba(13,19,33,0.95)',
    border: `1px solid ${theme.borderDefault}`,
    borderRadius: '20px', padding: '32px',
    backdropFilter: 'blur(20px)',
  },

  toggleRow: { display: 'flex', gap: '8px', marginBottom: '24px' },
  toggleBtn: {
    flex: 1, padding: '10px', borderRadius: '10px',
    border: `1px solid ${theme.borderDefault}`, background: 'transparent',
    color: theme.textSecondary, fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },
  toggleBtnActive: {
    flex: 1, padding: '10px', borderRadius: '10px',
    border: '1px solid transparent', background: theme.accentBlue,
    color: '#fff', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
  },

  formHeader: { marginBottom: '24px' },
  formTitle: { fontSize: '22px', fontWeight: '700', color: theme.textPrimary, margin: '0 0 6px' },
  formSub: { fontSize: '13px', color: theme.textMuted, margin: 0, lineHeight: 1.5 },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { fontSize: '13px', fontWeight: '500', color: theme.textSecondary },
  input: {
    width: '100%', padding: '12px 14px',
    background: theme.bgTertiary, border: `1px solid ${theme.borderDefault}`,
    borderRadius: '10px', color: theme.textPrimary, fontSize: '14px',
    outline: 'none', boxSizing: 'border-box',
  },
  error: { fontSize: '12px', color: theme.accentRed },
  submitBtn: {
    padding: '14px', color: '#fff', border: 'none', borderRadius: '10px',
    fontSize: '15px', fontWeight: '600', cursor: 'pointer', marginTop: '8px',
    transition: 'opacity 0.2s',
  },
  switchText: { textAlign: 'center', fontSize: '13px', color: theme.textMuted, marginTop: '20px' },
  link: { color: theme.accentBlue, textDecoration: 'none', fontWeight: '500' },
>>>>>>> origin/ElSayed
};

export default RegisterPage;