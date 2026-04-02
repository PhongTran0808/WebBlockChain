import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const PROVINCES = [
  'Lào Cai', 'Yên Bái', 'Thái Nguyên', 'Tuyên Quang', 'Hà Giang', 'Sơn La', 'Cao Bằng', 'Hòa Bình', 'Phú Thọ', 'Bắc Giang'
];

export default function ProvinceReport() {
  const [selectedProvince, setSelectedProvince] = useState(PROVINCES[0]);
  const [stats, setStats] = useState(null);
  const [citizens, setCitizens] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Giả lập lệnh gọi API lên Backend tổng hợp số liệu Tỉnh
    setLoading(true);
    const timer = setTimeout(() => {
      // Mock logic cho sinh động
      const seed = selectedProvince.length + selectedProvince.charCodeAt(0);
      const total = 50000 + seed * 2000; 
      const disbursed = total * (0.35 + (seed % 5) * 0.12);
      
      setStats({
          totalAllocated: total,
          disbursed: disbursed,
          progress: (disbursed / total) * 100
      });

      const mockCitizens = Array.from({length: 8}).map((_, i) => ({
          id: `CTZ-${seed}-${i}`,
          name: `Hộ Lường Văn ${String.fromCharCode(65 + ((i*seed) % 26))}`,
          cccd: `00${(seed*i)%9}${Math.floor(Math.random()*1e9)}`,
          wallet: `0x${Math.floor(Math.random()*1e16).toString(16)}...`,
          received: 200 + (i % 3) * 50,
          status: i % 5 === 0 ? 'PENDING' : 'DELIVERED',
          time: new Date(Date.now() - Math.random() * 86400000).toLocaleString('vi-VN')
      }));
      setCitizens(mockCitizens);
      
      setLoading(false);
    }, 800);

    return () => clearTimeout(timer);
  }, [selectedProvince]);

  return (
    <div className="min-h-screen bg-gray-50 pb-12 font-sans">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/transparency" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Báo cáo Địa phương</h1>
            <span className="bg-purple-100 text-purple-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider hidden sm:inline-block">DASHBOARD TỔNG HỢP</span>
          </div>
          
          <div className="flex items-center gap-3">
             <span className="text-sm text-gray-500 hidden md:inline-block">Chọn khu vực:</span>
             <select 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 outline-none font-semibold shadow-sm cursor-pointer"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
             >
                {PROVINCES.map(p => <option key={p} value={p}>{p}</option>)}
             </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
         <div className="mb-6 flex justify-between items-end">
            <div>
               <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Chiến dịch hỗ trợ <span className="text-blue-600">{selectedProvince}</span></h2>
               <p className="text-sm text-gray-500 mt-2">Cập nhật theo thời gian thực về tiến độ giải ngân tại địa bàn thông qua tổ chức kiểm toán On-chain.</p>
            </div>
         </div>

         {/* Thẻ Metric 3 Khối */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center relative overflow-hidden group">
               <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                  <svg className="w-32 h-32 text-blue-600" fill="currentColor" viewBox="0 0 20 20"><path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path><path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path></svg>
               </div>
               <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Tổng Quỹ Phân Bổ (Ví Escrow)</p>
               <h3 className="text-3xl font-extrabold text-gray-900">
                  {loading ? '---' : new Intl.NumberFormat('vi-VN').format(stats?.totalAllocated)} <span className="text-lg text-gray-400 font-medium">POL</span>
               </h3>
               <div className="mt-4 text-xs font-medium text-green-600 bg-green-50 w-fit px-2 py-1 rounded inline-flex items-center gap-1">
                  100% On-chain Verified
               </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center relative overflow-hidden group">
               <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                 <svg className="w-32 h-32 text-green-600" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>
               </div>
               <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">Đã Giải Ngân Thành Công</p>
               <h3 className="text-3xl font-extrabold text-green-600">
                  {loading ? '---' : new Intl.NumberFormat('vi-VN').format(stats?.disbursed.toFixed(0))} <span className="text-lg text-green-800/50 font-medium">POL</span>
               </h3>
               <div className="mt-4 text-xs font-medium text-blue-600 bg-blue-50 w-fit px-2 py-1 rounded inline-flex items-center gap-1">
                  Xác nhận chéo 3 bên
               </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
               <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Tốc độ & Tiến độ Phân Bổ</p>
               <div className="flex items-end gap-2 mb-2">
                 <h3 className="text-4xl font-extrabold text-blue-600">
                    {loading ? '--' : stats?.progress.toFixed(1)}%
                 </h3>
               </div>
               {/* Progress Bar Body */}
               <div className="w-full bg-gray-100 rounded-full h-3.5 mt-2 overflow-hidden shadow-inner flex">
                  <div 
                     className="bg-blue-600 h-3.5 rounded-full shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)] transition-all duration-1000 ease-out relative" 
                     style={{ width: `${loading ? 0 : stats?.progress}%` }}
                  >
                     {/* Gloss effect */}
                     <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/20 rounded-t-full"></div>
                  </div>
               </div>
               <p className="text-xs text-gray-400 mt-3 flex items-center justify-between">
                 <span>Khởi động: 0%</span>
                 <span>Mục tiêu: 100%</span>
               </p>
            </div>
         </div>

         {/* Bảng Danh Sách Người Nhận */}
         <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
               <h3 className="text-lg font-bold text-gray-900">Danh sách Thụ hưởng tại địa bàn ({citizens.length} hộ)</h3>
               <button className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
                 Xuất File Báo Cáo
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
               </button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left text-sm text-gray-600 border-collapse">
                 <thead className="bg-white border-b border-gray-100">
                   <tr>
                     <th className="px-6 py-4 font-bold text-gray-500">Tên Chủ Hộ</th>
                     <th className="px-6 py-4 font-bold text-gray-500">Đại diện (Địa chỉ Ví / CCCD)</th>
                     <th className="px-6 py-4 font-bold text-gray-500 text-right">Lượng Trợ Khấp</th>
                     <th className="px-6 py-4 font-bold text-gray-500 text-center">Trạng Thái</th>
                     <th className="px-6 py-4 font-bold text-gray-500 text-right">Cập Nhật Lúc</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50">
                   {loading ? (
                       [1,2,3,4].map(i => (
                           <tr key={i} className="animate-pulse">
                               <td colSpan="5" className="px-6 py-5"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                           </tr>
                       ))
                   ) : citizens.map((c) => (
                       <tr key={c.id} className="hover:bg-blue-50/30 transition-colors">
                           <td className="px-6 py-4 font-bold text-gray-800">{c.name}</td>
                           <td className="px-6 py-4">
                               <div className="flex flex-col">
                                  <span className="font-mono text-gray-900 text-xs">{c.cccd}</span>
                                  <span className="font-mono text-gray-400 text-[10px]">{c.wallet}</span>
                               </div>
                           </td>
                           <td className="px-6 py-4 text-right font-extrabold text-gray-800">
                               {c.received} <span className="text-gray-400 font-normal text-xs">POL</span>
                           </td>
                           <td className="px-6 py-4 text-center">
                               {c.status === 'DELIVERED' ? (
                                   <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
                                      ĐÃ NHẬN QUÀ
                                   </span>
                               ) : (
                                   <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide">
                                      ĐANG VẬN CHUYỂN
                                   </span>
                               )}
                           </td>
                           <td className="px-6 py-4 text-right font-mono text-xs text-gray-400">
                               {c.time}
                           </td>
                       </tr>
                   ))}
                 </tbody>
               </table>
            </div>
         </div>
      </div>
    </div>
  );
}
