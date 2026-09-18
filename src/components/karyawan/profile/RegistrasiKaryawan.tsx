import React, { useState } from 'react';
import { supabase } from '../../../lib/supabase/client';
import '../../../styles/employee/registration.css';

interface RegistrasiKaryawanProps {
  onBack?: () => void;
}

interface SupabaseErrorLike {
  message?: string;
  name?: string;
  status?: number;
  code?: string;
  details?: string;
  hint?: string;
}

const RegistrasiKaryawan: React.FC<RegistrasiKaryawanProps> = ({
  onBack,
}) => {
  const [form, setForm] = useState({
    nama: '',
    email: '',
    no_telp: '',
    alamat_rumah: '',
    tanggal_lahir: '',
    password: '',
    konfirmasi: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const getDetailedError = (err: unknown): string => {
    const errorObject = err as SupabaseErrorLike | null | undefined;

    const message = errorObject?.message?.trim();
    const name = errorObject?.name;
    const status = errorObject?.status;
    const code = errorObject?.code;
    const details = errorObject?.details;
    const hint = errorObject?.hint;

    // Error jaringan/browser seperti "Failed to fetch"
    if (
      message?.toLowerCase().includes('failed to fetch') ||
      name === 'TypeError' &&
      message?.toLowerCase().includes('fetch')
    ) {
      return [
        'Tidak dapat terhubung ke Supabase.',
        '',
        'Periksa hal berikut:',
        '1. VITE_SUPABASE_URL di Netlify sudah benar.',
        '2. VITE_SUPABASE_ANON_KEY sudah benar.',
        '3. Environment variable tersedia untuk Production.',
        '4. Project Supabase masih aktif.',
        '5. Setelah mengubah Environment Variables, lakukan redeploy.',
        '',
        'Jika semua sudah benar tetapi masih gagal, buka browser Console (F12) dan kirim pesan error merahnya.'
      ].join('\n');
    }

    // Error autentikasi Supabase
    if (message) {
      const extra = [
        status ? `HTTP Status: ${status}` : '',
        code ? `Code: ${code}` : '',
        details ? `Detail: ${details}` : '',
        hint ? `Hint: ${hint}` : '',
      ].filter(Boolean);

      return extra.length > 0
        ? `${message}\n\n${extra.join('\n')}`
        : message;
    }

    // Error object yang tidak mempunyai message
    if (typeof err === 'string' && err.trim()) {
      return err;
    }

    return 'Pendaftaran gagal karena terjadi kesalahan yang tidak diketahui. Silakan buka Console browser (F12) untuk melihat detail.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError('');
    setSuccess(false);

    const nama = form.nama.trim();
    const email = form.email.trim().toLowerCase();
    const noTelp = form.no_telp.trim();
    const alamatRumah = form.alamat_rumah.trim();

    if (!nama) {
      setError('Nama lengkap wajib diisi.');
      return;
    }

    if (!email) {
      setError('Email wajib diisi.');
      return;
    }

    if (!form.password) {
      setError('Password wajib diisi.');
      return;
    }

    if (form.password.length < 6) {
      setError('Password minimal 6 karakter.');
      return;
    }

    if (form.password !== form.konfirmasi) {
      setError('Konfirmasi password tidak sama.');
      return;
    }

    setLoading(true);

    try {
      /*
       * Pastikan konfigurasi Supabase tersedia sebelum melakukan signUp.
       * Ini membantu membedakan masalah konfigurasi dengan masalah Auth.
       */
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl) {
        throw new Error(
          'VITE_SUPABASE_URL tidak tersedia. Periksa Environment Variables Netlify.'
        );
      }

      if (!supabaseAnonKey) {
        throw new Error(
          'VITE_SUPABASE_ANON_KEY tidak tersedia. Periksa Environment Variables Netlify.'
        );
      }

      if (
        !supabaseUrl.startsWith('https://') ||
        !supabaseUrl.includes('.supabase.co')
      ) {
        throw new Error(
          'VITE_SUPABASE_URL tidak valid. Gunakan Project URL dari Supabase.'
        );
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password: form.password,
        options: {
          data: {
            nama,
            no_telp: noTelp,
            alamat_rumah: alamatRumah,
            tanggal_lahir: form.tanggal_lahir || null,
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      /*
       * Supabase dapat mengembalikan user tanpa session ketika
       * email confirmation diaktifkan. Itu bukan error.
       */
      if (!data?.user) {
        throw new Error(
          'Supabase tidak mengembalikan data user. Periksa konfigurasi Authentication dan email registration di Supabase.'
        );
      }

      setSuccess(true);
    } catch (err: unknown) {
      console.error('MoonXprojecT - Registrasi Karyawan Error:', err);

      setError(getDetailedError(err));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="registration-page">
        <div className="registration-success">
          <div className="registration-logo">M</div>

          <h1>Pendaftaran Berhasil</h1>

          <p>
            Data Anda berhasil dikirim dan masuk ke proses verifikasi HR/Admin.
          </p>

          <div className="registration-success-box">
            <strong>Menunggu Verifikasi</strong>
            <span>
              Akun Anda akan dapat digunakan setelah HR/Admin mengaktifkannya.
            </span>
          </div>

          <button
            type="button"
            className="registration-button"
            onClick={onBack}
          >
            Kembali ke Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="registration-page">
      <div className="registration-shell">
        <div className="registration-brand">
          <div className="registration-logo">
            <img
              src="/sakura-moon.jpg"
              alt="MoonXprojecT"
            />
          </div>

          <div>
            <strong>MoonXprojecT</strong>
            <span>Human Resources & Workforce Platform</span>
          </div>
        </div>

        <div className="registration-card">
          <div className="registration-heading">
            <span className="registration-eyebrow">
              EMPLOYEE REGISTRATION
            </span>

            <h1>Daftar sebagai Karyawan</h1>

            <p>
              Lengkapi data berikut untuk membuat akun karyawan MoonHR.
            </p>
          </div>

          {error && (
            <div
              className="registration-error"
              role="alert"
              style={{
                whiteSpace: 'pre-line',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="registration-section">
              <h3>Data Pribadi</h3>

              <div className="registration-field">
                <label>Nama Lengkap *</label>
                <input
                  name="nama"
                  value={form.nama}
                  onChange={handleChange}
                  placeholder="Masukkan nama lengkap"
                  required
                  disabled={loading}
                />
              </div>

              <div className="registration-row">
                <div className="registration-field">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="nama@email.com"
                    required
                    disabled={loading}
                    autoComplete="email"
                  />
                </div>

                <div className="registration-field">
                  <label>No. Telepon</label>
                  <input
                    name="no_telp"
                    value={form.no_telp}
                    onChange={handleChange}
                    placeholder="08xxxxxxxxxx"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="registration-field">
                <label>Tanggal Lahir</label>
                <input
                  type="date"
                  name="tanggal_lahir"
                  value={form.tanggal_lahir}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>

              <div className="registration-field">
                <label>Alamat Rumah</label>
                <textarea
                  name="alamat_rumah"
                  value={form.alamat_rumah}
                  onChange={handleChange}
                  placeholder="Masukkan alamat lengkap"
                  rows={3}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="registration-section">
              <h3>Keamanan Akun</h3>

              <div className="registration-row">
                <div className="registration-field">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimal 6 karakter"
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>

                <div className="registration-field">
                  <label>Konfirmasi Password *</label>
                  <input
                    type="password"
                    name="konfirmasi"
                    value={form.konfirmasi}
                    onChange={handleChange}
                    placeholder="Ulangi password"
                    required
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <div className="registration-role-note">
              <strong>Role akun:</strong>
              <span>Karyawan</span>
              <p>
                Role ditentukan otomatis dan tidak dapat dipilih sendiri.
              </p>
            </div>

            <button
              type="submit"
              className="registration-button"
              disabled={loading}
            >
              {loading ? 'Memproses...' : 'Daftar Sekarang'}
            </button>

            <button
              type="button"
              className="registration-back"
              onClick={onBack}
              disabled={loading}
            >
              Sudah memiliki akun? Kembali ke Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrasiKaryawan;
