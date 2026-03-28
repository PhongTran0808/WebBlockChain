import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { shopApi } from '../../api/shopApi';
import { adminApi } from '../../api/adminApi';

const FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="48" height="48"%3E%3Crect width="48" height="48" fill="%23e5e7eb" rx="6"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-size="20"%3E📦%3C/text%3E%3C/svg%3E';

// ── Modal thêm / sửa hàng ────────────────────────────────────────────────────
function InventoryModal({ editItem, catalogItems, onClose, onSaved }) {
  const isEdit = !!editItem;

  const [selectedItemId, setSelectedItemId] = useState(editItem?.itemId ?? '');
  const [shopPrice, setShopPrice] = useState(editItem?.shopPrice ?? '');
  const [quantity, setQuantity] = useState(editItem?.quantity ?? '');
  const [status, setStatus] = useState(editItem?.status ?? 'ACTIVE');
  const [saving, setSaving] = useState(false);

  const selectedCatalog = catalogItems.find(i => i.id === Number(selectedItemId));
  const ceilingPrice = selectedCatalog?.priceTokens ?? editItem?.itemCeilingPrice ?? null;

  const priceError = shopPrice !== '' && ceilingPrice !== null && Number(shopPrice) > ceilingPrice;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (priceError) { toast.error('Giá bán vượt quá giá trần'); return; }
    setSaving(true);
    try {
      if (isEdit) {
        await shopApi.updateInventory(editItem.id, {
          shopPrice: Number(shopPrice),
          quantity: Number(quantity),
          status,
        });
        toast.success('Đã cập nhật kho hàng');
      } else {
        await shopApi.addToInventory({
          itemId: Number(selectedItemId),
          shopPrice: Number(shopPrice),
          quantity: Number(quantity),
        });
        toast.success('Đã thêm vào kho');
      }
      onSaved();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <h3 className="font-bold text-lg text-gray-800">
            {isEdit ? 'Cập nhật hàng trong kho' : '+ Thêm hàng vào kho'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Chọn vật phẩm — chỉ khi thêm mới */}
          {!isEdit && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Vật phẩm từ danh mục Admin</label>
              <select
                value={selectedItemId}
                onChange={e => { setSelectedItemId(e.target.value); setShopPrice(''); }}
                required
                className="w-full border rounded-xl px-3 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">-- Chọn vật phẩm --</option>
                {catalogItems.map(i => (
                  <option key={i.id} value={i.id}>
                    {i.name} (Giá trần: {i.priceTokens} token)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hiển thị vật phẩm đang sửa */}
          {isEdit && (
            <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
              <img
                src={editItem.itemImageUrl || FALLBACK_IMG}
                alt={editItem.itemName}
                className="w-12 h-12 object-cover rounded-lg"
                onError={e => { e.target.src = FALLBACK_IMG; }}
              />
              <div>
                <p className="font-medium text-gray-800">{editItem.itemName}</p>
                <p className="text-xs text-gray-500">Giá trần: {editItem.itemCeilingPrice} token</p>
              </div>
            </div>
          )}

          {/* Gợi ý giá trần */}
          {ceilingPrice !== null && (
            <div className={`text-xs px-3 py-2 rounded-lg ${priceError ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-700'}`}>
              {priceError
                ? `⚠️ Giá bán không được vượt quá ${ceilingPrice} token`
                : `💡 Giá tối đa cho phép: ${ceilingPrice} token`}
            </div>
          )}

          {/* Giá bán */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Giá bán của Shop (token)</label>
            <input
              type="number"
              min="1"
              max={ceilingPrice ?? undefined}
              value={shopPrice}
              onChange={e => setShopPrice(e.target.value)}
              required
              placeholder={ceilingPrice ? `Tối đa ${ceilingPrice}` : 'Nhập giá bán'}
              className={`w-full border rounded-xl px-3 h-11 text-sm focus:outline-none focus:ring-2
                ${priceError ? 'border-red-400 focus:ring-red-400' : 'focus:ring-blue-500'}`}
            />
          </div>

          {/* Số lượng */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Số lượng nhập kho</label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              required
              placeholder="0"
              className="w-full border rounded-xl px-3 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Trạng thái — chỉ khi sửa */}
          {isEdit && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Trạng thái</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full border rounded-xl px-3 h-11 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="ACTIVE">Đang bán</option>
                <option value="INACTIVE">Tạm ngừng</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving || priceError}
              className="flex-1 h-11 bg-blue-700 text-white rounded-xl font-semibold text-sm
                hover:bg-blue-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Đang lưu...</>
                : isEdit ? 'Cập nhật' : 'Thêm vào kho'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 h-11 bg-gray-100 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-200 transition-colors">
              Huỷ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Trang chính ──────────────────────────────────────────────────────────────
export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [catalogItems, setCatalogItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'add' | shopItem object

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      shopApi.getInventory(),
      adminApi.getPublicItems(),
    ])
      .then(([invRes, catRes]) => {
        setInventory(invRes.data);
        setCatalogItems(catRes.data.filter(i => i.status === 'ACTIVE'));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await shopApi.updateInventory(item.id, { status: newStatus });
      setInventory(inv => inv.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Thao tác thất bại');
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-xl font-bold text-gray-800">Kho hàng của Shop</h2>
        <button
          onClick={() => setModal('add')}
          className="px-4 h-9 bg-blue-700 text-white rounded-xl text-sm font-semibold hover:bg-blue-800 transition-colors">
          + Thêm hàng
        </button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : inventory.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-5xl mb-3">📦</p>
          <p className="font-medium text-gray-600 mb-1">Kho hàng trống</p>
          <p className="text-sm">Bấm "+ Thêm hàng" để bắt đầu nhập kho</p>
        </div>
      ) : (
        <div className="space-y-3">
          {inventory.map(item => (
            <div key={item.id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-opacity
                ${item.status === 'INACTIVE' ? 'opacity-60 border-gray-100' : 'border-gray-100'}`}>
              <div className="flex items-center gap-3 p-4">
                {/* Ảnh */}
                <img
                  src={item.itemImageUrl || FALLBACK_IMG}
                  alt={item.itemName}
                  className="w-14 h-14 object-cover rounded-xl shrink-0"
                  onError={e => { e.target.src = FALLBACK_IMG; }}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-gray-800 truncate">{item.itemName}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0
                      ${item.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {item.status === 'ACTIVE' ? 'Đang bán' : 'Tạm ngừng'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-blue-700 font-bold">{Number(item.shopPrice).toLocaleString()} token</span>
                    <span className="text-gray-400 text-xs">/ trần: {item.itemCeilingPrice}</span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-xs font-medium ${item.quantity === 0 ? 'text-red-500' : 'text-gray-600'}`}>
                      {item.quantity === 0 ? '⚠️ Hết hàng' : `Còn: ${item.quantity} sản phẩm`}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => setModal(item)}
                    className="px-3 h-8 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors">
                    Sửa
                  </button>
                  <button
                    onClick={() => handleToggleStatus(item)}
                    className={`px-3 h-8 rounded-lg text-xs font-medium transition-colors
                      ${item.status === 'ACTIVE'
                        ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                    {item.status === 'ACTIVE' ? 'Tạm ngừng' : 'Mở bán'}
                  </button>
                </div>
              </div>

              {/* Progress bar số lượng */}
              {item.quantity > 0 && (
                <div className="px-4 pb-3">
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (item.quantity / 50) * 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modal && (
        <InventoryModal
          editItem={modal === 'add' ? null : modal}
          catalogItems={catalogItems}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
