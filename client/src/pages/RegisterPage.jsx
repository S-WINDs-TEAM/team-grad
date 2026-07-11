import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { useDispatch } from 'react-redux';
import { setUser } from '../store/authSlice';
import toast from 'react-hot-toast';

const RegisterPage = () => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const onSubmit = async (data) => {
    try {
      const response = await axiosInstance.post('/auth/register', data);
      dispatch(setUser(response.data.user));
      toast.success('acc created, welcome aboard');
      navigate('/home');
    } catch (err) {
      // alert(err.response?.data?.msg || 'Registration failed');
      toast.error(err.response?.data?.msg || 'Registration failed'); // user msg insted of alart
    }
  };

  return (
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
};

export default RegisterPage;