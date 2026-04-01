import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';

const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"%3E%3Crect width="50" height="50" fill="%23e5e7eb" rx="6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="20"%3E📦%3C/text%3E%3C/svg%3E';

function ItemModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item || { name: '', imageUrl: '', tokenId: '', priceTokens: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (item?.id) await adminApi.updateItem(item.id, form);
      else await adminApi.createItem(form);
      toast.success(item?.id ? 'Đã cập nhật' : 'Đã thêm vật phẩm');
      onSave();
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h3 className="font-bold text-lg mb-4">{item?.id ? 'Sửa vật phẩm' : 'Thêm vật phẩm mới'}</h3>

        {/* Preview ảnh khi nhập URL */}
        {form.imageUrl && (
          <div className="flex justify-center mb-4">
            <img
              src={form.imageUrl}
              alt="preview"
              className="w-20 h-20 object-cover rounded-xl border border-gray-200"
              onError={e => { e.target.src = FALLBACK_IMG; }}
            />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {[['name','Tên vật phẩm'],['imageUrl','URL hình ảnh'],['tokenId','Token ID'],['priceTokens','Giá (token)']].map(([k,l]) => (
            <input key={k} placeholder={l} value={form[k] || ''} required
              onChange={e => setForm(f => ({...f, [k]: e.target.value}))}
              className="w-full border rounded-lg px-3 h-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          ))}
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 h-10 bg-blue-700 text-white rounded-lg text-sm font-medium">Lưu</button>
            <button type="button" onClick={onClose} className="flex-1 h-10 bg-gray-100 rounded-lg text-sm">Huỷ</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ItemManagement() {
  const [items, setItems] = useState([]);
  const [modal, setModal] = useState(null);

  const load = () => adminApi.getItems().then(r => setItems(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (!confirm('Xoá vật phẩm này?')) return;
    await adminApi.deleteItem(id);
    toast.success('Đã xoá');
    load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">Quản lý Vật phẩm</h2>
        <button onClick={() => setModal('create')} className="px-4 h-9 bg-blue-700 text-white rounded-lg text-sm font-medium">
          + Thêm mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              {['ID', 'Hình ảnh', 'Tên', 'Giá', 'Trạng thái', 'Hành động'].map(h => (
                <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-400">{item.id}</td>
                <td className="px-4 py-3">
                  <img
                    src={item.imageUrl || FALLBACK_IMG}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg border border-gray-100"
                    onError={e => { e.target.src = FALLBACK_IMG; }}
                  />
                </td>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">{item.priceTokens} token</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                    ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => setModal(item)} className="text-blue-600 hover:underline text-xs">Sửa</button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline text-xs">Xoá</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        {items.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-10">Chưa có vật phẩm nào</p>
        )}
      </div>

      {modal && (
        <ItemModal
          item={modal === 'create' ? null : modal}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
