import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { damageApi } from '../../api/damageApi';
import moment from 'moment';

export default function DamageDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await damageApi.getPublicReports();
      setReports(res.data || []);
    } catch (err) {
      toast.error('Không thể tải danh sách báo cáo thiệt hại');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleReport = async (id) => {
    if (!window.confirm('Bạn có chắc chắn hồ sơ này là sai sự thật và muốn báo cáo gian lận?')) return;
    
    try {
      await damageApi.reportDispute(id);
      toast.success('Đã báo cáo thành công! Hồ sơ đã bị chuyển sang trạng thái tranh chấp.');
      fetchReports();
    } catch (err) {
      toast.error(err?.response?.data || err?.response?.data?.message || 'Báo cáo thất bại');
    }
  };

  if (loading) {
    return (
      <div className="p-4 max-w-lg mx-auto flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-gray-800 mb-2">Bảng Tin Trợ Cấp Đặc Biệt</h2>
      <p className="text-sm text-gray-600 mb-6">
        Danh sách các hộ dân được khảo sát thiệt hại sau bão. Hồ sơ sẽ được công khai 3 ngày để cộng đồng giám sát.
      </p>

      {reports.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border text-center text-gray-500 shadow-sm">
          <span className="text-4xl mb-3 block">✅</span>
          Hiện tại không có hồ sơ nào đang chờ duyệt.
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => {
            const timeDiff = moment().diff(moment(report.createdAt), 'hours');
            const hoursLeft = Math.max(0, 72 - timeDiff);

            let levelClass = 'bg-blue-100 text-blue-700 border-blue-200';
            let levelLabel = 'Mức 1 (Nhẹ)';
            if (report.damageLevel === 2) {
              levelClass = 'bg-orange-100 text-orange-700 border-orange-200';
              levelLabel = 'Mức 2 (Nặng)';
            } else if (report.damageLevel === 3) {
              levelClass = 'bg-red-100 text-red-700 border-red-200';
              levelLabel = 'Mức 3 (Nghiêm trọng)';
            }

            return (
              <div key={report.id} className="bg-white rounded-2xl shadow-sm border overflow-hidden">
                {report.evidenceImageUrl && (
                  <div className="w-full h-48 bg-gray-100 overflow-hidden">
                    <img 
                      src={`http://localhost:7071${report.evidenceImageUrl}`} 
                      alt="Hiện trường" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                )}
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-gray-800 text-lg">{report.citizenName}</h3>
                      <p className="text-sm text-gray-500">📍 {report.province}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${levelClass}`}>
                      {levelLabel}
                    </span>
                  </div>

                  <div className="bg-blue-50 text-blue-800 text-xs px-3 py-2 rounded-lg font-medium mb-4">
                    ⏳ Đang trong thời gian công khai (Còn {hoursLeft} giờ nữa)
                  </div>

                  <button 
                    onClick={() => handleReport(report.id)}
                    className="w-full h-10 flex items-center justify-center gap-2 bg-red-50 text-red-600 font-semibold text-sm rounded-xl border border-red-200 hover:bg-red-100 transition-colors">
                    <span>🚩</span> Báo cáo sai sự thật
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
