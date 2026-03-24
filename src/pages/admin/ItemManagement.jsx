import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { adminApi } from '../../api/adminApi';

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
  const [modal, setModal] = useState(null); // null | 'create' | item object

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
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>{['ID','Token ID','Tên','Giá','Trạng thái','Hành động'].map(h => (
              <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-4 py-3">{item.id}</td>
                <td className="px-4 py-3">{item.tokenId}</td>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3">{item.priceTokens} token</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium
                    ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => setModal(item)} className="text-blue-600 hover:underline text-xs">Sửa</button>
                  <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:underline text-xs">Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
