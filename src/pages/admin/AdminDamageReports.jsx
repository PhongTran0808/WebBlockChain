import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';

export default function AdminDamageReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDisputedReports();
      setReports(res.data || []);
    } catch (err) {
      toast.error('Không thể tải dữ liệu kháng cáo');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleResolve = async (id, acceptReport) => {
    if (!window.confirm(acceptReport 
      ? 'Chấp nhận cờ báo cáo? (Bác bỏ hồ sơ gian lận)' 
      : 'Từ chối cờ báo cáo? (Khôi phục hồ sơ và chờ giải ngân)')) {
      return;
    }

    try {
      setProcessingId(id);
      await adminApi.resolveDamageDispute(id, acceptReport);
      toast.success(acceptReport ? 'Đã hủy bỏ hồ sơ gian lận' : 'Đã khôi phục hồ sơ hợp lệ');
      loadReports();
    } catch (err) {
      toast.error(err?.response?.data || 'Có lỗi xảy ra khi xử lý');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-700 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tòa Án Xử Lý Tranh Chấp</h1>
          <p className="text-sm text-gray-500 mt-1">
            Duyệt các báo cáo thiệt hại bị cộng đồng đánh dấu là gian lận (Disputed).
          </p>
        </div>
        <button onClick={loadReports} className="px-4 py-2 bg-white border rounded-lg text-sm font-medium hover:bg-gray-50">
          🔄 Làm mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm">
                <th className="py-3 px-4 font-semibold text-gray-600">ID</th>
                <th className="py-3 px-4 font-semibold text-gray-600">Người nộp</th>
                <th className="py-3 px-4 font-semibold text-gray-600">Khu vực</th>
                <th className="py-3 px-4 font-semibold text-gray-600 text-center">Mức độ</th>
                <th className="py-3 px-4 font-semibold text-gray-600 text-center">Minh chứng</th>
                <th className="py-3 px-4 font-semibold text-gray-600 text-center">Trạng thái</th>
                <th className="py-3 px-4 font-semibold text-gray-600 text-right">Phán quyết</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-100">
              {reports.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500 bg-gray-50/50">
                    🎉 Tuyệt vời! Không có khiếu nại hay gian lận nào cần xử lý.
                  </td>
                </tr>
              )}
              {reports.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900 border-r border-gray-50">#{r.id}</td>
                  <td className="py-3 px-4 text-gray-700">{r.citizenName}</td>
                  <td className="py-3 px-4 text-gray-500">{r.province || '—'}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium 
                      ${r.damageLevel === 3 ? 'bg-red-100 text-red-700' : 
                        r.damageLevel === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      Mức {r.damageLevel}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.evidenceImageUrl ? (
                      <a href={r.evidenceImageUrl} target="_blank" rel="noopener noreferrer" 
                         className="text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1">
                        🖼️ Xem ảnh
                      </a>
                    ) : (
                      <span className="text-gray-400">Không có</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded text-xs font-bold">
                       🚩 DISPUTED
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => handleResolve(r.id, false)}
                      disabled={processingId === r.id}
                      className="px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100 font-medium transition-colors disabled:opacity-50"
                      title="Bác bỏ hàng xóm, khôi phục hồ sơ cho người dân"
                    >
                      {processingId === r.id ? '...' : '✅ Bác bỏ Kháng cáo'}
                    </button>
                    <button
                      onClick={() => handleResolve(r.id, true)}
                      disabled={processingId === r.id}
                      className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 font-medium transition-colors disabled:opacity-50"
                      title="Chấp thuận hàng xóm, đóng băng hồ sơ gian lận này"
                    >
                      {processingId === r.id ? '...' : '❌ Hủy hồ sơ'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
