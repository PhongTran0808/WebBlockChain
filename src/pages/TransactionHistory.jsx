import { useEffect, useState } from 'react';
import { walletApi } from '../api/walletApi';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function TransactionHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await walletApi.getHistory();
      setHistory(res.data);
    } catch (e) {
      toast.error('Không thể tải lịch sử giao dịch');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const shortHash = (hash) => {
    if (!hash) return '---';
    if (hash.startsWith('fallback') || hash.startsWith('mock')) return 'Ngoại tuyến';
    return hash.slice(0, 10) + '...' + hash.slice(-8);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600">
              <span className="text-xl">←</span>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Sao kê Giao dịch</h1>
          </div>
          <button 
            onClick={loadHistory}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
          >
            🔄 Làm mới
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Stats Summary (Optional/Quick View) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Tổng giao dịch</p>
                <p className="text-2xl font-bold text-gray-900">{history.length}</p>
            </div>
            {user?.role === 'ADMIN' && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 bg-blue-50/30">
                    <p className="text-sm text-blue-600 mb-1 font-medium">Chế độ Kiểm toán</p>
                    <p className="text-xs text-blue-500 uppercase tracking-wider font-bold">Quản trị viên</p>
                </div>
            )}
        </div>

        {/* Desktop Table View */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Thời gian</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Loại</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Từ &rarr; Đến</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Số tiền (Token)</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Mã Hash Blockchain</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                    [1,2,3,4,5].map(i => (
                        <tr key={i} className="animate-pulse">
                            <td colSpan="5" className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                        </tr>
                    ))
                ) : (
                    history.map(tx => {
                        const isPlus = tx.isPlus;
                        return (
                            <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                    {formatDate(tx.createdAt)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                        ${isPlus === true ? 'bg-green-100 text-green-800' : isPlus === false ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                                        {tx.eventType || tx.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-900 font-medium">{tx.fromName}</span>
                                        <span className="text-[10px] text-gray-400">→ {tx.toName}</span>
                                    </div>
                                </td>
                                <td className={`px-6 py-4 text-sm font-bold text-right whitespace-nowrap
                                    ${isPlus === true ? 'text-green-600' : isPlus === false ? 'text-red-600' : 'text-gray-900'}`}>
                                    {isPlus === true ? '+' : isPlus === false ? '-' : ''}
                                    {tx.amount?.toLocaleString('vi-VN')}
                                </td>
                                <td className="px-6 py-4">
                                    {tx.txHash && !tx.txHash.includes('mock') && !tx.txHash.includes('fallback') ? (
                                        <a 
                                            href={`https://amoy.polygonscan.com/tx/${tx.txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-500 hover:underline font-mono"
                                        >
                                            {shortHash(tx.txHash)} ↗
                                        </a>
                                    ) : (
                                        <span className="text-xs text-gray-400 font-mono italic">
                                            {tx.txHash ? shortHash(tx.txHash) : 'N/A'}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })
                )}
                {!loading && history.length === 0 && (
                    <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                            Chưa ghi nhận giao dịch nào trong lịch sử.
                        </td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
