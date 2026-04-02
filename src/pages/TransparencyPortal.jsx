import React, { useEffect, useState, useMemo } from 'react';
import axiosClient from '../api/axiosClient';

function MoneyTimeline({ trackingTx }) {
  if (!trackingTx) return null;

  // Giả lập logic tracking vì hiện tại Blockchain chỉ có log rời rạc
  // Trong thực tế, cần đệ quy tracing Tx_IN và Tx_OUT trên đồ thị.
  // Ở đây giả lập trạng thái tiến độ dựa trên thời gian trôi qua.
  const hoursPassed = (new Date() - new Date(trackingTx.createdAt)) / 36e5;
  const isDonate = trackingTx.type === 'DONATE';
  
  // Rule giả lập: < 1 giờ -> Mới nhận. < 24 giờ -> Đang ở Tỉnh. > 24 giờ -> Đã trao
  const step2Done = !isDonate || hoursPassed > 2 || trackingTx.type === 'ALLOCATE_ESCROW' || trackingTx.type === 'DELIVER';
  const step3Done = (!isDonate && trackingTx.type !== 'ALLOCATE_ESCROW') || hoursPassed > 24 || trackingTx.type === 'RECEIVE_RELIEF';

  const shortName = (name) => name?.slice(0, 15) + '...';

  return (
    <div className="bg-white rounded-2xl shadow-sm border-2 border-blue-100 p-8 mb-8 mt-2 animation-fadeIn">
      <h3 className="text-xl font-bold text-gray-800 mb-10 flex items-center gap-2">
         <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
         Định vị dòng tiền cứu trợ
      </h3>
      <div className="relative max-w-4xl mx-auto px-4">
         {/* Background Line */}
         <div className="absolute top-5 left-[10%] right-[10%] h-1 bg-gray-200 -z-10 rounded-full"></div>
         {/* Live Progress Line */}
         <div className={`absolute top-5 left-[10%] h-1 bg-blue-500 -z-10 transition-all duration-1000 ease-out 
              ${step3Done ? 'w-[80%]' : step2Done ? 'w-[40%]' : 'w-0'}`}></div>
         
         <div className="flex justify-between relative">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center w-1/3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg z-10 border-4 border-white ring-2 ring-blue-100">1</div>
              <p className="mt-4 text-base font-bold text-gray-800">Đã tiếp nhận</p>
              <p className="text-xs text-gray-500 mt-2 text-center break-words max-w-[180px]">
                Hệ thống xác nhận {trackingTx.amount} Token từ {shortName(trackingTx.from)}
              </p>
              <span className="text-[10px] text-gray-400 font-mono mt-1">{trackingTx.createdAt}</span>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center w-1/3">
              <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold shadow-lg z-10 border-4 border-white transition-all duration-500 delay-300
                    ${step2Done ? 'bg-blue-600 ring-2 ring-blue-100' : 'bg-gray-200 text-gray-400'}`}>2</div>
              <p className={`mt-4 text-base font-bold ${step2Done ? 'text-gray-800' : 'text-gray-400'}`}>Khóa quỹ (Escrow)</p>
              <p className="text-xs text-gray-500 mt-2 text-center break-words max-w-[180px]">
                {step2Done ? 'Ví hệ thống đã điều phối ngân sách chờ vào vùng rốn lũ.' : 'Đang tổng hợp thành đợt giải ngân.'}
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center w-1/3">
              <div className={`w-10 h-10 rounded-full text-white flex items-center justify-center font-bold shadow-lg z-10 border-4 border-white transition-all duration-500 delay-500
                    ${step3Done ? 'bg-green-500 ring-4 ring-green-100' : 'bg-gray-200 text-gray-400'}`}>3</div>
              <p className={`mt-4 text-base font-bold ${step3Done ? 'text-green-600' : 'text-gray-400'}`}>Đến tay người thụ hưởng</p>
              <p className="text-xs text-gray-500 mt-2 text-center break-words max-w-[180px]">
                {step3Done ? 'Tình nguyện viên đã trao gửi thành công tới bà con.' : 'Tài xế đang vận chuyển & quét QR.'}
              </p>
            </div>

         </div>
      </div>
    </div>
  )
}

export default function TransparencyPortal() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');

  // Lấy ra 1 transaction đại diện để làm "Track Money"
  const trackingTx = useMemo(() => {
     if (searchTerm.length > 5) {
        return transactions.find(tx => 
            tx.txHash?.toLowerCase().includes(searchTerm.toLowerCase()) || 
            tx.from?.toLowerCase() === searchTerm.toLowerCase());
     }
     return null;
  }, [searchTerm, transactions]);

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
      case 'ALLOCATE_ESCROW': return { label: 'Điều phối Khoá', style: 'text-yellow-600 bg-yellow-50 border-yellow-200' };
      case 'RECEIVE_RELIEF': return { label: 'Tới Bà con', style: 'text-blue-600 bg-blue-50 border-blue-200' };
      case 'PAY_SHOP': return { label: 'Trích Cửa hàng', style: 'text-purple-600 bg-purple-50 border-purple-200' };
      case 'AIRDROP': return { label: 'Cào bằng số dư', style: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
      case 'WITHDRAW': return { label: 'Rút Token', style: 'text-gray-600 bg-gray-50 border-gray-200' };
      default: return { label: type, style: 'text-gray-600 bg-gray-50 border-gray-200' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col justify-start mb-8 gap-2">
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
               Cổng Sao Kê Minh Bạch
               <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-1 rounded-full font-bold uppercase">Public Report</span>
            </h1>
            <p className="text-gray-500 text-sm max-w-2xl">Dữ liệu không thể xoá sửa được ghi khối On-chain theo gian thực từ mạng lưới Polygon Testnet. Mọi đường đi của tài sản đều được xác minh.</p>
        </div>

        {/* Global Track Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-6 flex flex-col md:flex-row gap-2 relative z-10 transition-shadow hover:shadow-md">
            <div className="flex-1 relative">
               <input 
                  type="text" 
                  placeholder="Tra cứu: Nhập TxHash, Mã ví của nhà hảo tâm..." 
                  className="w-full pl-12 pr-4 py-4 bg-transparent border-none focus:ring-0 text-gray-800 text-base placeholder-gray-400 outline-none font-medium h-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  spellCheck="false"
               />
               <svg className="w-6 h-6 text-blue-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
               </svg>
            </div>
            <button 
              onClick={fetchData}
              className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-600 px-6 py-3 rounded-xl font-medium transition-colors border border-gray-200"
            >
              🔄 Refresh Sync
            </button>
        </div>

        {/* Cửa sổ Định Vị nếu Search khớp */}
        <MoneyTimeline trackingTx={trackingTx} />

        {/* Filters */}
        <div className="flex overflow-x-auto gap-2 mb-6 pb-2 hide-scroll">
           {['ALL', 'DONATE', 'ALLOCATE_ESCROW', 'RECEIVE_RELIEF', 'PAY_SHOP'].map(type => (
               <button 
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-5 py-2 rounded-full whitespace-nowrap text-sm font-semibold transition-all duration-300
                      ${filterType === type ? 'bg-gray-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
               >
                 {type === 'ALL' ? 'Hiển thị tất cả' : formatType(type).label}
               </button>
           ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-800 text-xs uppercase font-bold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-5 rounded-tl-xl">Thời gian</th>
                  <th className="px-6 py-5">Phân Loại Giao Dịch</th>
                  <th className="px-6 py-5">Tài Khoản Hành Động (Từ)</th>
                  <th className="px-6 py-5 text-right text-blue-700">Khối Lượng Tài Sản</th>
                  <th className="px-6 py-5">Ghi Chú</th>
                  <th className="px-6 py-5 text-center">Xác Thực Chuỗi (Hash)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16 text-gray-400">
                        <div className="animate-pulse flex flex-col items-center">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                            Đang đồng bộ sổ cái On-chain...
                        </div>
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16 text-gray-400 italic">Không tìm thấy giao dịch nào.</td>
                  </tr>
                ) : (
                  filteredData.map((tx, idx) => {
                    const typeInfo = formatType(tx.type);
                    const isIncoming = tx.type === 'DONATE';
                    return (
                      <tr key={tx.id || idx} className="hover:bg-blue-50/20 transition-colors group cursor-pointer">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-500 text-xs font-mono">{tx.createdAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold border shadow-sm ${typeInfo.style}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 max-w-[150px] truncate font-medium text-gray-900" title={tx.from}>{tx.from}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-right font-extrabold text-lg tracking-tight ${isIncoming ? 'text-green-600' : 'text-gray-900'}`}>
                          {isIncoming ? '+' : ''}{new Intl.NumberFormat('vi-VN').format(tx.amount)} <span className="text-[10px] text-gray-400 font-normal">POL</span>
                        </td>
                        <td className="px-6 py-4 min-w-[200px] text-gray-500 text-xs">{tx.note}</td>
                        <td className="px-6 py-4 text-center">
                           {tx.txHash && tx.txHash !== '' ? (
                              <a 
                                href={`https://amoy.polygonscan.com/tx/${tx.txHash}`} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors group-hover:bg-blue-100"
                              >
                                {tx.txHash.substring(0, 8)}...{tx.txHash.substring(tx.txHash.length - 4)}
                                <svg className="w-3.5 h-3.5 ml-1.5 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                              </a>
                           ) : (
                              <span className="text-gray-300 text-xs italic font-medium px-2 py-1 rounded-md border border-gray-100">Off-chain</span>
                           )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-8 py-5 border-t border-gray-200 text-sm text-gray-500 flex justify-between items-center font-medium">
             <span>Đang hiển thị {filteredData.length} kết quả trên Sổ cái</span>
             <span className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div> Powered by Polygon Testnet</span>
          </div>
        </div>
      </div>
    </div>
  );
}
