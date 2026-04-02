import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import QrScanner from '../../components/ui/QrScanner';
import ErrorFlash from '../../components/ui/ErrorFlash';
import { damageApi } from '../../api/damageApi';
import { useQRScanner } from '../../hooks/useQRScanner';

export default function StandaloneSurvey() {
  const [surveyingWallet, setSurveyingWallet] = useState(null);
  const [damageLevel, setDamageLevel] = useState(1);
  const [evidenceFile, setEvidenceFile] = useState(null);
  const [surveyProcessing, setSurveyProcessing] = useState(false);
  const [errorFlash, setErrorFlash] = useState(0);
  const processingRef = useRef(false);

  // SCANNED inner logic
  const handleScanCitizenInner = (walletAddress) => {
    if (processingRef.current) return;
    processingRef.current = true;
    
    // Ngay khi quét thành công
    setSurveyingWallet(walletAddress);
    setDamageLevel(1);
    setEvidenceFile(null);
  };

  // Sử dụng hook chống dội
  const { handleScan } = useQRScanner(handleScanCitizenInner);

  // CLOSE / SKIP
  const handleCloseSurvey = () => {
    setSurveyingWallet(null);
    setDamageLevel(1);
    setEvidenceFile(null);
    processingRef.current = false;
  };

  // SUBMIT
  const handleSubmitSurvey = async (e) => {
    if (e) e.preventDefault();
    if ((damageLevel === 2 || damageLevel === 3) && !evidenceFile) {
      toast.error('Bắt buộc phải có ảnh hiện trường cho mức độ 2 và 3');
      return;
    }
    setSurveyProcessing(true);
    try {
      const formData = new FormData();
      formData.append('walletAddress', surveyingWallet);
      formData.append('damageLevel', damageLevel);
      if (evidenceFile) {
        formData.append('file', evidenceFile);
      }
      await damageApi.assessDamageByWallet(formData);
      toast.success('Đã gửi báo cáo thiệt hại thành công');
      handleCloseSurvey();
    } catch (err) {
      toast.error('Gửi báo cáo thất bại');
    } finally {
      setSurveyProcessing(false);
    }
  };

  return (
    <div className="p-4 max-w-lg mx-auto pb-24">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">Khảo sát thiệt hại</h2>
        <p className="text-sm text-gray-500 mt-1">Quét mã QR của người dân để báo cáo thiệt hại mà không cần kèm theo đơn hàng cứu trợ.</p>
      </div>

      <ErrorFlash trigger={errorFlash} />

      {!surveyingWallet ? (
        <div className="bg-white rounded-2xl p-4 shadow border border-gray-100 mb-6">
          <QrScanner onSuccess={handleScan} onError={() => setErrorFlash(n => n + 1)} delay={500} />
          <p className="text-center text-gray-500 mt-4 text-sm tracking-tight">Hướng Camera vào ví cá nhân của người dân</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-5 shadow-lg border border-blue-100 ring-1 ring-blue-50">
          <h3 className="font-bold text-lg mb-4 text-gray-800">Đánh giá nhà dân</h3>
          
          <div className="space-y-3 mb-6">
            <label className={`block p-3 rounded-xl border-2 transition-colors cursor-pointer ${damageLevel === 1 ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-blue-200'}`}>
              <div className="flex items-center gap-3">
                <input type="radio" value={1} checked={damageLevel === 1} onChange={() => setDamageLevel(1)} className="w-5 h-5 accent-blue-600" />
                <div>
                  <p className="font-bold text-sm text-gray-800">Mức 1 - Bình thường</p>
                  <p className="text-xs text-gray-500">Ngập nhẹ, nhà & kết cấu an toàn</p>
                </div>
              </div>
            </label>
            <label className={`block p-3 rounded-xl border-2 transition-colors cursor-pointer ${damageLevel === 2 ? 'border-orange-500 bg-orange-50' : 'border-gray-100 hover:border-orange-200'}`}>
              <div className="flex items-center gap-3">
                <input type="radio" value={2} checked={damageLevel === 2} onChange={() => setDamageLevel(2)} className="w-5 h-5 accent-orange-600" />
                <div>
                  <p className="font-bold text-sm text-gray-800">Mức 2 - Thiệt hại nặng</p>
                  <p className="text-xs text-gray-500">Ngập sâu, hư hỏng đồ đạc lớn</p>
                </div>
              </div>
            </label>
            <label className={`block p-3 rounded-xl border-2 transition-colors cursor-pointer ${damageLevel === 3 ? 'border-red-500 bg-red-50' : 'border-gray-100 hover:border-red-200'}`}>
              <div className="flex items-center gap-3">
                <input type="radio" value={3} checked={damageLevel === 3} onChange={() => setDamageLevel(3)} className="w-5 h-5 accent-red-600" />
                <div>
                  <p className="font-bold text-sm text-gray-800">Mức 3 - Nghiêm trọng</p>
                  <p className="text-xs text-gray-500">Sập nhà, sạt lở, mất trắng tài sản</p>
                </div>
              </div>
            </label>
          </div>

          {damageLevel > 1 && (
            <div className="mb-6 animate-in slide-in-from-top-2 duration-300">
              <p className="text-sm font-semibold mb-2 text-gray-800">📸 Ảnh hiện trường (Bắt buộc)</p>
              <label className="block w-full h-32 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                {evidenceFile ? (
                  <div className="text-center">
                    <p className="text-sm text-blue-600 font-medium">{evidenceFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Nhấn để tải lại ảnh</p>
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <span className="text-3xl mb-1 block">📷</span>
                    <p className="text-sm font-medium">Bấm chụp hoặc chọn ảnh</p>
                  </div>
                )}
                <input type="file" accept="image/*" 
                  onChange={e => setEvidenceFile(e.target.files[0])} 
                  className="hidden" />
              </label>
            </div>
          )}

          {damageLevel === 1 ? (
            <button onClick={handleCloseSurvey}
              className="w-full h-14 bg-gray-100 text-gray-800 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors border-2 border-gray-200">
              ⏭ Mức 1 (An toàn) - Bo qua
            </button>
          ) : (
            <div className="flex gap-3">
              <button onClick={handleCloseSurvey}
                className="flex-1 h-14 bg-gray-100 text-gray-600 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">
                Trở lại
              </button>
              <button onClick={handleSubmitSurvey} disabled={surveyProcessing}
                className="flex-1 h-14 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center">
                {surveyProcessing ? (
                  <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin mr-2" /> ...</>
                ) : (
                  '🚩 Gửi Báo Cáo'
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
