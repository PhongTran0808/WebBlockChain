import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleKey = (key) => {
    if (key === '⌫') setPin(p => p.slice(0, -1));
    else if (key && pin.length < 6) setPin(p => p + key);
  };

  const handleLogin = async () => {
    if (!username.trim()) { toast.error('Vui lòng nhập tên đăng nhập hoặc CCCD'); return; }
    if (pin.length < 6) { toast.error('PIN phải đủ 6 số'); return; }
    setLoading(true);
    try {
      const res = await authApi.login(username.trim(), pin);
      login(res.data.token);
      const routes = { ADMIN: '/admin', CITIZEN: '/citizen', SHOP: '/shop', TRANSPORTER: '/transporter' };
      navigate(routes[res.data.role] || '/');
    } catch {
      toast.error('Tên đăng nhập hoặc mật khẩu không đúng');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-700 to-blue-900 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-center text-blue-800 mb-1">Cứu Trợ Minh Bạch</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Đăng nhập để tiếp tục</p>

        {/* Username */}
        <input
          type="text"
          placeholder="Tên đăng nhập / CCCD"
          value={username}
          onChange={e => setUsername(e.target.value)}
          className="w-full border border-gray-300 rounded-xl px-4 h-12 text-base mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* PIN display */}
        <div className="flex justify-center gap-3 mb-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`w-4 h-4 rounded-full border-2 transition-colors
              ${i < pin.length ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`} />
          ))}
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {KEYS.map((key, i) => (
            <button
              key={i}
              onClick={() => handleKey(key)}
              disabled={!key}
              className={`h-16 rounded-xl text-2xl font-medium transition-colors
                ${key ? 'bg-gray-100 active:bg-gray-200 hover:bg-gray-200' : 'invisible'}`}
            >
              {key}
            </button>
          ))}
        </div>

        <button
          onClick={handleLogin}
          disabled={loading || pin.length < 6 || !username.trim()}
          className="w-full h-12 bg-blue-700 text-white rounded-xl text-base font-semibold
            disabled:opacity-50 disabled:cursor-not-allowed active:bg-blue-800"
        >
          {loading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>

        <p className="text-center text-xs text-gray-400 mt-4">
          Chưa có tài khoản?{' '}
          <a href="/register" className="text-blue-600 hover:underline font-medium">Đăng ký</a>
        </p>
      </div>
    </div>
  );
}
