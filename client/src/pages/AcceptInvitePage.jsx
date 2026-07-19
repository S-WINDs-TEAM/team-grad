import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { validateInviteApi, acceptInviteApi } from '../api/authApi';
import { theme } from '../styles/theme';

// public page opened from the invite link a company_admin sends a driver by email —
// GET /auth/invite/:token validates it first, then POST /auth/invite/:token/accept sets the password.
const AcceptInvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm();

  const [status, setStatus] = useState('checking'); // checking | valid | invalid | done
  const [driverInfo, setDriverInfo] = useState(null);

  useEffect(() => {
    const checkToken = async () => {
      try {
        const response = await validateInviteApi(token);
        setDriverInfo(response.data.driver);
        setStatus('valid');
      } catch (err) {
        console.error('invite validation error:', err.response?.status, err.response?.data); // temp debug
        setStatus('invalid');
      }
    };
    checkToken();
  }, [token]);

  const onSubmit = async ({ password }) => {
    try {
      await acceptInviteApi(token, { password });
      setStatus('done');
      toast.success('account activated — you can log in now');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'could not activate account');
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.bgGlow} />

      <div style={styles.card}>
        <div style={styles.logo}>
          <span style={styles.logoIcon}>◈</span>
          <span style={styles.logoText}>S-WINDs</span>
        </div>

        {status === 'checking' && (
          <p style={styles.statusText}>Checking your invite link…</p>
        )}

        {status === 'invalid' && (
          <>
            <h2 style={styles.title}>Link invalid or expired</h2>
            <p style={styles.statusText}>
              This invite link is no longer valid. Ask your company admin to send you a new one.
            </p>
            <Link to="/login" style={styles.link}>← Back to login</Link>
          </>
        )}

        {status === 'valid' && (
          <>
            <h2 style={styles.title}>Welcome, {driverInfo?.name}</h2>
            <p style={styles.subtitle}>
              {driverInfo?.companyName
                ? `You've been invited to join ${driverInfo.companyName} as a driver.`
                : "You've been invited to join as a driver."}
              {' '}Set a password to activate your account.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
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

              <div style={styles.field}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  style={styles.input}
                  type="password"
                  placeholder="Re-enter password"
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) => value === watch('password') || 'Passwords do not match',
                  })}
                />
                {errors.confirmPassword && <span style={styles.error}>{errors.confirmPassword.message}</span>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.7 : 1 }}
              >
                {isSubmitting ? 'Activating…' : 'Activate Account →'}
              </button>
            </form>
          </>
        )}

        {status === 'done' && (
          <>
            <h2 style={styles.title}>You're all set 🎉</h2>
            <p style={styles.statusText}>Your account is active. You can log in now.</p>
            <button style={styles.submitBtn} onClick={() => navigate('/login')}>
              Go to Login →
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: theme.bgPrimary,
    fontFamily: 'system-ui, sans-serif',
    position: 'relative',
    overflow: 'hidden',
  },
  bgGlow: {
    position: 'absolute',
    top: '-10%',
    left: '30%',
    width: '50%',
    height: '60%',
    background: 'radial-gradient(circle, rgba(37,99,235,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    maxWidth: '420px',
    background: 'rgba(13,19,33,0.95)',
    border: `1px solid ${theme.borderDefault}`,
    borderRadius: '20px',
    padding: '40px',
    backdropFilter: 'blur(20px)',
    textAlign: 'center',
  },
  logo: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '24px' },
  logoIcon: { fontSize: '22px', color: theme.accentBlue },
  logoText: { fontSize: '20px', fontWeight: '700', color: theme.textPrimary },
  title: { fontSize: '22px', fontWeight: '700', color: theme.textPrimary, margin: '0 0 10px' },
  subtitle: { fontSize: '13px', color: theme.textMuted, margin: '0 0 24px', lineHeight: 1.6 },
  statusText: { fontSize: '14px', color: theme.textSecondary, margin: '0 0 20px', lineHeight: 1.6 },
  form: { display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' },
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
    padding: '14px', background: theme.accentBlue, color: '#fff', border: 'none',
    borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
    marginTop: '8px', width: '100%',
  },
  link: { color: theme.accentBlue, textDecoration: 'none', fontWeight: '500', fontSize: '13px' },
};

export default AcceptInvitePage;