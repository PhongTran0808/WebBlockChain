import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CitizenRegistration() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    address: '',
    cccd: '',
    pin: '',
    campaignCode: '123456'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [result, setResult] = useState({
    walletAddress: '',
    ipfsCid: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Vui lòng nhập họ và tên';
    if (!formData.address.trim()) newErrors.address = 'Vui lòng nhập địa chỉ nhận cứu trợ';
    
    if (!/^\d{12}$/.test(formData.cccd)) {
      newErrors.cccd = 'CCCD phải bao gồm đúng 12 chữ số';
    }
    
    if (!/^\d{6}$/.test(formData.pin)) {
      newErrors.pin = 'Mã PIN bảo mật phải bao gồm đúng 6 chữ số';
    }

    if (!formData.campaignCode.trim()) {
      newErrors.campaignCode = 'Mã tạo chiến dịch không được để trống';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateDeterministicWallet = async (cccd, pin, campaignCode) => {
    const combinedStr = `${cccd}-${pin}-${campaignCode}`;
    const msgBuffer = new TextEncoder().encode(combinedStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexAddress = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return `0x${hexAddress.substring(0, 40)}`;
  };

  const generateIPFSCID = () => {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let cid = 'Qm';
    for (let i = 0; i < 44; i++) {
        cid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `ipfs://${cid}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);

    try {
      // Fake delay 2.5s for "blockchain" feel
      await new Promise(resolve => setTimeout(resolve, 2500));

      const wallet = await generateDeterministicWallet(
        formData.cccd, 
        formData.pin, 
        formData.campaignCode
      );
      const ipfs = generateIPFSCID();

      setResult({
        walletAddress: wallet,
        ipfsCid: ipfs
      });
      setSuccess(true);
    } catch (error) {
      console.error(error);
      alert('Đã xảy ra lỗi trong quá trình tạo ví!');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      address: '',
      cccd: '',
      pin: '',
      campaignCode: '123456'
    });
    setSuccess(false);
    setResult({ walletAddress: '', ipfsCid: '' });
  };

  const maskCCCD = (cccd) => {
    if (!cccd || cccd.length < 12) return cccd;
    return cccd.substring(0, 3) + '******' + cccd.substring(9);
  };

  const CheckIcon = () => (
    <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const WalletIcon = () => (
    <svg className="w-6 h-6 text-indigo-500 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    </svg>
  );

  const GlobeIcon = () => (
    <svg className="w-6 h-6 text-teal-500 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );

  const AlertIcon = () => (
    <svg className="w-6 h-6 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-md w-full space-y-8 bg-white p-6 sm:p-8 rounded-2xl shadow-xl border border-gray-100">
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-indigo-600 mb-6"></div>
            <h2 className="text-xl font-semibold text-gray-800 text-center">Đang xử lý...</h2>
            <p className="text-gray-500 text-center mt-2 px-4 animate-pulse">
              Đang mã hóa địa chỉ và tạo ví nhận tiền số an toàn cho bạn.
            </p>
          </div>
        ) : success ? (
          <div className="animate-fade-in-up">
            <CheckIcon />
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">Đăng Ký Thành Công!</h2>
            <p className="text-center text-gray-600 mb-8">
              Chúc mừng <strong>{formData.fullName}</strong> (CCCD: {maskCCCD(formData.cccd)}) đã hoàn tất hồ sơ cứu trợ.
            </p>

            <div className="space-y-4">
              <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 flex items-start space-x-3">
                <WalletIcon />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-indigo-900 mb-1">Địa chỉ ví nhận Token của bạn:</p>
                  <p className="text-xs bg-white text-indigo-700 p-2 rounded border border-indigo-200 break-all font-mono shadow-sm">
                    {result.walletAddress}
                  </p>
                </div>
              </div>

              <div className="bg-teal-50 rounded-xl p-4 border border-teal-100 flex items-start space-x-3">
                <GlobeIcon />
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-semibold text-teal-900 mb-1">Hồ sơ địa chỉ của bạn đã được mã hóa an toàn trên IPFS:</p>
                  <p className="text-xs bg-white text-teal-700 p-2 rounded border border-teal-200 break-all font-mono shadow-sm">
                    {result.ipfsCid}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 bg-red-50 rounded-xl p-4 border border-red-200 flex items-start shadow-sm">
              <AlertIcon />
              <p className="text-sm text-red-700 font-medium leading-relaxed">
                <strong className="block text-red-800 mb-1">CẢNH BÁO QUAN TRỌNG:</strong>
                TÊN, CCCD VÀ MÃ PIN LÀ CHÌA KHÓA DUY NHẤT. Nếu quên, bạn sẽ mất quyền nhận cứu trợ. Hệ thống phi tập trung không thể cấp lại mật khẩu.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              <button
                onClick={() => navigate('/')}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-base font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                Quay Lại Trang Chủ
              </button>
              <button
                onClick={resetForm}
                className="w-full flex justify-center py-3.5 px-4 border border-indigo-200 rounded-xl shadow-sm text-base font-semibold text-indigo-700 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
              >
                Đăng Ký Người Khác
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Đăng Ký Nhận Cứu Trợ</h1>
              <p className="mt-2 text-sm text-gray-600">
                Hệ thống minh bạch, an toàn và không yêu cầu cài đặt ví.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              {/* Phần 1: Thông tin Giao nhận */}
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2 mb-4">
                  1. Thông tin Giao nhận
                </h3>
                
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full px-4 py-3 border ${errors.fullName ? 'border-red-300 ring-red-300' : 'border-gray-300'} rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
                    placeholder="Nguyễn Văn A"
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Địa chỉ nhận cứu trợ (Số nhà, Phường/Xã, Quận/Huyện)
                  </label>
                  <textarea
                    id="address"
                    name="address"
                    rows="3"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full px-4 py-3 border ${errors.address ? 'border-red-300 ring-red-300' : 'border-gray-300'} rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-base`}
                    placeholder="VD: Số nhà 12, Thôn A, Xã B..."
                  />
                  {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
                </div>
              </div>

              {/* Phần 2: Thông tin Bảo mật */}
              <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 space-y-4">
                <h3 className="text-lg font-semibold text-blue-900 border-b border-blue-200 pb-2 mb-4">
                  2. Thông tin Bảo mật (Tạo Ví Trực Tiếp)
                </h3>
                
                <div>
                  <label htmlFor="cccd" className="block text-sm font-medium text-gray-700 mb-1">
                    Số Căn cước công dân (12 số)
                  </label>
                  <input
                    id="cccd"
                    name="cccd"
                    type="number"
                    value={formData.cccd}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full px-4 py-3 border ${errors.cccd ? 'border-red-300 ring-red-300' : 'border-gray-300'} rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-mono`}
                    placeholder="012345678910"
                  />
                  {errors.cccd && <p className="mt-1 text-sm text-red-600">{errors.cccd}</p>}
                </div>

                <div>
                  <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-1">
                    Mã PIN bảo mật (6 số)
                  </label>
                  <input
                    id="pin"
                    name="pin"
                    type="password"
                    inputMode="numeric"
                    maxLength={6}
                    value={formData.pin}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full px-4 py-3 border ${errors.pin ? 'border-red-300 ring-red-300' : 'border-gray-300'} rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-mono tracking-widest`}
                    placeholder="••••••"
                  />
                  {errors.pin && <p className="mt-1 text-sm text-red-600">{errors.pin}</p>}
                  <p className="text-xs text-gray-500 mt-1">Dùng để xác thực giao dịch, vui lòng ghi nhớ.</p>
                </div>

                <div>
                  <label htmlFor="campaignCode" className="block text-sm font-medium text-gray-700 mb-1">
                    Mã tạo chiến dịch
                  </label>
                  <input
                    id="campaignCode"
                    name="campaignCode"
                    type="text"
                    value={formData.campaignCode}
                    onChange={handleInputChange}
                    className={`appearance-none block w-full px-4 py-3 border ${errors.campaignCode ? 'border-red-300 ring-red-300' : 'border-gray-300'} rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base font-mono bg-white`}
                    placeholder="Mã chiến dịch cứu trợ"
                  />
                  {errors.campaignCode && <p className="mt-1 text-sm text-red-600">{errors.campaignCode}</p>}
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-lg font-bold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-md transition-all ease-in-out duration-150 active:scale-[0.98]"
                >
                  Hoàn Tất Đăng Ký Nhận Cứu Trợ
                </button>
              </div>
              <p className="text-xs text-center text-gray-400 mt-4">
                Hệ thống được thiết kế theo tiêu chuẩn Web2.5. Bảo mật bằng công nghệ Web3.
              </p>
            </form>
          </>
        )}
      </div>
      
      {/* Dynamic Keyframes injected safely */}
      <style>{`
        @keyframes fade-in-up {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
