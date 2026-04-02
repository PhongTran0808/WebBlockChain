import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axiosClient from '../../api/axiosClient';

const ROLES = [
  { value: 'CITIZEN', label: '👤 Người dân nhận cứu trợ' },
  { value: 'SHOP', label: '🏪 Cửa hàng cung cấp hàng' },
  { value: 'TRANSPORTER', label: '🚚 Tình nguyện viên giao hàng' },
];

const PROVINCES = [
  'An Giang','Bà Rịa - Vũng Tàu','Bắc Giang','Bắc Kạn','Bạc Liêu','Bắc Ninh',
  'Bến Tre','Bình Định','Bình Dương','Bình Phước','Bình Thuận','Cà Mau',
  'Cần Thơ','Cao Bằng','Đà Nẵng','Đắk Lắk','Đắk Nông','Điện Biên',
  'Đồng Nai','Đồng Tháp','Gia Lai','Hà Giang','Hà Nam','Hà Nội',
  'Hà Tĩnh','Hải Dương','Hải Phòng','Hậu Giang','Hòa Bình','Hưng Yên',
  'Khánh Hòa','Kiên Giang','Kon Tum','Lai Châu','Lâm Đồng','Lạng Sơn',
  'Lào Cai','Long An','Nam Định','Nghệ An','Ninh Bình','Ninh Thuận',
  'Phú Thọ','Phú Yên','Quảng Bình','Quảng Nam','Quảng Ngãi','Quảng Ninh',
  'Quảng Trị','Sóc Trăng','Sơn La','Tây Ninh','Thái Bình','Thái Nguyên',
  'Thanh Hóa','Thừa Thiên Huế','Tiền Giang','TP. Hồ Chí Minh','Trà Vinh',
  'Tuyên Quang','Vĩnh Long','Vĩnh Phúc','Yên Bái',
];

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function RegisterPage() {
  const [step, setStep] = useState(1); // 1: info, 2: pin
  const [form, setForm] = useState({
    username: '', fullName: '', role: 'CITIZEN',
    province: '', walletAddress: '',
  });
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinStep, setPinStep] = useState('set'); // 'set' | 'confirm'
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleKey = (key) => {
    const current = pinStep === 'set' ? pin : confirmPin;
    const setter = pinStep === 'set' ? setPin : setConfirmPin;
    if (key === '⌫') { setter(p => p.slice(0, -1)); return; }
    if (!key || current.length >= 6) return;
    const next = current + key;
    setter(next);
    if (next.length === 6) {
      if (pinStep === 'set') {
        setTimeout(() => setPinStep('confirm'), 200);
      } else {
        // Confirm step complete — submit
        setTimeout(() => handleSubmit(next), 200);
      }
    }
  };

  const handleSubmit = async (confirmedPin) => {
    if (pin !== confirmedPin) {
      toast.error('PIN xác nhận không khớp');
      setConfirmPin('');
      setPinStep('set');
      setPin('');
      return;
    }
    setLoading(true);
    try {
      await axiosClient.post('/api/auth/register', {
        ...form,
        password: pin,
      });
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.');
      navigate('/login');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Đăng ký thất bại');
      setPin(''); setConfirmPin(''); setPinStep('set');
    } finally {
      setLoading(false);
    }
  };

  const currentPin = pinStep === 'set' ? pin : confirmPin;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-700 to-blue-900 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6">
        <h1 className="text-2xl font-bold text-center text-blue-800 mb-1">Đăng ký tài khoản</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Hệ thống Cứu Trợ Minh Bạch</p>

        {step === 1 && (
          <div className="space-y-3">
            <input placeholder={form.role === 'CITIZEN' ? "CCCD (đảm bảo có đủ 15 số) *" : "Tên đăng nhập *"} value={form.username}
              onChange={e => setForm(f => ({...f, username: e.target.value}))}
              className="w-full border rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <input placeholder="Họ và tên" value={form.fullName}
              onChange={e => setForm(f => ({...f, fullName: e.target.value}))}
              className="w-full border rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

            <select value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}
              className="w-full border rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>

            <select value={form.province} onChange={e => setForm(f => ({...f, province: e.target.value}))}
              className="w-full border rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">-- Chọn Tỉnh/Thành phố --</option>
              {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>

            <input placeholder="Mã chiến dịch (tuỳ chọn)" value={form.walletAddress}
              onChange={e => setForm(f => ({...f, walletAddress: e.target.value}))}
              className="w-full border rounded-xl px-4 h-12 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

            {(form.role === 'SHOP' || form.role === 'TRANSPORTER') && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                ⚠️ Tài khoản {form.role === 'SHOP' ? 'Cửa hàng' : 'Tình nguyện viên'} cần được Admin phê duyệt trước khi sử dụng.
              </div>
            )}

            <button
              onClick={() => {
                const uname = form.username.trim();
                if (!uname) { 
                  toast.error(form.role === 'CITIZEN' ? 'Vui lòng nhập CCCD' : 'Nhập tên đăng nhập'); 
                  return; 
                }
                if (form.role === 'CITIZEN' && !/^\d{15}$/.test(uname)) {
                  toast.error('CCCD phải bao gồm đúng 15 số');
                  return;
                }
                setStep(2);
              }}
              className="w-full h-12 bg-blue-700 text-white rounded-xl font-semibold">
              Tiếp theo →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className="text-center text-sm text-gray-600 mb-2">
              {pinStep === 'set' ? 'Tạo mã PIN 6 số' : 'Nhập lại PIN để xác nhận'}
            </p>
            <div className="flex justify-center gap-3 mb-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`w-4 h-4 rounded-full border-2 transition-colors
                  ${i < currentPin.length ? 'bg-blue-600 border-blue-600' : 'border-gray-400'}`} />
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {KEYS.map((key, i) => (
                <button key={i} onClick={() => handleKey(key)} disabled={!key || loading}
                  className={`h-16 rounded-xl text-2xl font-medium transition-colors
                    ${key ? 'bg-gray-100 active:bg-gray-200 hover:bg-gray-200' : 'invisible'}`}>
                  {key}
                </button>
              ))}
            </div>
            <button onClick={() => { setStep(1); setPin(''); setConfirmPin(''); setPinStep('set'); }}
              className="w-full py-2 text-gray-500 text-sm">← Quay lại</button>
          </div>
        )}

        <p className="text-center text-xs text-gray-400 mt-4">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-600 hover:underline font-medium">Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
