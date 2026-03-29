import React, { useEffect, useState, useMemo } from 'react';
import axiosClient from '../api/axiosClient';

export default function TransparencyPortal() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/api/transactions/public');
      setTransactions(res.data);
    } catch (error) {
      console.error('Lỗi lấy sao kê:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    return transactions.filter(tx => {
      const matchType = filterType === 'ALL' || tx.type === filterType;
      const term = searchTerm.toLowerCase();
      const matchSearch = tx.txHash?.toLowerCase().includes(term) ||
                          tx.from?.toLowerCase().includes(term) ||
                          tx.to?.toLowerCase().includes(term) ||
                          tx.note?.toLowerCase().includes(term);
      return matchType && matchSearch;
    });
  }, [transactions, searchTerm, filterType]);

  const formatType = (type) => {
    switch (type) {
      case 'DONATE': return { label: 'Quyên góp', style: 'text-green-600 bg-green-50 border-green-200' };
      case 'ALLOCATE_ESCROW': return { label: 'Tạo Lô Hàng', style: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
      case 'RECEIVE_RELIEF': return { label: 'Nhận Cứu trợ', style: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'PAY_SHOP': return { label: 'Thanh toán Shop', style: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'AIRDROP': return { label: 'Airdrop Dư nợ', style: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'WITHDRAW': return { label: 'Rút Token', style: 'text-gray-600 bg-gray-50 border-gray-200' };
      default: return { label: type, style: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold border-l-4 border-blue-600 pl-4 text-gray-800 tracking-tight">Cổng Sao Kê Minh Bạch</h1>
            <p className="text-gray-500 mt-2 ml-5">Dữ liệu được cập nhật Real-time từ Polygon Amoy Testnet</p>
          </div>
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Làm mới
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
             <input 
                type="text" 
                placeholder="Tìm kiếm TxHash, Tên người gửi/nhận, Ghi chú..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
             <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
             </svg>
          </div>
          <select 
            className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[200px]"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="ALL">Tất cả Giao dịch</option>
            <option value="DONATE">Quyên góp</option>
            <option value="ALLOCATE_ESCROW">Tạo Lô (Escrow)</option>
            <option value="RECEIVE_RELIEF">Nhận Cứu trợ</option>
            <option value="PAY_SHOP">Thanh toán Shop</option>
            <option value="AIRDROP">Airdrop Đồng đều</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-700 text-xs uppercase font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Thời gian</th>
                  <th className="px-6 py-4">Loại GD</th>
                  <th className="px-6 py-4">Từ</th>
                  <th className="px-6 py-4">Đến</th>
                  <th className="px-6 py-4 text-right">Số lượng (POL)</th>
                  <th className="px-6 py-4">Nội dung</th>
                  <th className="px-6 py-4 text-center">TxHash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10">Đang tải dữ liệu on-chain...</td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-gray-500">Khống tìm thấy giao dịch nào phù hợp.</td>
                  </tr>
                ) : (
                  filteredData.map((tx, idx) => {
                    const typeInfo = formatType(tx.type);
                    const isIncoming = tx.type === 'DONATE';
                    return (
                      <tr key={tx.id || idx} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs font-mono">{tx.createdAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${typeInfo.style}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-[150px] truncate font-medium text-gray-800" title={tx.from}>{tx.from}</td>
                        <td className="px-6 py-4 max-w-[150px] truncate font-medium text-gray-800" title={tx.to}>{tx.to}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right font-bold ${isIncoming ? 'text-green-600' : 'text-blue-600'}`}>
                          {isIncoming ? '+' : ''}{new Intl.NumberFormat('vi-VN').format(tx.amount)}
                        </td>
                        <td className="px-6 py-4 min-w-[200px] text-gray-600">{tx.note}</td>
                        <td className="px-6 py-4 text-center">
                           {tx.txHash && tx.txHash !== '' ? (
                              <a 
                                href={`https://amoy.polygonscan.com/tx/${tx.txHash}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center text-blue-500 hover:text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs font-mono transition-colors"
                              >
                                {tx.txHash.substring(0, 6)}...{tx.txHash.substring(tx.txHash.length - 4)}
                                <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                              </a>
                           ) : (
                              <span className="text-gray-400 text-xs italic">Off-chain</span>
                           )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 text-sm text-gray-500 flex justify-between">
             <span>Hiển thị {filteredData.length} giao dịch ghi nhận {filterType === 'ALL' ? 'toàn hệ thống' : 'theo loại lọc'}</span>
             <span>Powered by Polygon Amoy</span>
          </div>
        </div>
      </div>
    </div>
  );
}
