import { useEffect, useState, useMemo } from 'react';
import { walletApi } from '../api/walletApi';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function TransactionHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // States cho Bộ lọc thông minh
  const [filterType, setFilterType] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

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

  const filteredHistory = useMemo(() => {
    return history.filter(tx => {
      // 1. Phân loại logic (Linh động tuỳ eventType của hệ thống)
      let matchType = true;
      const typeStr = (tx.eventType || tx.type || '').toUpperCase();
      if (filterType === 'DONATE') {
          matchType = typeStr.includes('DONATE') || tx.isPlus === true;
      } else if (filterType === 'WITHDRAW') {
          matchType = typeStr.includes('WITHDRAW') || typeStr.includes('PAY') || tx.isPlus === false;
      } else if (filterType === 'ALLOCATE') {
          matchType = typeStr.includes('ESCROW') || typeStr.includes('BATCH') || typeStr.includes('DELIVER');
      }

      // 2. Lọc thời gian DateRange
      let matchDate = true;
      if (tx.createdAt) {
          const tDate = new Date(tx.createdAt);
          if (startDate) {
              matchDate = matchDate && (tDate >= new Date(startDate));
          }
          if (endDate) {
              const eDate = new Date(endDate);
              eDate.setHours(23, 59, 59, 999);
              matchDate = matchDate && (tDate <= eDate);
          }
      }
      return matchType && matchDate;
    });
  }, [history, filterType, startDate, endDate]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
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
        
        {/* Smart Filters Dashboard */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center justify-between">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-500 mr-2 flex items-center gap-1">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                       Phân loại:
                    </span>
                    {['ALL', 'DONATE', 'ALLOCATE', 'WITHDRAW'].map(type => (
                        <button 
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors duration-200 
                                ${filterType === type ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            {type === 'ALL' ? 'Tất cả' : type === 'DONATE' ? '⬇ Gửi Quyên Góp' : type === 'ALLOCATE' ? '🔒 Khoá Quỹ' : '⬆ Giải Ngân'}
                        </button>
                    ))}
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 mr-1 flex items-center gap-1">
                       <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                       Thời gian:
                    </span>
                    <input type="date" className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                       value={startDate} onChange={e => setStartDate(e.target.value)} />
                    <span className="text-gray-400">-</span>
                    <input type="date" className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all" 
                       value={endDate} onChange={e => setEndDate(e.target.value)} />
                    
                    {(startDate || endDate) && (
                        <button onClick={() => { setStartDate(''); setEndDate(''); }} className="text-xs text-red-500 hover:text-red-700 hover:underline">Huỷ Lọc</button>
                    )}
                </div>
            </div>
            {/* Quick Stats Banner */}
            <div className="bg-blue-50 rounded-lg p-3 text-sm flex gap-6 text-blue-800 border border-blue-100">
                 <div><b>{filteredHistory.length}</b> Giao dịch khớp chuẩn</div>
            </div>
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
                    filteredHistory.map(tx => {
                        const isPlus = tx.isPlus;
                        return (
                            <tr key={tx.id} className="hover:bg-blue-50/20 transition-colors">
                                <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                                    {formatDate(tx.createdAt)}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide
                                        ${isPlus === true ? 'bg-green-100 text-green-800' : isPlus === false ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                        {tx.eventType || tx.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="text-sm text-gray-900 font-medium truncate max-w-[200px]" title={tx.fromName}>{tx.fromName}</span>
                                        <span className="text-[10px] text-gray-400">→ {tx.toName}</span>
                                    </div>
                                </td>
                                <td className={`px-6 py-4 text-sm font-bold text-right whitespace-nowrap
                                    ${isPlus === true ? 'text-green-600' : isPlus === false ? 'text-red-500' : 'text-gray-900'}`}>
                                    {isPlus === true ? '+' : isPlus === false ? '-' : ''}
                                    {tx.amount?.toLocaleString('vi-VN')}
                                </td>
                                <td className="px-6 py-4">
                                    {tx.txHash && !tx.txHash.includes('mock') && !tx.txHash.includes('fallback') ? (
                                        <a 
                                            href={`https://amoy.polygonscan.com/tx/${tx.txHash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-blue-500 flex items-center hover:text-blue-700 hover:underline font-mono"
                                        >
                                            {shortHash(tx.txHash)}
                                            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                        </a>
                                    ) : (
                                        <span className="text-xs text-gray-400 font-mono italic">
                                            {tx.txHash ? shortHash(tx.txHash) : 'Đang đợi Smart Contract'}
                                        </span>
                                    )}
                                </td>
                            </tr>
                        );
                    })
                )}
                {!loading && filteredHistory.length === 0 && (
                    <tr>
                        <td colSpan="5" className="px-6 py-12 text-center">
                            <span className="text-gray-500 block mb-2">Không tìm thấy giao dịch nào.</span>
                            {filterType !== 'ALL' && <button onClick={()=>setFilterType('ALL')} className="text-blue-600 hover:underline text-sm font-medium">Bỏ lọc hiện hành</button>}
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
