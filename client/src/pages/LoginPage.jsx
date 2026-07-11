import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import toast from 'react-hot-toast';


const LoginPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    try {
      await login(data);
      toast.success('welcome back!'); //msg for user
      navigate('/home');
    } catch (err) {
      // alert(err.response?.data?.msg || 'Login failed');
      toast.error(err.response?.data?.msg || 'Login failed'); // msg insted of alart

    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>S-WINDs 🌬️</h1>
        <p style={styles.subtitle}>Smart Weather Navigation</p>

        <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>

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
              placeholder="••••••"
              {...register('password', { required: 'Password is required' })}
            />
            {errors.password && <span style={styles.error}>{errors.password.message}</span>}
          </div>

          <button
            type="submit"
            style={isSubmitting ? styles.buttonDisabled : styles.button}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Logging in...' : 'Login'}
          </button>

        </form>

        <p style={styles.link}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
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
  logo: {
    textAlign: 'center',
    fontSize: '2.5rem',
    color: '#1F3864',
    margin: '0 0 8px 0',
  },
  subtitle: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: '32px',
    fontSize: '0.9rem',
  },
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
};

export default LoginPage;